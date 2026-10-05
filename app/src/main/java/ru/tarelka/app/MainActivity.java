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

import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.FileProvider;
import androidx.webkit.WebViewAssetLoader;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;

import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.common.moduleinstall.ModuleInstall;
import com.google.android.gms.common.moduleinstall.ModuleInstallClient;
import com.google.android.gms.common.moduleinstall.ModuleInstallRequest;
import com.google.mlkit.common.MlKitException;
import com.google.mlkit.vision.barcode.common.Barcode;
import com.google.mlkit.vision.codescanner.GmsBarcodeScanner;
import com.google.mlkit.vision.codescanner.GmsBarcodeScannerOptions;
import com.google.mlkit.vision.codescanner.GmsBarcodeScanning;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

public class MainActivity extends Activity implements SensorEventListener {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + HOST + "/assets/index.html";
    private static final String USER_AGENT = "TarelkaShtanga/1.0 (Android)";
    private static final int REQ_STEPS = 42;
    private static final int REQ_FILE = 43;
    private static final int REQ_NOTIF = 44;
    private ValueCallback<Uri[]> fileCallback;
    private Uri cameraUri;
    private boolean fileMultiple;

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
                fileMultiple = params != null && params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE;
                if (params != null && !acceptsOnlyImages(params.getAcceptTypes())) return openAnyFileChooser();
                return openPhotoChooser();
            }
        });
        web.loadUrl(START_URL);

        if (stepSensor != null && StepWorker.hasPermission(this)) scheduleStepWork();

        // Будильники напоминаний сбрасываются при принудительной остановке приложения — ставим заново.
        try {
            Reminders.ensureChannel(this);
            Reminders.rescheduleAll(getApplicationContext());
        } catch (Exception ignored) {
        }
    }

    /** accept у поля выбора файла: пусто или только картинки → выбор фото с камерой. */
    private static boolean acceptsOnlyImages(String[] types) {
        if (types == null) return true;
        for (String t : types) {
            if (t == null) continue;
            for (String part : t.split(",")) {
                String p = part.trim().toLowerCase(Locale.ROOT);
                if (p.isEmpty()) continue;
                if (p.startsWith("image/")) continue;
                if (p.matches("\\.(jpe?g|png|webp|gif|heic|heif|bmp)")) continue;
                return false;
            }
        }
        return true;
    }

    /** Выбор произвольного файла (если страница попросит не картинку). */
    private boolean openAnyFileChooser() {
        cameraUri = null;
        Intent pick = new Intent(Intent.ACTION_GET_CONTENT);
        pick.addCategory(Intent.CATEGORY_OPENABLE);
        pick.setType("*/*");
        if (fileMultiple) pick.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
        try {
            startActivityForResult(Intent.createChooser(pick, "Выберите файл"), REQ_FILE);
            return true;
        } catch (Exception e) {
            if (fileCallback != null) fileCallback.onReceiveValue(null);
            fileCallback = null;
            return false;
        }
    }

    /** Выбор фото: камера или галерея. */
    private boolean openPhotoChooser() {
        Intent pick = new Intent(Intent.ACTION_GET_CONTENT);
        pick.addCategory(Intent.CATEGORY_OPENABLE);
        pick.setType("image/*");
        if (fileMultiple) pick.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
        Intent chooser = Intent.createChooser(pick, "Фото");
        cameraUri = null;
        try {
            File dir = new File(getCacheDir(), "photos");
            if (!dir.exists()) dir.mkdirs();
            File f = new File(dir, "photo_" + System.currentTimeMillis() + ".jpg");
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
            ClipData clip = data == null ? null : data.getClipData();
            if (fileMultiple && clip != null && clip.getItemCount() > 0) {
                List<Uri> list = new ArrayList<>();
                for (int i = 0; i < clip.getItemCount(); i++) {
                    Uri u = clip.getItemAt(i).getUri();
                    if (u != null) list.add(u);
                }
                if (!list.isEmpty()) result = list.toArray(new Uri[0]);
            }
            if (result == null) {
                if (data != null && data.getData() != null) result = new Uri[]{data.getData()};
                else if (cameraUri != null) result = new Uri[]{cameraUri};
            }
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

    /** Разрешение на уведомления: ok — можно, need — можно спросить, denied — только через настройки. */
    private String notifStatus() {
        if (Build.VERSION.SDK_INT < 33) {
            if (!NotificationManagerCompat.from(this).areNotificationsEnabled()) return "denied";
            return Reminders.channelBlocked(this) ? "denied" : "ok";
        }
        if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
            if (!NotificationManagerCompat.from(this).areNotificationsEnabled()) return "denied";
            return Reminders.channelBlocked(this) ? "denied" : "ok";
        }
        boolean asked = getSharedPreferences("app", MODE_PRIVATE).getBoolean("askedNotif", false);
        if (asked && !shouldShowRequestPermissionRationale(Manifest.permission.POST_NOTIFICATIONS)) return "denied";
        return "need";
    }

    private void reportNotif() {
        js("window.__onNotifPerm && window.__onNotifPerm(" + JSONObject.quote(notifStatus()) + ")");
    }

    // ---------- сканер штрихкодов (Google Code Scanner, без разрешения на камеру) ----------

    private void barcodeResult(final String code, final String err) {
        final String js = "window.__onBarcode && window.__onBarcode("
                + (code == null ? "null" : JSONObject.quote(code))
                + (err == null ? "" : "," + JSONObject.quote(err)) + ")";
        runOnUiThread(() -> js(js));
    }

    private void startBarcodeScan() {
        try {
            int gms = GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(this);
            if (gms == ConnectionResult.SERVICE_MISSING || gms == ConnectionResult.SERVICE_DISABLED
                    || gms == ConnectionResult.SERVICE_INVALID) {
                barcodeResult(null, "unavailable");
                return;
            }
            GmsBarcodeScannerOptions opts = new GmsBarcodeScannerOptions.Builder()
                    .setBarcodeFormats(Barcode.FORMAT_EAN_13, Barcode.FORMAT_EAN_8,
                            Barcode.FORMAT_UPC_A, Barcode.FORMAT_UPC_E)
                    .enableAutoZoom()
                    .build();
            final GmsBarcodeScanner scanner = GmsBarcodeScanning.getClient(this, opts);
            scanner.startScan()
                    .addOnSuccessListener(barcode -> {
                        String v = barcode == null ? null : barcode.getRawValue();
                        if ((v == null || v.isEmpty()) && barcode != null) v = barcode.getDisplayValue();
                        if (v == null || v.isEmpty()) barcodeResult(null, "empty");
                        else barcodeResult(v.trim(), null);
                    })
                    .addOnCanceledListener(() -> barcodeResult(null, "canceled"))
                    .addOnFailureListener(err -> onScanFailed(scanner, err));
        } catch (Throwable t) {
            barcodeResult(null, "unavailable");
        }
    }

    private void onScanFailed(GmsBarcodeScanner scanner, Exception err) {
        if (err instanceof MlKitException) {
            int code = ((MlKitException) err).getErrorCode();
            if (code == 201) { // CODE_SCANNER_CANCELLED
                barcodeResult(null, "canceled");
                return;
            }
            if (code == 204) { // CODE_SCANNER_TASK_IN_PROGRESS
                barcodeResult(null, "busy");
                return;
            }
            if (code == 207) { // CODE_SCANNER_GOOGLE_PLAY_SERVICES_VERSION_TOO_OLD
                barcodeResult(null, "unavailable");
                return;
            }
        }
        // Скорее всего, модуль сканера ещё не скачан — проверяем и просим установить.
        try {
            final ModuleInstallClient mic = ModuleInstall.getClient(this);
            mic.areModulesAvailable(scanner)
                    .addOnSuccessListener(r -> {
                        if (r.areModulesAvailable()) barcodeResult(null, scanError(err));
                        else installScanner(mic, scanner, err);
                    })
                    .addOnFailureListener(e2 -> barcodeResult(null, "unavailable"));
        } catch (Throwable t) {
            barcodeResult(null, "unavailable");
        }
    }

    private void installScanner(ModuleInstallClient mic, GmsBarcodeScanner scanner, Exception err) {
        try {
            ModuleInstallRequest req = ModuleInstallRequest.newBuilder().addApi(scanner).build();
            mic.installModules(req)
                    .addOnSuccessListener(r -> {
                        if (r.areModulesAlreadyInstalled()) barcodeResult(null, scanError(err));
                        else barcodeResult(null, "installing");
                    })
                    .addOnFailureListener(e2 -> barcodeResult(null, "unavailable"));
        } catch (Throwable t) {
            barcodeResult(null, "unavailable");
        }
    }

    /** Короткий текст ошибки сканера для страницы. */
    private static String scanError(Exception e) {
        if (e instanceof MlKitException && ((MlKitException) e).getErrorCode() == MlKitException.UNAVAILABLE) {
            return "unavailable";
        }
        if (e instanceof ApiException) {
            int s = ((ApiException) e).getStatusCode();
            if (s == ConnectionResult.SERVICE_MISSING || s == ConnectionResult.SERVICE_DISABLED
                    || s == ConnectionResult.SERVICE_INVALID || s == ConnectionResult.API_UNAVAILABLE
                    || s == ConnectionResult.SERVICE_VERSION_UPDATE_REQUIRED) return "unavailable";
        }
        String m = e == null ? null : e.getMessage();
        if (m == null || m.trim().isEmpty()) m = e == null ? "error" : e.getClass().getSimpleName();
        m = m.trim();
        return m.length() > 120 ? m.substring(0, 120) : m;
    }

    // ---------- HTTP ----------

    /** Запрос в фоне; ответ приходит в window.__httpDone(id, code, text). code -1 — ошибка сети. */
    private void http(final String method, final String id, final String url, final String headersJson, final String body) {
        new Thread(() -> {
            int code;
            String text;
            HttpURLConnection c = null;
            try {
                boolean post = "POST".equals(method);
                c = (HttpURLConnection) new URL(url).openConnection();
                c.setRequestMethod(method);
                c.setConnectTimeout(20000);
                c.setReadTimeout(post ? 90000 : 30000);
                boolean hasUa = false;
                if (headersJson != null && !headersJson.trim().isEmpty() && !"null".equals(headersJson.trim())) {
                    JSONObject h = new JSONObject(headersJson);
                    Iterator<String> it = h.keys();
                    while (it.hasNext()) {
                        String k = it.next();
                        if ("user-agent".equalsIgnoreCase(k)) hasUa = true;
                        c.setRequestProperty(k, h.getString(k));
                    }
                }
                if (!post && !hasUa) c.setRequestProperty("User-Agent", USER_AGENT);
                if (post) {
                    c.setDoOutput(true);
                    byte[] b = (body == null ? "" : body).getBytes(StandardCharsets.UTF_8);
                    c.setFixedLengthStreamingMode(b.length);
                    try (OutputStream os = c.getOutputStream()) {
                        os.write(b);
                    }
                }
                code = c.getResponseCode();
                InputStream is = code >= 400 ? c.getErrorStream() : c.getInputStream();
                text = is == null ? "" : readAll(is);
            } catch (Exception e) {
                code = -1;
                String m = e.getMessage();
                text = m == null || m.isEmpty() ? e.getClass().getSimpleName() : m;
            } finally {
                if (c != null) c.disconnect();
            }
            final String js = "window.__httpDone && window.__httpDone(" + JSONObject.quote(id) + "," + code + "," + JSONObject.quote(text) + ")";
            runOnUiThread(() -> js(js));
        }).start();
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
        if (requestCode == REQ_NOTIF) {
            Reminders.ensureChannel(this);
            reportNotif();
            return;
        }
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
            http("POST", id, url, headersJson, body);
        }

        /** GET-запрос в фоне (например, поиск продукта по штрихкоду); ответ приходит в window.__httpDone. */
        @JavascriptInterface
        public void httpGet(final String id, final String url, final String headersJson) {
            http("GET", id, url, headersJson, null);
        }

        /** Сканирование штрихкода; результат — window.__onBarcode(code | null, err?). */
        @JavascriptInterface
        public void scanBarcode() {
            runOnUiThread(MainActivity.this::startBarcodeScan);
        }

        @JavascriptInterface
        public String notifStatus() {
            return MainActivity.this.notifStatus();
        }

        @JavascriptInterface
        public void requestNotif() {
            runOnUiThread(() -> {
                if (Build.VERSION.SDK_INT < 33
                        || checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
                    Reminders.ensureChannel(MainActivity.this);
                    reportNotif();
                    return;
                }
                getSharedPreferences("app", MODE_PRIVATE).edit().putBoolean("askedNotif", true).apply();
                requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQ_NOTIF);
            });
        }

        /** Заменяет все напоминания: JSON-массив {id, h, m, days[1..7], title, text}; "[]" — отменить все. */
        @JavascriptInterface
        public String setReminders(final String json) {
            try {
                return Reminders.set(getApplicationContext(), json);
            } catch (Exception e) {
                return "error: " + e.getMessage();
            }
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
