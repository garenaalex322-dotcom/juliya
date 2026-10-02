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
}
