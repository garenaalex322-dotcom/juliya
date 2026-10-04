package ru.tarelka.app;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import java.util.Map;

/**
 * Учёт шагов по дням на основе датчика TYPE_STEP_COUNTER.
 * Датчик отдаёт общее число шагов с момента включения телефона; мы запоминаем
 * последнее показание и раскладываем прирост по календарным дням.
 */
public final class StepTracker {
    private static final String PREFS = "steps";
    private static final String DAY_PREFIX = "d_";

    private StepTracker() { }

    static String dayKey(long time) {
        return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date(time));
    }

    public static synchronized void record(Context ctx, float counter, long now) {
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        float last = sp.getFloat("lastCounter", -1f);
        long lastTime = sp.getLong("lastTime", 0L);
        SharedPreferences.Editor ed = sp.edit();
        if (last >= 0 && lastTime > 0) {
            float delta = counter - last;
            if (delta < 0) delta = counter; // телефон перезагружался — счётчик начался заново
            if (delta > 0 && delta < 100000) distribute(sp, ed, delta, lastTime, now);
        }
        ed.putFloat("lastCounter", counter).putLong("lastTime", now).apply();
    }

    /** Делит прирост шагов между днями пропорционально времени между показаниями. */
    private static void distribute(SharedPreferences sp, SharedPreferences.Editor ed, float delta, long from, long to) {
        if (to <= from) {
            add(sp, ed, dayKey(to), delta);
            return;
        }
        long total = to - from;
        long cur = from;
        float left = delta;
        while (true) {
            Calendar c = Calendar.getInstance();
            c.setTimeInMillis(cur);
            c.set(Calendar.HOUR_OF_DAY, 0);
            c.set(Calendar.MINUTE, 0);
            c.set(Calendar.SECOND, 0);
            c.set(Calendar.MILLISECOND, 0);
            c.add(Calendar.DAY_OF_MONTH, 1);
            long end = Math.min(c.getTimeInMillis(), to);
            float part = end >= to ? left : delta * (end - cur) / (float) total;
            add(sp, ed, dayKey(cur), part);
            left -= part;
            if (end >= to) break;
            cur = end;
        }
    }

    private static void add(SharedPreferences sp, SharedPreferences.Editor ed, String day, float v) {
        if (v <= 0) return;
        ed.putFloat(DAY_PREFIX + day, sp.getFloat(DAY_PREFIX + day, 0f) + v);
    }

    public static String json(Context ctx) {
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        JSONObject o = new JSONObject();
        for (Map.Entry<String, ?> e : sp.getAll().entrySet()) {
            if (!e.getKey().startsWith(DAY_PREFIX) || !(e.getValue() instanceof Float)) continue;
            try {
                o.put(e.getKey().substring(DAY_PREFIX.length()), Math.round((Float) e.getValue()));
            } catch (Exception ignored) {
            }
        }
        return o.toString();
    }
}
