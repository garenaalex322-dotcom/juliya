package ru.tarelka.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * После перезагрузки, обновления приложения или смены времени/часового пояса
 * будильники сбрасываются или съезжают — ставим все напоминания заново.
 */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String a = intent == null ? null : intent.getAction();
        if (a == null) return;
        switch (a) {
            case Intent.ACTION_BOOT_COMPLETED:
            case Intent.ACTION_MY_PACKAGE_REPLACED:
            case Intent.ACTION_TIME_CHANGED:
            case Intent.ACTION_TIMEZONE_CHANGED:
                break;
            default:
                return;
        }
        try {
            Reminders.rescheduleAll(context.getApplicationContext());
        } catch (Exception ignored) {
        }
    }
}
