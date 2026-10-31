# NutriVision AI — Mobile Companion App (Android) 📱

An on-demand Android companion app that bridges **Samsung Health** steps and active calories into the deployed NutriVision AI web platform.

---

## Key Characteristics

- **Zero Background Battery Drain**: Runs strictly on-demand. Never runs background polling daemons or periodic timers.
- **Official Health Connect API**: Uses Google & Samsung's official `androidx.health.connect` client to read verified step records from Samsung Health.
- **One-Tap Push to Web**: You open the app, inspect your live today's steps and calories burned, and press **"PUSH TO NUTRIVISION WEB"**.
- **Connected directly to Production**: Targets your live deployed Render backend:
  `https://nutrivision-backend-i9x2.onrender.com/api/activity/sync`

---

## Prerequisites

1. **Android Studio** (Hedgehog, Iguana, or Koala / 2024+)
2. **Android Device**: Samsung Galaxy phone (Android 10+, Android 14+ recommended).
3. **Samsung Health** installed and tracking steps.
4. **Health Connect**:
   - On Android 14+: Built into the OS.
   - On Android 10-13: Install "Health Connect by Android" from Google Play.

---

## How to Build & Install

### Step 1: Link Samsung Health to Health Connect (One-Time)
1. Open **Samsung Health** on your phone.
2. Tap the **3 dots ⋮** (top right) or **Profile** icon ➔ **Settings** (gear icon).
3. Scroll down to **Connected services** ➔ Tap **Health Connect**.
4. Enable **Allow all** (Steps, Active calories burned).

### Step 2: Open and Run in Android Studio
1. Launch **Android Studio**.
2. Select **Open** ➔ Navigate to `NutrivisionAI/mobile-app`.
3. Let Gradle sync project dependencies.
4. Connect your Samsung phone via USB (with **USB Debugging** enabled in Developer Options).
5. Click the green **Run (▶)** button in Android Studio.

---

## How to Use the App

1. **Launch App**: Open **NutriVision Sync** on your phone.
2. **Grant Permissions**: On first launch, tap **"Grant Health Permission"** ➔ check **Allow** for Steps and Total Calories Burned.
3. **Authenticate**: Tap **"Auto Login (Dev/Demo Bypass)"** (or paste your NutriVision JWT). Your credentials are saved locally.
4. **Inspect Metrics**: View your real-time today's steps & kcal synced from Samsung Health.
5. **Push to Web**: Tap **"PUSH TO NUTRIVISION WEB"**.
6. **Verify on Web**: Open `https://nutrivision-ai-mu.vercel.app` (or your local dashboard) — your calorie rings and step counts will instantly reflect your activity!
