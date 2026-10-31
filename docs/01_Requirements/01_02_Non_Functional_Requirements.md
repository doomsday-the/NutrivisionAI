# 01_02 Non-Functional Requirements

## NFR-001: API Response Time
- **Scope**: All endpoints except `POST /api/meals/analyze` and `POST /api/coach/explain`.
- **Target**: p95 response time < 500ms under normal free-tier load.
- **Rationale**: Free-tier Node.js instances may have cold starts on Render/Neon. This is a soft target during development and demo execution.

## NFR-002: Meal Analysis Response Time
- **Scope**: `POST /api/meals/analyze` only.
- **Target**: p95 response time < 15 seconds with Google Gemini Multimodal cascade; fallback to Roboflow/MiDaS completes within 30 seconds.
- **Note**: Explicitly communicated to the user via animated scanning radar and progress states in the UI.

## NFR-003: Image Upload Size Limit
- **Maximum file size**: 10 MB.
- **Accepted formats**: JPEG, PNG only.
- **Enforcement**: Validated on the Node.js backend via `multer` limits before forwarding to the multimodal AI pipeline or AI microservice. The AI microservice also validates independently (Defense in Depth).

## NFR-004: Free-Tier Concurrency Target
- **Target**: The system must handle up to 5 simultaneous active users without degrading to the point of timeouts.
- **Rationale**: Free-tier Render instances are typically single-instance with 512MB RAM. This is a design constraint, not an infrastructure scaling limit.

## NFR-005: Data Retention — Meal Images
- **Policy**: Meal images uploaded by users are saved with UUID-scoped filenames (`/uploads/meals/${session_id}_${sanitizedFilename}`).
- **Retention**: Images are retained indefinitely in MVP. No automatic deletion policy is implemented in v1.
- **Privacy**: Image filenames are obfuscated using UUID v4 tokens to prevent enumeration attacks.

## NFR-006: Security — Secrets Management
- **Rule**: All secrets (`JWT_SECRET`, `AI_SERVICE_URL`, `X_INTERNAL_TOKEN`, `GOOGLE_CLIENT_ID`, `DATABASE_URL`, `GEMINI_API_KEY`, `ROBOFLOW_API_KEY`) must be stored as environment variables only.
- **Enforcement**: `.env` files are strictly gitignored. `.env.example` with placeholder values is committed. GitHub Push Protection is active.

## NFR-007: Database — 3NF Normalization and University Compliance
- **Rule**: The final schema as defined in `03_01_Canonical_Data_Model.md` must strictly satisfy Third Normal Form (3NF).
- **Verification**: The schema contains 16 normalized tables, 3 SQL triggers, 2 SQL views, and 1 atomic stored procedure (`sp_log_meal`). All foreign keys enforce referential integrity.

## NFR-008: Activity Sync Idempotency
- **Rule**: The `POST /api/activity/sync` endpoint must be strictly idempotent. Pushing the same `(log_date, steps, calories_burned)` multiple times produces the exact same state in the database as sending it once.
- **Mechanism**: Implemented via PostgreSQL `INSERT INTO public.daily_logs ... ON CONFLICT (user_id, log_date) DO UPDATE SET steps = EXCLUDED.steps, calories_burned = EXCLUDED.calories_burned, remaining_calories = daily_logs.target_calories - daily_logs.total_calories + EXCLUDED.calories_burned`.

## NFR-009: Companion Mobile App Battery & Resource Efficiency
- **Rule**: The Android companion app must consume 0% battery when in the background.
- **Mechanism**: Strictly on-demand execution. No background services, periodic AlarmManagers, or polling WorkManagers are permitted. Users open the app, inspect Health Connect metrics, and tap Push.
- **API Standard**: Leverages official `androidx.health.connect` SDK with `HealthConnectClient.aggregate(StepsRecord.COUNT_TOTAL)` for deduplicated Samsung Health counts.

## NFR-010: Multimodal AI Vision Cascade Resilience
- **Rule**: The food detection engine must never fail catastrophically or default to erroneous placeholder items (such as "Rice" or "Gulab Jamun") upon encountering unseen foods.
- **Mechanism**: High-resilience cascade prioritizing `gemini-flash-lite-latest` -> `gemini-3.1-flash-lite` -> `gemini-flash-latest` -> `gemini-3.5-flash`, with secondary fallback to Roboflow IndianFoodNet and MiDaS depth estimation.
- **Dynamic Ingestion**: Unrecognized foods are dynamically created in `food_items` with valid foreign keys and nutrient estimations extracted directly from the multimodal reasoning output.

## NFR-011: Database Sequence Integrity & Fault Recovery
- **Rule**: PostgreSQL auto-incrementing serial sequences (`food_items_food_id_seq`, `food_nutrients_food_nutrient_id_seq`) must be resilient against cloud pooler drift or manual inserts.
- **Mechanism**: Dynamic sequence discovery via `pg_get_serial_sequence()` and explicit sequence advances (`SELECT setval(...)`) implemented in `bootstrap.ts` and `mealController.ts`.
