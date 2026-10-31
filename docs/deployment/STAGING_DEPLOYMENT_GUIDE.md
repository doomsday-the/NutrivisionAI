# NutriVision AI — Cloud Staging & Production Deployment Guide 🚀

This guide provides comprehensive instructions for deploying NutriVision AI across modern cloud infrastructure:
- **Production Web Dashboard:** Vercel (Vite 8 + React 19 + Tailwind CSS v4)
- **Production Backend API:** Render Web Service (Node.js 22 + TypeScript + Express + Prisma ORM)
- **Production Database:** Neon / Supabase (Cloud PostgreSQL 15/16 with 16 tables in 3NF, triggers, views, and stored procedures)
- **Computer Vision Service:** Render Web Service (Python 3.11 + FastAPI + MiDaS / Roboflow)
- **Multimodal AI Vision & Coach:** Google Gemini Multimodal Intelligence (`gemini-flash-lite-latest`, `gemini-3.1-flash-lite`, `gemini-3.5-flash`)
- **Native Android Companion:** Automated GitHub Actions build (`.github/workflows/build-apk.yml`) publishing direct APK releases to GitHub Releases (`companion-latest`).

---

## Live Deployments

| Component | Production URL | Platform |
|---|---|---|
| **Web Dashboard** | [https://nutrivision-ai-mu.vercel.app](https://nutrivision-ai-mu.vercel.app) | Vercel Edge |
| **Backend API** | [https://nutrivision-backend-i9x2.onrender.com](https://nutrivision-backend-i9x2.onrender.com) | Render (Singapore) |
| **Companion APK** | [Download NutriVisionSync.apk](https://github.com/doomsday-the/NutrivisionAI/releases/download/companion-latest/NutriVisionSync.apk) | GitHub Releases |

---

## Architecture Overview

```
                      ┌──────────────────────────────────────┐
                      │          User Web Browser            │
                      └──────────────────┬───────────────────┘
                                         │ HTTPS
                                         ▼
                      ┌──────────────────────────────────────┐
                      │        Vercel (Frontend Web)         │
                      │  https://nutrivision-ai-mu.vercel.app│
                      └──────────────────┬───────────────────┘
                                         │ REST API (Bearer JWT)
                                         ▼
                      ┌────────────────────────────────────────────────────────┐
                      │             Render (Backend API Service)               │
                      │  https://nutrivision-backend-i9x2.onrender.com         │
                      └───┬──────────────────────────────┬──────────────────┬──┘
                          │                              │                  ▲
           Internal Token │                              │ SSL (pg)         │ POST /api/activity/sync
                          ▼                              ▼                  │ (Health Connect steps)
      ┌──────────────────────────────────┐   ┌───────────────────────────┐  │
      │     Render (AI Service)          │   │      Neon / Supabase      │  │
      │  https://nutrivision-ai.onrender │   │  PostgreSQL 15+ Database  │  │
      └──────────────────────────────────┘   │  16 Tables, Triggers, SP  │  │
                          │                  └───────────────────────────┘  │
            Roboflow & MiDaS Depth                                          │
                                                                            │
      ┌──────────────────────────────────┐                                  │
      │     Google Gemini API            │                                  │
      │  (Multimodal Vision & Coach)     │                                  │
      └──────────────────────────────────┘                                  │
                                                                            │
      ┌─────────────────────────────────────────────────────────────────────┴──┐
      │             Native Android Companion App (Kotlin + Compose)            │
      │  - Official Google Health Connect API                                  │
      │  - Samsung Health Step & Calorie Aggregation                           │
      │  - Zero Background Battery Drain                                       │
      │  - Automated GitHub Actions Release: NutriVisionSync.apk               │
      └────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Prerequisites & Required Accounts

1. **GitHub Repository:** `doomsday-the/NutrivisionAI` (tracked on `main`).
2. **Cloud PostgreSQL Database:** Neon ([neon.tech](https://neon.tech)) or Supabase ([supabase.com](https://supabase.com)).
3. **Render Account:** [render.com](https://render.com) (free-tier Web Services).
4. **Vercel Account:** [vercel.com](https://vercel.com) (free-tier SPA hosting).
5. **Google Cloud Console:** [console.cloud.google.com](https://console.cloud.google.com) (OAuth 2.0 Web Client ID).
6. **Google AI Studio Key:** [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (Gemini API Key).

---

## 2. Step 1: Database Setup & Migrations (PostgreSQL 15+)

1. Create a PostgreSQL 15+ database instance on Neon or Supabase.
2. Retrieve the pooled connection string:
   ```
   postgresql://user:password@ep-xyz.ap-southeast-1.aws.neon.tech/nutrivision?sslmode=require
   ```
3. Run migrations and execute database views, triggers, and stored procedures from your terminal:
   ```bash
   cd backend-api
   npm install
   npx prisma generate
   npx prisma db push
   npx prisma db execute --file prisma/setup_views_triggers.sql
   npx prisma db execute --file prisma/setup_stored_procedure.sql
   npm run seed
   ```
4. Confirm in your database explorer that all 16 tables exist, triggers are attached to `food_items` and `meal_items`, and stored procedure `sp_log_meal` is registered.

---

## 3. Step 2: Deploy Backend API on Render

1. On the [Render Dashboard](https://dashboard.render.com), click **New +** → **Web Service**.
2. Connect repository `NutrivisionAI`.
3. Configure the service:
   - **Name:** `nutrivision-backend`
   - **Root Directory:** `backend-api`
   - **Environment:** `Node`
   - **Region:** `Singapore`
   - **Branch:** `main`
   - **Build Command:** `npm ci --include=dev && npx prisma generate && npm run build`
   - **Start Command:** `node dist/server.js`
   - **Plan:** `Free`
4. Configure Environment Variables in **Environment**:
   | Key | Value | Purpose |
   |---|---|---|
   | `NODE_VERSION` | `22` | Node runtime version |
   | `DATABASE_URL` | `<CLOUD_POSTGRES_CONNECTION_STRING>?sslmode=require` | Database connection |
   | `JWT_SECRET` | `<STRONG_64_CHAR_SECRET>` | JWT token signing |
   | `GOOGLE_CLIENT_ID` | `558532335340-jsbgfpii5qojdbdk8oa23tlukjhljrca.apps.googleusercontent.com` | Google OAuth token verification |
   | `GEMINI_API_KEY` | `<YOUR_GEMINI_API_KEY>` | Multimodal Vision & NutriCoach |
   | `GEMINI_MODEL` | `gemini-flash-lite-latest` | Preferred primary model |
   | `NODE_ENV` | `production` | Production environment flag |
   | `DEV_LOGIN_ENABLED` | `true` | Allows instant evaluation bypass login |
   | `TZ` | `Asia/Kolkata` | Canonical calendar timezone |
5. Set Health Check Path: `/health`.
6. Click **Create Web Service**. Verify health: `https://nutrivision-backend-i9x2.onrender.com/health` returns `{"status":"ok"}`.

---

## 4. Step 3: Deploy AI Computer Vision Microservice (Optional Fallback)

1. On the Render Dashboard, click **New +** → **Web Service**.
2. Configure:
   - **Name:** `nutrivision-ai`
   - **Root Directory:** `ai-service`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn src.app:app --host 0.0.0.0 --port 8000`
3. Environment Variables:
   - `X_INTERNAL_TOKEN`: Shared secret token matching the backend `X_INTERNAL_TOKEN`.
   - `ROBOFLOW_API_KEY`: Hosted IndianFoodNet API key.
4. Set Health Check Path: `/health`.

---

## 5. Step 4: Deploy Frontend Web Dashboard on Vercel

1. Log in to [vercel.com](https://vercel.com) and click **Add New...** → **Project**.
2. Import repository `doomsday-the/NutrivisionAI`.
3. In Project Settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend-web`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm ci`
4. Add Environment Variables:
   | Key | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://nutrivision-backend-i9x2.onrender.com` |
   | `VITE_GOOGLE_CLIENT_ID` | `558532335340-jsbgfpii5qojdbdk8oa23tlukjhljrca.apps.googleusercontent.com` |
5. Click **Deploy**. Vercel automatically deploys the frontend and generates your production domain (`https://nutrivision-ai-mu.vercel.app`).
6. Client-side routing is handled seamlessly by `frontend-web/vercel.json`:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

---

## 6. Step 5: Configure Google OAuth Allowed Origins

1. Go to [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services** → **Credentials**.
2. Select Web Client ID (`558532335340-...`).
3. Under **Authorized JavaScript origins**, add:
   - `https://nutrivision-ai-mu.vercel.app`
   - `http://localhost:5173`
4. Under **Authorized redirect URIs**, add:
   - `https://nutrivision-ai-mu.vercel.app`
5. Save changes.

---

## 7. Step 6: Native Android Companion APK Compilation & Release (CI/CD)

The native companion app (`mobile-app/`) is compiled automatically in the cloud on every push:
1. Workflow file `.github/workflows/build-apk.yml` triggers on pushes affecting `mobile-app/**`.
2. Runner provisions **Ubuntu Latest**, **JDK 17 (Temurin)**, pre-installed **Android SDK (`compileSdk = 35`)**, and **Gradle 8.7**.
3. Executes `gradle assembleDebug --stacktrace`.
4. Copies the output artifact to `release-output/NutriVisionSync.apk`.
5. Uses `softprops/action-gh-release@v2` to publish the binary to GitHub Release tag **`companion-latest`**.
6. Users download and install with 1 tap:
   👉 **[Download NutriVisionSync.apk](https://github.com/doomsday-the/NutrivisionAI/releases/download/companion-latest/NutriVisionSync.apk)**

---

## 8. Verification & System Health Checklist

| Test Item | Verification Method | Expected Result |
|---|---|---|
| **Backend Health** | `curl https://nutrivision-backend-i9x2.onrender.com/health` | `{"status":"ok", "timestamp":"..."}` |
| **Instant Demo Login** | Click "Instant Demo Login (Bypass)" on login page | Instantly issues JWT and opens Dashboard |
| **Google Sign-In** | Tap "Sign in with Google" button | Authenticates via Google OAuth, redirects to `/dashboard` |
| **Companion APK Download** | Click "Sync APK" in web navbar | Downloads `NutriVisionSync.apk` directly |
| **Samsung Health Sync** | Open Android Companion, tap "PUSH TO NUTRIVISION WEB" | Telemetry written to `daily_logs`; web steps dial expands |
| **Plate Recognition** | Upload meal photo in Log Meal | Detects authentic dishes, executes `sp_log_meal` atomically |
| **NutriCoach Intelligence** | Visit `/coach` or inspect Dashboard widget | Gemini AI produces personalized Indian culinary feedback |
