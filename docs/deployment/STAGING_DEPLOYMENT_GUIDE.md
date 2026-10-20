# NutriVision AI — Cloud Staging & Production Deployment Guide

This guide provides end-to-end instructions for deploying NutriVision AI to free-tier cloud platforms:
- **Database:** Supabase (Managed PostgreSQL 15+)
- **Backend API:** Render Web Service (Node.js 22 + Prisma)
- **Computer Vision Service:** Render Web Service (Python 3.11 + FastAPI + MiDaS / Roboflow)
- **Frontend SPA:** Vercel (Vite + React + TailwindCSS)
- **AI Nutrition Coach:** Google Gemini 1.5 Flash via Google AI Studio

---

## Architecture Overview

```
                      ┌──────────────────────────────────────┐
                      │          User Web Browser            │
                      └──────────────────┬───────────────────┘
                                         │ HTTPS
                                         ▼
                      ┌──────────────────────────────────────┐
                      │        Vercel (Frontend SPA)         │
                      │  https://nutrivision.vercel.app      │
                      └──────────────────┬───────────────────┘
                                         │ REST API (JWT)
                                         ▼
                      ┌──────────────────────────────────────┐
                      │        Render (Backend API)          │
                      │  https://nutrivision-api.onrender.com│
                      └───┬──────────────────────────────┬───┘
                          │                              │
          Internal Token  │                              │ SSL (pg)
                          ▼                              ▼
      ┌──────────────────────────────────┐   ┌───────────────────────────┐
      │     Render (AI Service)          │   │        Supabase           │
      │  https://nutrivision-ai.onrender │   │  PostgreSQL 15+ Database  │
      └──────────────────────────────────┘   └───────────────────────────┘
                          │
                   Gemini 1.5 Flash
                          ▼
      ┌──────────────────────────────────┐
      │     Google AI Studio             │
      │  (NutriCoach Intelligence)       │
      └──────────────────────────────────┘
```

---

## 1. Prerequisites & Accounts

1. **GitHub Repository:** Push current branch to your remote repository.
2. **Supabase Account:** [supabase.com](https://supabase.com) (Free tier: 500MB database, pooled connections).
3. **Render Account:** [render.com](https://render.com) (Free tier: Web Services with HTTPS).
4. **Vercel Account:** [vercel.com](https://vercel.com) (Free tier: Unlimited hobby deployments).
5. **Google Cloud Console:** [console.cloud.google.com](https://console.cloud.google.com) (For Google OAuth Client ID).
6. **Google AI Studio Key:** [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (Free tier Gemini 1.5 Flash).

---

## 2. Step 1: Database Setup on Supabase

1. Sign in to **Supabase** and click **New Project**.
2. Fill in:
   - **Name:** `nutrivision-db`
   - **Database Password:** Generate a strong password (save this securely).
   - **Region:** Select a region close to your target users (e.g., `Singapore (ap-southeast-1)`).
3. Once the database is provisioned, go to **Project Settings** → **Database** → **Connection String**.
4. Select **URI** mode:
   - For Prisma migrations and runtime connection, copy the URI and ensure `?sslmode=require` is appended:
     ```
     postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?schema=public&sslmode=require
     ```
5. Apply database migrations and seeds from your local terminal:
   ```bash
   cd backend-api
   
   # Apply Prisma migrations to Supabase
   DATABASE_URL="postgresql://postgres.[REF]:[PASS]@[HOST]:6543/postgres?schema=public&sslmode=require" npx prisma migrate deploy

   # Seed initial food nutritional database
   DATABASE_URL="postgresql://postgres.[REF]:[PASS]@[HOST]:6543/postgres?schema=public&sslmode=require" npx ts-node prisma/seed.ts
   ```
6. Check Supabase **Table Editor** to confirm tables (`users`, `user_profiles`, `meals`, `food_items`, `activity_logs`) are created and populated.

---

## 3. Step 2: Deploy AI Service on Render

### Option A: Using Render Blueprint (`render.yaml`)
If connecting via Blueprint, Render automatically detects the service configuration in `render.yaml`.

### Option B: Manual Web Service Setup
1. On Render dashboard, click **New +** → **Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Name:** `nutrivision-ai`
   - **Root Directory:** `ai-service`
   - **Environment:** `Python 3`
   - **Region:** `Singapore` (same as database)
   - **Branch:** `main`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn src.app:app --host 0.0.0.0 --port 8000`
   - **Plan:** `Free`
4. In **Advanced Settings**, add Environment Variables:
   | Key | Value | Notes |
   |---|---|---|
   | `X_INTERNAL_TOKEN` | `<RANDOM_SECRET_32_CHAR>` | Shared secret with backend |
   | `ROBOFLOW_API_KEY` | `<YOUR_ROBOFLOW_KEY>` | Optional / if using cloud inference |
5. Set Health Check Path: `/health`.
6. Click **Create Web Service**.
7. Once deployed, copy your service URL (e.g. `https://nutrivision-ai.onrender.com`).

---

## 4. Step 3: Deploy Backend API on Render

1. On Render dashboard, click **New +** → **Web Service**.
2. Connect the same repository.
3. Configure:
   - **Name:** `nutrivision-backend`
   - **Root Directory:** `backend-api`
   - **Environment:** `Node`
   - **Region:** `Singapore`
   - **Branch:** `main`
   - **Build Command:** `npm ci && npm run build && npx prisma migrate deploy`
   - **Start Command:** `node dist/server.js`
   - **Plan:** `Free`
4. In **Advanced Settings**, add Environment Variables:
   | Key | Value | Notes |
   |---|---|---|
   | `DATABASE_URL` | `<SUPABASE_CONNECTION_URI>?sslmode=require` | Supabase URI |
   | `JWT_SECRET` | `<64_CHAR_HEX_STRING>` | Generate via `openssl rand -hex 32` |
   | `GOOGLE_CLIENT_ID` | `<YOUR_GOOGLE_CLIENT_ID>` | From Google Cloud Console |
   | `AI_SERVICE_URL` | `https://nutrivision-ai.onrender.com` | Deployed URL from Step 2 |
   | `X_INTERNAL_TOKEN` | `<RANDOM_SECRET_32_CHAR>` | Must match AI service token |
   | `GEMINI_API_KEY` | `<YOUR_GEMINI_KEY>` | From Google AI Studio |
   | `NODE_ENV` | `production` | Production mode |
   | `DEV_LOGIN_ENABLED` | `false` | Disable mock dev login in prod |
5. Set Health Check Path: `/health`.
6. Click **Create Web Service**.
7. Once deployed, verify in browser:
   `https://nutrivision-backend.onrender.com/health` → `{"status":"ok", ...}`

---

## 5. Step 4: Deploy Frontend on Vercel

1. Log in to [vercel.com](https://vercel.com) and click **Add New...** → **Project**.
2. Select your GitHub repository.
3. In project settings:
   - **Framework Preset:** Vite
   - **Root Directory:** Click edit and select `frontend-web`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm ci`
4. Add Environment Variables:
   | Key | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://nutrivision-backend.onrender.com` |
   | `VITE_GOOGLE_CLIENT_ID` | `<YOUR_GOOGLE_CLIENT_ID>` |
5. Click **Deploy**.
6. Note your production URL (e.g., `https://nutrivision.vercel.app`).

---

## 6. Step 5: Configure Google OAuth Allowed Origins

1. Go to [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services** → **Credentials**.
2. Select your Web Client ID (`GOOGLE_CLIENT_ID`).
3. Under **Authorized JavaScript origins**, add:
   - `https://nutrivision.vercel.app` (your actual Vercel domain)
   - `http://localhost:5173` (for local development)
4. Under **Authorized redirect URIs**, add:
   - `https://nutrivision.vercel.app`
5. Save changes (takes 5-10 minutes to propagate across Google's edge).

---

## 7. Step 6: Verification & Testing Checklist

| Step | Action | Expected Result |
|---|---|---|
| **1. API Health** | `curl https://nutrivision-backend.onrender.com/health` | `{"status":"ok"}` |
| **2. AI Health** | `curl https://nutrivision-ai.onrender.com/health` | `{"status":"ok","midas_loaded":...}` |
| **3. SPA Navigation** | Visit `https://nutrivision.vercel.app/login` | Login page renders cleanly |
| **4. Google Sign-In** | Click "Sign in with Google" | Authenticates and redirects to `/dashboard` |
| **5. Food Search** | Log Meal → Search "paneer" | Autocomplete lists database food items |
| **6. Plate Logging** | Upload/capture photo | CV model predicts food items + grams |
| **7. NutriCoach** | Navigate to `/coach` → Ask "Explain my plate" | Gemini 1.5 Flash provides personalized Indian dietary advice |
| **8. Graceful Degradation** | If `GEMINI_API_KEY` is empty | Informs user without system crash |

---

## 8. Common Troubleshooting & Notes

- **Supabase SSL Error:** If Prisma throws `SSL connection has been closed unexpectedly`, append `?sslmode=require` or use the Direct port 5432 with transaction pooling.
- **Render Free Tier Cold Starts:** Free instances on Render spin down after 15 minutes of inactivity. First request after idle may take 30-50 seconds to respond. Subsequent requests respond in <100ms.
- **CORS Errors:** Backend CORS middleware allows all origins by default in `server.ts` via `cors()`. If you restrict origins in the future, ensure Vercel preview domains are included.
- **SPA Routing (404 on refresh):** Handled automatically by `frontend-web/vercel.json` rewrites sending all requests to `/index.html`.
