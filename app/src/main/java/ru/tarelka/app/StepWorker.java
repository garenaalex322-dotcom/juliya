package ru.tarelka.app;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.Handler;
import android.os.HandlerThread;

import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/** Фоновая задача раз в ~15 минут: снимает показание датчика шагов, чтобы шаги попадали в правильный день. */
public class StepWorker extends Worker {
    public StepWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    static boolean hasPermission(Context ctx) {
        return Build.VERSION.SDK_INT < 29
                || ctx.checkSelfPermission(Manifest.permission.ACTIVITY_RECOGNITION) == PackageManager.PERMISSION_GRANTED;
    }

    @NonNull
    @Override
    public Result doWork() {
        Context ctx = getApplicationContext();
        if (!hasPermission(ctx)) return Result.success();
        SensorManager sm = (SensorManager) ctx.getSystemService(Context.SENSOR_SERVICE);
        Sensor s = sm == null ? null : sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        if (s == null) return Result.success();

        final CountDownLatch latch = new CountDownLatch(1);
        final float[] value = {-1f};
        HandlerThread thread = new HandlerThread("steps");
        thread.start();
        SensorEventListener l = new SensorEventListener() {
            @Override
            public void onSensorChanged(SensorEvent e) {
                value[0] = e.values[0];
                latch.countDown();
            }

            @Override
            public void onAccuracyChanged(Sensor sensor, int accuracy) { }
        };
        sm.registerListener(l, s, SensorManager.SENSOR_DELAY_NORMAL, new Handler(thread.getLooper()));
        try {
            latch.await(10, TimeUnit.SECONDS);
        } catch (InterruptedException ignored) {
        }
        sm.unregisterListener(l);
        thread.quitSafely();
        if (value[0] >= 0) StepTracker.record(ctx, value[0], System.currentTimeMillis());
        return Result.success();
    }
}
