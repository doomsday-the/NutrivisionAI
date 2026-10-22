# NutriVision AI — Chat & Troubleshooting Session Record

**Date:** October 22, 2026  
**Session Topic:** Meal Image Recognition Cascade Diagnosis, Neon Database Foreign Key Resolution, Vercel/Render Branch Architecture, and Deployment Fixes  
**Branch:** `main`  
**Pushed Commit:** [`cb4681b`](https://github.com/doomsday-the/NutrivisionAI/commit/cb4681b) (`fix(vision): resolve Gemini key fallback, dynamic food creation constraints, and authentic meal recognition`)

---

## 1. Executive Summary & Problem Statement

### The Problem
When uploading a photo of sushi to the live Vercel production deployment (`https://nutrivision-ai-mu.vercel.app/log-meal`), the application identified 4 plate components all labeled:
> **"Rice - cooked (boiled)" (92% confidence)**

The user inquired: *"its still running on the old image recog - did you figure out why?"*

---

## 2. Root Cause Analysis (The 3-Step Failure Chain)

### Step 1: Missing `GEMINI_API_KEY` on Render -> Roboflow Fallback
- In `render.yaml`, `GEMINI_API_KEY` was declared with `sync: false`.
- On Render's backend service (`nutrivision-backend-i9x2.onrender.com`), the key was never populated in the Render dashboard environment variables.
- In `mealController.ts`:
  ```ts
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) { ... }
  ```
- Because `geminiKey` was undefined, the backend skipped Gemini Vision entirely and fell back to:
  ```ts
  axios.post(`${process.env.AI_SERVICE_URL}/predict`)
  ```
  **This called the legacy Roboflow AI Service**, which was only trained on the old Indian dish bounding boxes.

### Step 2: Gemini Model Order & Live Demand Status
- Testing live against the Gemini API revealed:
  - `gemini-3.5-flash-lite` and `gemini-3.5-flash`: **Active & working smoothly with multimodal images.**
  - `gemini-3.1-flash-lite`: Returning intermittent 503 high-demand spikes.
  - `gemini-2.0-flash` & `gemini-2.5-flash`: Deprecated/unavailable.
- Solution: Prioritize `gemini-3.5-flash-lite` and `gemini-3.5-flash` at the top of the vision cascade with dual API version handling (`undefined` and `'v1'`).

### Step 3: Database Foreign Key Crash -> Hardcoded Rice Fallback
- Even when non-Indian foods (Sushi, Burgers, Salads) were detected:
- In `mealController.ts`, `matchFoodInDb()` attempted to dynamically create new foods in `public.food_items` using hardcoded:
  ```ts
  category_id: 4, // Fast Foods & Prepared
  source_id: 2    // USDA/Global
  ```
- On the Neon PostgreSQL cloud database, `source_id: 2` does not exist (only `source_id: 1` exists), causing a PostgreSQL Foreign Key constraint violation (`food_items_source_id_fkey`).
- Its error catch block fell back to:
  ```ts
  const genericFallback = await prisma.$queryRaw`
    SELECT food_id, name FROM public.food_items WHERE is_active = true LIMIT 1
  `;
  return genericFallback[0] || { food_id: 12, name: 'Mixed Dish' };
  ```
- The very first active row in the database was `food_id: 12` — literally **`"Rice - cooked (boiled)"`**!
- Furthermore, `analyzeMeal()` was overwriting the detected label with `dbMatch.name`, turning all detected components into `"Rice - cooked (boiled)"`.

---

## 3. Implemented Solutions & Code Changes

### A. Dynamic Database Foreign Key & Sequence Handling (`mealController.ts`)
- Dynamically queries a valid `source_id` from `public.food_sources`:
  ```ts
  const validSource = await prisma.food_sources.findFirst({
    select: { source_id: true },
    orderBy: { source_id: 'asc' }
  });
  const sourceId = validSource ? validSource.source_id : 1;
  ```
- Dynamically queries a valid nullable `category_id`.
- Automatically synchronizes the primary key sequence before insertion:
  ```ts
  await prisma.$executeRawUnsafe(
    `SELECT setval('food_items_food_id_seq', COALESCE((SELECT MAX(food_id) FROM public.food_items), 1))`
  ).catch(() => {});
  ```
- Safely inserts nutrients with `ON CONFLICT (food_id, nutrient_id) DO UPDATE SET value_per_100g = EXCLUDED.value_per_100g`.
- If dynamic creation ever falls back to a placeholder row, **it preserves the authentic detected food name (`cleanName`)** rather than returning the database row's name.

### B. Gemini Vision Cascade Resilience (`mealController.ts`)
- Prioritizes `gemini-3.5-flash-lite`, `gemini-3.5-flash`, and `gemini-3.1-flash-lite`.
- Tries both default and `v1` API versions before falling back.
- Preserves the authentic detected label in `detections` and response mapping (`origDet?.detected_label || cached?.name`).

### C. Developer Authentication Support (`authController.ts`)
- Flexible `DEV_LOGIN_ENABLED` check supporting boolean strings (`"true"`, `"1"`).

---

## 4. Branch Architecture Clarification

The user asked whether the work belongs on a side branch or `main`:
- **Production Website (`nutrivision-ai-mu.vercel.app`)**: Tracks **`main`**.
- **Render Backend (`nutrivision-backend-i9x2.onrender.com`)**: Tracks **`main`**.
- **Side Branch (`frontend-only-modifications`)**: Only generates temporary Vercel preview environments.
- **Conclusion**: All changes must be pushed to `main` for both the live Vercel frontend and Render backend to deploy.

---

## 5. Deployment & Configuration Next Step

GitHub Push Protection rightly blocks hardcoding secret API keys into git commits. To enable Gemini Vision on Render:

1. Open **Render Dashboard**: [dashboard.render.com](https://dashboard.render.com)
2. Select service: **`nutrivision-backend`**
3. Navigate to **Environment** in the left menu.
4. Add Environment Variable:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: `AQ.Ab8RN6Lw4q...` (Your Gemini API Key)
5. Click **Save Changes**.

---
*Chat record generated and persisted on October 22, 2026.*
