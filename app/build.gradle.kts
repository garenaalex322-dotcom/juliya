plugins {
    id("com.android.application")
}

val runNumber = (System.getenv("GITHUB_RUN_NUMBER") ?: "1").toInt()

android {
    namespace = "ru.tarelka.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "ru.tarelka.app"
        minSdk = 26
        targetSdk = 34
        versionCode = runNumber
        versionName = "1.$runNumber"
    }

    // Постоянный ключ подписи: новые версии ставятся поверх старых без потери записей.
    signingConfigs {
        create("release") {
            storeFile = file("tarelka.keystore")
            storePassword = "tarelka2026"
            keyAlias = "tarelka"
            keyPassword = "tarelka2026"
        }
    }

    buildTypes {
        getByName("release") {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation("androidx.webkit:webkit:1.11.0")
    implementation("androidx.work:work-runtime:2.9.1")
    implementation("androidx.annotation:annotation:1.8.0")
    implementation("androidx.core:core:1.13.1")
    // Сканер штрихкодов Google (интерфейс и камера — внутри Google Play services)
    implementation("com.google.android.gms:play-services-code-scanner:16.1.0")
    // ModuleInstall — догрузка модуля сканера, если его ещё нет на телефоне
    implementation("com.google.android.gms:play-services-base:18.5.0")
}
