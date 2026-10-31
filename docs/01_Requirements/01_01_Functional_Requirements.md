# 01_01 Functional Requirements

## FR-001: User Authentication & Multi-Client Pairing
- **Description**: Users authenticate via Google OAuth on the web, with supported developer bypass authentication and email pairing for the native Android companion app.
- **Actors**: Web User, Developer/Tester, Mobile Companion App
- **Inputs**: Google OAuth `id_token` (web), Developer credentials (`dev-login`), or user email (`companion-login`)
- **Outputs**: Application JWT (7-day for web/dev, 30-day for companion), User Profile Data
- **Behavior**: System validates the Google token (or pairs user email), upserts the user in `public.users` with BCrypt password hash, and returns session JWT. Android companion app can pair via `POST /api/auth/companion-login` or deep link `nutrivision://connect?token=...`.
- **Constraints**: Enforces RBAC with roles `'user'` and `'admin'`.

## FR-002: Meal Image Upload
- **Description**: Users upload meal photographs via camera capture or file picker for computer vision plate decomposition.
- **Actors**: User
- **Inputs**: Multipart form data with `image` (JPEG/PNG, max 10MB) and `meal_type` (`breakfast`, `lunch`, `dinner`, `snack`)
- **Outputs**: Nutritional breakdown (Calories, Macros, Item list)
- **Behavior**: Image buffer is received by Express API via Multer and forwarded to the multimodal vision pipeline.

## FR-003: Multimodal AI Vision & Detection Cascade (ADR-009, ADR-011)
- **Description**: High-availability AI vision pipeline detects multiple dishes, portion sizes, and nutritional density from plate photographs.
- **Actors**: Backend API (`mealController.ts`), Google Gemini Multimodal Vision, FastAPI AI Service (`ai-service`)
- **Inputs**: Image bytes (base64)
- **Outputs**: JSON array of detected foods, portion weights in grams, confidence scores, and macro estimates per 100g.
- **Behavior**:
  1. **Primary Stage**: Queries Google Gemini Multimodal cascade (`gemini-flash-lite-latest`, `gemini-3.1-flash-lite`, `gemini-flash-latest`, `gemini-3.5-flash`) for multi-dish identification and per-100g macro estimation.
  2. **Dynamic DB Matching**: Checks `public.food_items` via exact matching, prefix matching, word containment, and PostgreSQL `search_vector` full-text search. Automatically inserts missing foods with valid source foreign keys and sequence auto-synchronization.
  3. **Secondary Fallback**: If Gemini Vision is unavailable, forwards image to `ai-service` (`POST /predict`) leveraging Roboflow IndianFoodNet and MiDaS `DPT_Hybrid` relative depth estimation.
- **Zero False Rice Guessing**: Never substitutes unrecognized foods with placeholder rice or gulab jamun; preserves authentic detected food label.

## FR-004: Atomic Stored Procedure Nutritional Logging (`sp_log_meal`)
- **Description**: Atomically logs meal records, food components, audit logs, and daily aggregations in a single database transaction.
- **Actors**: PostgreSQL Database Engine, Express API
- **Inputs**: `user_id`, `meal_type`, `image_url`, `detections` (JSONB), `session_id`
- **Outputs**: Saved `meals`, `meal_items`, `ai_match_log`, and updated `daily_logs`.
- **Behavior**: Executes `CALL public.sp_log_meal(...)`. Atomically computes scaled nutritional values using `vw_food_full` (with fallback to inline detection estimates), updates parent meal totals, and recalculates today's `daily_logs` totals and `remaining_calories`.

## FR-005: Android Companion & Health Connect Activity Sync
- **Description**: Native Android companion app synchronizes real-time physical activity from Samsung Health to the web platform.
- **Actors**: Android Companion App (`com.nutrivision.companion`), Google Health Connect, Samsung Health, Web Dashboard
- **Inputs**: `log_date`, `steps`, `calories_burned`
- **Outputs**: Updated `daily_logs` record with dynamically expanded remaining calories.
- **Behavior**:
  - Companion queries `HealthConnectClient.aggregate(StepsRecord.COUNT_TOTAL)` and raw record origins to retrieve deduplicated Samsung Health steps.
  - On 1-tap push, sends telemetry via `POST /api/activity/sync` with Bearer JWT.
  - Backend executes idempotent upsert into `public.daily_logs`, recalculating `remaining_calories = target_calories - total_calories + calories_burned`.
  - Zero background battery drain: companion app runs strictly on-demand.

## FR-006: AI Nutrition Coach & Real-Time Plate Insights
- **Description**: Context-aware AI nutritionist analyzes daily nutrition, identifies macro imbalances, and suggests healthy culinary swaps tailored to Indian diets.
- **Actors**: User, Google Gemini Reasoning Engine, Express API (`coachController.ts`)
- **Inputs**: Date, user biometrics, target calories, logged meals, optional user question
- **Outputs**: Structured JSON with status badge, executive briefing, Indian food swap suggestions, macro critique, next meal tip, and motivational coaching text.
- **Endpoints**: `POST /api/coach/explain` and `GET /api/coach/daily-insight`.

## FR-007: Manual Food Search & Custom Meal Logging
- **Description**: Users search the dual-source food repository (ICMR IFCT 2017 + USDA) and manually log custom meals and portion adjustments without a camera.
- **Actors**: User
- **Inputs**: Search query `q`, `food_id`, `quantity_grams`, `meal_type`
- **Endpoints**: `GET /api/foods/search?q=...`, `POST /api/meals`, `POST /api/meals/:mealId/items`
- **Behavior**: Full-text searching across English and local food names; manual meal and item creation with automatic parent meal and daily log recalculation.

## FR-008: Physiological TDEE & Biometric Profile Management
- **Description**: Calculates scientific Basal Metabolic Rate (BMR) and Total Daily Energy Expenditure (TDEE) based on user biometrics.
- **Actors**: User, Express API (`profileController.ts`)
- **Inputs**: `age`, `height_cm`, `weight_kg`, `activity_level`, `goal`
- **Outputs**: Calculated `daily_calorie_target`, stored in `public.user_profiles`.
- **Behavior**: Employs the scientific Mifflin-St Jeor formula with activity level multipliers (`sedentary`, `light`, `moderate`, `active`, `very_active`) and goal offsets (`lose: -300 kcal`, `maintain: 0`, `gain: +300 kcal`).

## FR-009: AI Match Auditing & User Feedback Correction Loop
- **Description**: Maintains complete audit trails of all AI detections and allows users to correct misidentified foods or portion weights.
- **Actors**: User, Express API (`mealController.ts`)
- **Inputs**: `mealId`, `itemId`, `new_food_id`, `quantity_grams`
- **Endpoint**: `PUT /api/meals/:mealId/items/:itemId`
- **Behavior**: Updates `meal_items`, re-aggregates parent meal and daily log macros, and logs the correction event into `public.ai_match_log` (`user_corrected = true`, `corrected_food_id`) for model evaluation.

## FR-010: Meal Deletion Cascade & Ledger Rebalancing
- **Description**: Users can delete mistakenly logged meals with atomic rollback of child items and recalculation of daily caloric balances.
- **Actors**: User, Express API (`mealController.ts`)
- **Endpoint**: `DELETE /api/meals/:mealId`
- **Behavior**: Verifies user ownership, deletes child `meal_items`, deletes parent `meals` row, and executes SQL recalculation on `daily_logs` subtracting deleted macros.

## FR-011: Weekly Metabolic Trajectory & Historical Analysis
- **Description**: Displays historical intake timelines and 7-day intake trajectories against calibrated targets.
- **Actors**: User, React Web Dashboard (`MealHistory.tsx`, `Dashboard.tsx`)
- **Endpoints**: `GET /api/meals/history?page=1&limit=10&date=YYYY-MM-DD`, `GET /api/activity/weekly?date=YYYY-MM-DD`
- **Behavior**: Returns paginated meal history and a continuous 7-day caloric trajectory dataset rendered via interactive Recharts bar charts.
