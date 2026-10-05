package ru.tarelka.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Напоминания по расписанию: «в 8:30 по будням», «в 20:00 каждый день» и т. п.
 * Список приходит со страницы целиком (JSON-массив) и хранится в SharedPreferences;
 * для каждого напоминания ставится неточный будильник AlarmManager (без SCHEDULE_EXACT_ALARM).
 *
 * Неточный будильник Android может сдвинуть на 75% от оставшегося до него времени
 * (на Android 8–11 без ограничения сверху — то есть на дни). Поэтому идём «шагами»:
 * будильник ставится на середину оставшегося интервала, а когда до цели меньше
 * 15 минут — прямо на нужное время. Промежуточные срабатывания уведомлений не показывают.
 */
public final class Reminders {
    static final String CHANNEL = "reminders";
    static final String ACTION = "ru.tarelka.app.REMINDER";
    static final String EXTRA_ID = "id";
    static final String EXTRA_TARGET = "target";

    private static final String PREFS = "reminders";
    private static final String KEY_JSON = "json";
    private static final String KEY_IDS = "scheduled";
    private static final long DIRECT_MS = 15 * 60 * 1000L;
    private static final long EARLY_MS = 30 * 1000L;

    private Reminders() { }

    /** Одно напоминание. days[1..7] — ISO-дни недели (1 = понедельник … 7 = воскресенье). */
    static final class Item {
        String id;
        int h;
        int m;
        final boolean[] days = new boolean[8];
        String title;
        String text;
    }

    private static SharedPreferences prefs(Context ctx) {
        return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    /** Код запроса и номер уведомления — детерминированно по id. */
    static int requestCode(String id) {
        return id.hashCode();
    }

    // ---------- разбор ----------

    static List<Item> parse(String json) throws JSONException {
        List<Item> out = new ArrayList<>();
        if (json == null || json.trim().isEmpty() || "null".equals(json.trim())) return out;
        JSONArray arr = new JSONArray(json);
        Set<String> seen = new HashSet<>();
        for (int i = 0; i < arr.length(); i++) {
            JSONObject o = arr.optJSONObject(i);
            if (o == null) continue;
            Item it = new Item();
            it.id = o.isNull("id") ? "" : o.optString("id", "");
            if (it.id.isEmpty() || !seen.add(it.id)) continue;
            it.h = o.optInt("h", -1);
            it.m = o.optInt("m", 0);
            if (it.h < 0 || it.h > 23 || it.m < 0 || it.m > 59) continue;
            JSONArray d = o.optJSONArray("days");
            if (d == null) {
                // дни не указаны — каждый день
                for (int k = 1; k <= 7; k++) it.days[k] = true;
            } else {
                for (int k = 0; k < d.length(); k++) {
                    int v = d.optInt(k, 0);
                    if (v >= 1 && v <= 7) it.days[v] = true;
                }
            }
            it.title = o.isNull("title") ? "" : o.optString("title", "");
            it.text = o.isNull("text") ? "" : o.optString("text", "");
            out.add(it);
        }
        return out;
    }

    private static List<Item> load(Context ctx) {
        try {
            return parse(prefs(ctx).getString(KEY_JSON, "[]"));
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private static Item find(List<Item> items, String id) {
        for (Item it : items) if (it.id.equals(id)) return it;
        return null;
    }

    private static List<String> loadIds(Context ctx) {
        List<String> out = new ArrayList<>();
        try {
            JSONArray a = new JSONArray(prefs(ctx).getString(KEY_IDS, "[]"));
            for (int i = 0; i < a.length(); i++) out.add(a.getString(i));
        } catch (Exception ignored) {
        }
        return out;
    }

    // ---------- публичные операции ----------

    /** Заменяет ВСЕ напоминания новым списком. "[]" отменяет все. Возвращает "ok" или "error: …". */
    public static synchronized String set(Context ctx, String json) {
        List<Item> items;
        try {
            items = parse(json);
        } catch (Exception e) {
            return "error: " + e.getMessage();
        }
        prefs(ctx).edit().putString(KEY_JSON, json == null ? "[]" : json).apply();
        ensureChannel(ctx);
        apply(ctx, items);
        return "ok";
    }

    /** Перепланировать всё из сохранённого списка (запуск приложения, перезагрузка, смена времени). */
    public static synchronized void rescheduleAll(Context ctx) {
        apply(ctx, load(ctx));
    }

    /** Срабатывание будильника: показать уведомление (если пора) и поставить следующий. */
    static synchronized void fire(Context ctx, String id, long target) {
        Item it = find(load(ctx), id);
        if (it == null) {
            cancel(ctx, id);
            return;
        }
        long now = System.currentTimeMillis();
        if (target > 0 && now < target - EARLY_MS) {
            // промежуточный шаг — до цели ещё далеко
            arm(ctx, it, target, now);
            return;
        }
        show(ctx, it);
        schedule(ctx, it, now + 60 * 1000L);
    }

    // ---------- планирование ----------

    private static void apply(Context ctx, List<Item> items) {
        Set<String> keep = new HashSet<>();
        for (Item it : items) keep.add(it.id);
        for (String old : loadIds(ctx)) {
            if (!keep.contains(old)) cancel(ctx, old);
        }
        JSONArray ids = new JSONArray();
        long now = System.currentTimeMillis();
        for (Item it : items) {
            schedule(ctx, it, now);
            ids.put(it.id);
        }
        prefs(ctx).edit().putString(KEY_IDS, ids.toString()).apply();
    }

    /** Ближайшее время срабатывания строго позже from (местный часовой пояс) или -1, если дней нет. */
    static long nextTime(Item it, long from) {
        ZoneId zone = ZoneId.systemDefault();
        LocalDate day = Instant.ofEpochMilli(from).atZone(zone).toLocalDate();
        LocalTime time = LocalTime.of(it.h, it.m);
        for (int i = 0; i <= 7; i++) {
            LocalDate d = day.plusDays(i);
            if (!it.days[d.getDayOfWeek().getValue()]) continue;
            long t = ZonedDateTime.of(d, time, zone).toInstant().toEpochMilli();
            if (t > from) return t;
        }
        return -1;
    }

    private static void schedule(Context ctx, Item it, long from) {
        long target = nextTime(it, from);
        if (target <= 0) {
            cancel(ctx, it.id);
            return;
        }
        arm(ctx, it, target, System.currentTimeMillis());
    }

    private static void arm(Context ctx, Item it, long target, long now) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        long left = target - now;
        long at = left <= DIRECT_MS ? target : now + left / 2;
        try {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at,
                    alarmIntent(ctx, it.id, target, PendingIntent.FLAG_UPDATE_CURRENT));
        } catch (Exception ignored) {
            // например, превышен лимит будильников — молча пропускаем
        }
    }

    private static PendingIntent alarmIntent(Context ctx, String id, long target, int flags) {
        Intent i = new Intent(ctx, ReminderReceiver.class)
                .setAction(ACTION)
                // data делает PendingIntent уникальным для каждого id, даже если hashCode совпал
                .setData(new Uri.Builder().scheme("tarelka").authority("reminder").appendPath(id).build())
                .putExtra(EXTRA_ID, id)
                .putExtra(EXTRA_TARGET, target);
        return PendingIntent.getBroadcast(ctx, requestCode(id), i, flags | PendingIntent.FLAG_IMMUTABLE);
    }

    private static void cancel(Context ctx, String id) {
        try {
            PendingIntent pi = alarmIntent(ctx, id, 0, PendingIntent.FLAG_NO_CREATE);
            if (pi == null) return;
            AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
            if (am != null) am.cancel(pi);
            pi.cancel();
        } catch (Exception ignored) {
        }
    }

    // ---------- уведомления ----------

    static void ensureChannel(Context ctx) {
        try {
            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;
            NotificationChannel ch = new NotificationChannel(CHANNEL, "Напоминания", NotificationManager.IMPORTANCE_DEFAULT);
            ch.setDescription("Напоминания о еде, воде, тренировках и замерах");
            nm.createNotificationChannel(ch);
        } catch (Exception ignored) {
        }
    }

    /** Пользователь отключил именно канал «Напоминания» в настройках. */
    static boolean channelBlocked(Context ctx) {
        try {
            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            NotificationChannel ch = nm == null ? null : nm.getNotificationChannel(CHANNEL);
            return ch != null && ch.getImportance() == NotificationManager.IMPORTANCE_NONE;
        } catch (Exception e) {
            return false;
        }
    }

    static boolean canNotify(Context ctx) {
        if (Build.VERSION.SDK_INT >= 33
                && ctx.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            return false;
        }
        return NotificationManagerCompat.from(ctx).areNotificationsEnabled();
    }

    @SuppressLint("MissingPermission")
    private static void show(Context ctx, Item it) {
        if (!canNotify(ctx)) return;
        ensureChannel(ctx);
        int nid = requestCode(it.id);
        Intent open = new Intent(ctx, MainActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP)
                .putExtra("reminderId", it.id);
        PendingIntent pi = PendingIntent.getActivity(ctx, nid, open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        String title = it.title.isEmpty() ? ctx.getString(R.string.app_name) : it.title;
        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, CHANNEL)
                .setSmallIcon(R.drawable.ic_notif)
                .setColor(0xFFA32F58)
                .setContentTitle(title)
                .setAutoCancel(true)
                .setContentIntent(pi)
                .setCategory(NotificationCompat.CATEGORY_REMINDER)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT);
        if (!it.text.isEmpty()) {
            b.setContentText(it.text).setStyle(new NotificationCompat.BigTextStyle().bigText(it.text));
        }
        try {
            NotificationManagerCompat.from(ctx).notify(nid, b.build());
        } catch (Exception ignored) {
        }
    }
}
