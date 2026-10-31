# 00_02 Traceability Matrix

Maps each Functional Requirement to its corresponding ADR, database schema entity, API contract, and implementation module across backend, AI, and client applications.

| FR | Requirement | ADR | Schema Entity | API Contract | Backend Module | AI / Client Module |
|---|---|---|---|---|---|---|
| FR-001 | User Authentication & Pairing | ADR-003, ADR-012 | `public.users` | API-001, API-014, API-015 | `controllers/authController` | `AuthContext.tsx`, `SyncService.kt` |
| FR-002 | Meal Image Upload | ADR-009, ADR-011 | `public.meals` | API-002 | `controllers/mealController` | `LogMeal.tsx`, TC-001 |
| FR-003 | Multimodal AI Food Detection | ADR-002, ADR-009, ADR-011, ADR-013 | `public.ai_match_log`, `public.food_items` | API-002, TC-001 | `controllers/mealController` | Google Gemini Vision, `ai-service/src/app.py` |
| FR-004 | Atomic Stored Procedure Logging | ADR-001, ADR-002 | `public.meals`, `public.meal_items`, `public.food_nutrients`, `public.daily_logs` | API-002 | `prisma/setup_stored_procedure.sql` (`sp_log_meal`) | — |
| FR-005 | Android Companion Activity Sync | ADR-010 | `public.daily_logs` | API-003 | `controllers/activityController` | `mobile-app` (`HealthConnectManager.kt`), `Activity.tsx` |
| FR-006 | AI Nutrition Coach & Insights | ADR-011 | `public.daily_logs`, `public.meals`, `public.user_profiles` | API-013 | `controllers/coachController` | `NutritionCoach.tsx`, `NutriCoachWidget.tsx` |
| FR-007 | Manual Food Search & Custom Logging | ADR-007 | `public.food_items`, `public.meal_items` | API-007, API-011, API-012 | `controllers/foodController`, `controllers/mealController` | `LogMeal.tsx` |
| FR-008 | Physiological TDEE Profile Setup | — | `public.user_profiles` | API-005, API-006 | `controllers/profileController` | `Profile.tsx` |
| FR-009 | AI Match Auditing & User Feedback | ADR-007 | `public.ai_match_log`, `public.meal_items` | API-008 | `controllers/mealController` | `MealHistory.tsx`, `LogMeal.tsx` |
| FR-010 | Meal Deletion Cascade & Rebalance | ADR-001 | `public.meals`, `public.meal_items`, `public.daily_logs` | API-009 | `controllers/mealController` | `MealHistory.tsx` |
| FR-011 | Weekly Trajectory & History | ADR-008 | `public.meals`, `public.daily_logs` | API-010, API-016 | `controllers/mealController`, `controllers/activityController` | `Dashboard.tsx`, `MealHistory.tsx` |

---

## Failure Coverage Traceability

| FR | Failure Scenarios Handled | Recovery / Behavior |
|---|---|---|
| FR-001 | F-006 (Expired JWT), F-007 (Bad Google Token) | Re-authentication prompt; developer bypass fallback (`/api/auth/dev-login`); companion 30-day token pairing |
| FR-002 | F-003 (Empty Detection), F-009 (Corrupt Image) | Multer file validation (JPEG/PNG, <=10MB); soft notification prompting manual food entry |
| FR-003 | F-001 (AI Unavailable), F-004 (Unmatched Label), F-010 (Inference Exception) | Multi-model Gemini cascade (`flash-lite-latest` -> `3.1-flash-lite` -> `flash-latest` -> `3.5-flash`); secondary Roboflow+MiDaS fallback; dynamic DB food creation; zero "rice guessing" |
| FR-004 | F-002 (DB Transaction Failure) | Atomic PL/pgSQL rollback; dynamic database sequence recovery (`syncDatabaseSequences`) |
| FR-005 | F-005 (Activity Sync Failure) | Idempotent upsert via `ON CONFLICT (user_id, log_date)`; Companion retry with dual raw & aggregate inspection |
| FR-006 | AI Overload / Rate-Limit Spikes | Gemini candidate model cascade; fallback heuristic meal commentary parser |
| FR-007 | Database Connection Drift | Prisma connection retry; full-text fallback to ILIKE prefix & substring searches |
| FR-008 | Missing Profile Values | Safe Mifflin-St Jeor defaults (2000 kcal target fallback) |
| FR-009 | Invalid Foreign Keys | FK constraint validation; graceful logging of corrections in `ai_match_log` |
| FR-010 | Orphan Meal Items | Cascading deletion of `meal_items` before `meals` deletion; transactional daily balance recalculation |
| FR-011 | Missing Daily Entries | Automatic zeroed array generation for missing calendar dates without throwing 404 |

---

## ETL Traceability

| Data Source | Staging Table | Target Tables | Primary Key / Conflict Strategy | Spec Document |
|---|---|---|---|---|
| ICMR-NIN IFCT 2017 | `staging.icmr_food` | `food_items`, `food_nutrients` | `external_id` (IFCT Code), `source_id = 1` | `03_03_ETL_Specification.md` |
| USDA FoodData Central | `staging.usda_food`, `staging.usda_nutrient` | `food_items`, `food_nutrients` | `external_id` (FDC ID), `source_id = 2` (IFCT takes precedence) | `03_03_ETL_Specification.md` |
| Dynamic Multimodal Ingestion | In-memory payload | `food_items`, `food_nutrients`, `ai_match_log` | Next available sequence ID with auto `setval` sequence synchronization | `02_01_ADRs.md` (ADR-013) |
