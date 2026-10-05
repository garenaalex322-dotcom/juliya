package ru.tarelka.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Срабатывание будильника напоминания: уведомление и планирование следующего раза. */
public class ReminderReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String id = intent.getStringExtra(Reminders.EXTRA_ID);
        if (id == null) return;
        long target = intent.getLongExtra(Reminders.EXTRA_TARGET, 0L);
        try {
            Reminders.fire(context.getApplicationContext(), id, target);
        } catch (Exception ignored) {
        }
    }
}
