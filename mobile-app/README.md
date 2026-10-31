# NutriVision AI — Mobile Companion App (Android) 📱

An on-demand Android companion app that bridges **Samsung Health** steps and active calories into the deployed NutriVision AI web platform.

---

## Key Characteristics

- **Zero Background Battery Drain**: Runs strictly on-demand. Never runs background polling daemons or battery-draining periodic timers.
- **Official Health Connect API**: Uses Google & Samsung's official `androidx.health.connect` client to read verified step records from Samsung Health via `StepsRecord.COUNT_TOTAL` aggregation.
- **Direct Google Account Pairing**: Effortlessly pairs with the exact Google Account you use on the web platform (`/api/auth/companion-login`).
- **One-Tap Push to Web**: Open the app, inspect your verified today's steps and calories burned, and tap **"PUSH TO NUTRIVISION WEB"**.
- **Connected Directly to Production**:
  - Web Platform: `https://nutrivision-ai-mu.vercel.app`
  - Backend API: `https://nutrivision-backend-i9x2.onrender.com/api/activity/sync`

---

## 📥 Direct 1-Tap APK Installation (For Users)

Users do not need Android Studio or developer tools. Download the compiled `.apk` directly onto your phone:

👉 **[Download NutriVisionSync.apk (Latest)](https://github.com/doomsday-the/NutrivisionAI/releases/download/companion-latest/NutriVisionSync.apk)**

1. Tap the link above on your Android phone.
2. Open the downloaded file and tap **Install** *(allow install from browser if prompted)*.
3. Done! The app is on your Home Screen.

---

## Prerequisites (Samsung Phone Setup)

1. **Samsung Health** installed and tracking steps.
2. **Health Connect**:
   - On Android 14+: Built into the OS (`Settings > Health Connect`).
   - On Android 10–13: Install "Health Connect by Android" from Google Play.
3. **Samsung Health Privacy Consent (Crucial)**:
   - In Samsung Health: tap **⋮ (top-right menu)** ➔ **Settings** ➔ scroll to **Consents**.
   - Ensure **"Consent to the processing of health and wellness data"** is toggled **ON**.
4. **Link Samsung Health to Health Connect**:
   - In Samsung Health: **Settings** ➔ **Connected services** ➔ **Health Connect** ➔ toggle **Allow all**.

---

## How to Use the App

1. **Launch App**: Open **NutriVision Sync** on your phone.
2. **Pair Your Account**: Enter the Google email you use on the website (e.g. `aryaman.sinha.lko@gmail.com`) and tap **"Link to My Google Account"**.
3. **Grant Health Permission**: On first open, tap **"Grant Permission"** ➔ toggle **Allow all** (Steps & Calories).
4. **Inspect Metrics**: View your real-time today's steps & kcal synced from Samsung Health.
   - *Tip:* Pull down to refresh in Samsung Health if you just took steps, so it commits them to Health Connect.
5. **Push to Web**: Tap **`[ 🚀 PUSH TO NUTRIVISION WEB ]`**.
6. **Verify on Web**: Open **https://nutrivision-ai-mu.vercel.app** — your step counter and net daily calories update in real time!

---

## Building from Source (For Developers)

```bash
cd mobile-app
# Compile debug APK via Gradle
gradle assembleDebug
```
Or open `mobile-app` in **Android Studio** (Koala / 2024+) with Java 17 and `compileSdk = 35`.
