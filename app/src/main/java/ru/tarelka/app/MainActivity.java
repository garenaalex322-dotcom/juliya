package ru.tarelka.app;

import android.Manifest;
import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.provider.Settings;
import android.view.View;
import android.view.WindowManager;
import android.provider.MediaStore;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.core.content.FileProvider;
import androidx.webkit.WebViewAssetLoader;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;
import java.util.concurrent.TimeUnit;

public class MainActivity extends Activity implements SensorEventListener {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + HOST + "/assets/index.html";
    private static final int REQ_STEPS = 42;
    private static final int REQ_FILE = 43;
    private ValueCallback<Uri[]> fileCallback;
    private Uri cameraUri;

    private WebView web;
    private SensorManager sensors;
    private Sensor stepSensor;
    private long lastPush = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.parseColor("#F5F3F4"));
        getWindow().setNavigationBarColor(Color.parseColor("#FFFFFF"));
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);

        sensors = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        stepSensor = sensors == null ? null : sensors.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);

        web = new WebView(this);
        setContentView(web);

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setTextZoom(100);

        web.addJavascriptInterface(new Bridge(), "AndroidBridge");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if (!request.isForMainFrame() || HOST.equals(u.getHost())) return false;
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, u));
                } catch (Exception ignored) {
                }
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                return openPhotoChooser();
            }
        });
        web.loadUrl(START_URL);

        if (stepSensor != null && StepWorker.hasPermission(this)) scheduleStepWork();
    }

    /** Выбор фото: камера или галерея. */
    private boolean openPhotoChooser() {
        Intent pick = new Intent(Intent.ACTION_GET_CONTENT);
        pick.addCategory(Intent.CATEGORY_OPENABLE);
        pick.setType("image/*");
        Intent chooser = Intent.createChooser(pick, "Фото еды");
        cameraUri = null;
        try {
            File dir = new File(getCacheDir(), "photos");
            if (!dir.exists()) dir.mkdirs();
            File f = new File(dir, "meal_" + System.currentTimeMillis() + ".jpg");
            cameraUri = FileProvider.getUriForFile(this, getPackageName() + ".files", f);
            Intent cam = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
            cam.putExtra(MediaStore.EXTRA_OUTPUT, cameraUri);
            cam.setClipData(ClipData.newRawUri("photo", cameraUri));
            cam.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
            chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{cam});
        } catch (Exception e) {
            cameraUri = null;
        }
        try {
            startActivityForResult(chooser, REQ_FILE);
            return true;
        } catch (Exception e) {
            if (fileCallback != null) fileCallback.onReceiveValue(null);
            fileCallback = null;
            return false;
        }
    }

    @Override
    @SuppressWarnings("deprecation")
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQ_FILE || fileCallback == null) return;
        Uri[] result = null;
        if (resultCode == RESULT_OK) {
            if (data != null && data.getData() != null) result = new Uri[]{data.getData()};
            else if (cameraUri != null) result = new Uri[]{cameraUri};
        }
        fileCallback.onReceiveValue(result);
        fileCallback = null;
    }

    private static String readAll(InputStream is) throws Exception {
        ByteArrayOutputStream bo = new ByteArrayOutputStream();
        byte[] buf = new byte[8192];
        int n;
        while ((n = is.read(buf)) > 0) bo.write(buf, 0, n);
        return bo.toString("UTF-8");
    }

    private void scheduleStepWork() {
        PeriodicWorkRequest req = new PeriodicWorkRequest.Builder(StepWorker.class, 15, TimeUnit.MINUTES).build();
        WorkManager.getInstance(getApplicationContext())
                .enqueueUniquePeriodicWork("steps", ExistingPeriodicWorkPolicy.KEEP, req);
    }

    private String stepsStatus() {
        if (stepSensor == null) return "none";
        if (StepWorker.hasPermission(this)) return "ok";
        SharedPreferences sp = getSharedPreferences("app", MODE_PRIVATE);
        boolean asked = sp.getBoolean("askedSteps", false);
        if (asked && Build.VERSION.SDK_INT >= 29
                && !shouldShowRequestPermissionRationale(Manifest.permission.ACTIVITY_RECOGNITION)) return "denied";
        return "need";
    }

    private void js(String code) {
        if (web != null) web.evaluateJavascript(code, null);
    }

    private void listenSteps(boolean on) {
        if (sensors == null || stepSensor == null) return;
        if (on && StepWorker.hasPermission(this)) {
            sensors.registerListener(this, stepSensor, SensorManager.SENSOR_DELAY_NORMAL);
        } else {
            sensors.unregisterListener(this);
        }
    }

    @Override
    public void onSensorChanged(SensorEvent e) {
        StepTracker.record(this, e.values[0], System.currentTimeMillis());
        long now = System.currentTimeMillis();
        if (now - lastPush > 3000) {
            lastPush = now;
            js("window.onSteps && window.onSteps(" + JSONObject.quote(StepTracker.json(this)) + ")");
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) { }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != REQ_STEPS) return;
        if (StepWorker.hasPermission(this)) {
            scheduleStepWork();
            listenSteps(true);
        }
        js("window.onStepsStatus && window.onStepsStatus(" + JSONObject.quote(stepsStatus()) + ")");
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        web.evaluateJavascript("(window.appBack && window.appBack()) ? 'y' : 'n'", value -> {
            if (value != null && value.contains("y")) return;
            finish();
        });
    }

    @Override
    protected void onPause() {
        super.onPause();
        listenSteps(false);
        if (web != null) web.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) web.onResume();
        listenSteps(true);
        js("window.onAppResume && window.onAppResume()");
    }

    /** Мост для страницы. Методы вызываются из JavaScript. */
    class Bridge {
        @JavascriptInterface
        public void copy(final String text) {
            runOnUiThread(() -> {
                ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                if (cm != null) cm.setPrimaryClip(ClipData.newPlainText("Тарелка и штанга", text));
            });
        }

        @JavascriptInterface
        public void share(final String text) {
            runOnUiThread(() -> {
                Intent send = new Intent(Intent.ACTION_SEND);
                send.setType("text/plain");
                send.putExtra(Intent.EXTRA_TEXT, text);
                startActivity(Intent.createChooser(send, "Отправить отчёт"));
            });
        }

        @JavascriptInterface
        public String stepsStatus() {
            return MainActivity.this.stepsStatus();
        }

        @JavascriptInterface
        public String stepsJson() {
            return StepTracker.json(MainActivity.this);
        }

        @JavascriptInterface
        public void requestSteps() {
            runOnUiThread(() -> {
                if (Build.VERSION.SDK_INT < 29 || StepWorker.hasPermission(MainActivity.this)) {
                    scheduleStepWork();
                    listenSteps(true);
                    js("window.onStepsStatus && window.onStepsStatus(" + JSONObject.quote(MainActivity.this.stepsStatus()) + ")");
                    return;
                }
                getSharedPreferences("app", MODE_PRIVATE).edit().putBoolean("askedSteps", true).apply();
                requestPermissions(new String[]{Manifest.permission.ACTIVITY_RECOGNITION}, REQ_STEPS);
            });
        }

        @JavascriptInterface
        public void openAppSettings() {
            runOnUiThread(() -> {
                try {
                    startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                            Uri.fromParts("package", getPackageName(), null)));
                } catch (Exception ignored) {
                }
            });
        }

        @JavascriptInterface
        @SuppressWarnings("deprecation")
        public void vibrate(final int ms) {
            Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (v == null || !v.hasVibrator()) return;
            v.vibrate(VibrationEffect.createOneShot(Math.max(50, Math.min(ms, 2000)), VibrationEffect.DEFAULT_AMPLITUDE));
        }

        /** POST-запрос в фоне (для распознавания еды); ответ приходит в window.__httpDone. */
        @JavascriptInterface
        public void httpPost(final String id, final String url, final String headersJson, final String body) {
            new Thread(() -> {
                int code;
                String text;
                HttpURLConnection c = null;
                try {
                    c = (HttpURLConnection) new URL(url).openConnection();
                    c.setRequestMethod("POST");
                    c.setDoOutput(true);
                    c.setConnectTimeout(20000);
                    c.setReadTimeout(90000);
                    JSONObject h = new JSONObject(headersJson);
                    Iterator<String> it = h.keys();
                    while (it.hasNext()) {
                        String k = it.next();
                        c.setRequestProperty(k, h.getString(k));
                    }
                    byte[] b = body.getBytes(StandardCharsets.UTF_8);
                    c.setFixedLengthStreamingMode(b.length);
                    try (OutputStream os = c.getOutputStream()) {
                        os.write(b);
                    }
                    code = c.getResponseCode();
                    InputStream is = code >= 400 ? c.getErrorStream() : c.getInputStream();
                    text = is == null ? "" : readAll(is);
                } catch (Exception e) {
                    code = -1;
                    text = String.valueOf(e.getMessage());
                } finally {
                    if (c != null) c.disconnect();
                }
                final String js = "window.__httpDone && window.__httpDone(" + JSONObject.quote(id) + "," + code + "," + JSONObject.quote(text) + ")";
                runOnUiThread(() -> js(js));
            }).start();
        }

        @JavascriptInterface
        public void keepScreenOn(final boolean on) {
            runOnUiThread(() -> {
                if (on) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            });
        }
    }
}
