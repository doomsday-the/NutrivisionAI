# 01_02 Non-Functional Requirements

## NFR-001: API Response Time
- **Scope**: All endpoints except `POST /api/meals/analyze`.
- **Target**: p95 response time < 500ms under normal free-tier load.
- **Rationale**: Free-tier Node.js instances may have cold starts. This is a soft target during development.

## NFR-002: Meal Analysis Response Time
- **Scope**: `POST /api/meals/analyze` only.
- **Target**: p95 response time < 35 seconds (30s AI timeout + 5s buffer for DB writes).
- **Note**: This is explicitly communicated to the user via a loading state in the UI. It is not a background job in MVP.

## NFR-003: Image Upload Size Limit
- **Maximum file size**: 10 MB.
- **Accepted formats**: JPEG, PNG only.
- **Enforcement**: Validated on the Node.js backend via `multer` limits before forwarding to the AI service. The AI service also validates independently (Defense in Depth).

## NFR-004: Free-Tier Concurrency Target
- **Target**: The system must handle up to 5 simultaneous active users without degrading to the point of timeouts.
- **Rationale**: Free-tier Render/Railway instances are typically single-instance with 512MB RAM. This is a design constraint, not a performance goal.

## NFR-005: Data Retention — Meal Images
- **Policy**: Meal images uploaded by users are stored at a cloud URL (e.g., Cloudinary free tier).
- **Retention**: Images are retained indefinitely in MVP. No deletion policy is implemented in v1.
- **Privacy**: Image URLs are not publicly guessable (use UUID-based paths on Cloudinary).

## NFR-006: Security — No Secrets in Source Code
- **Rule**: All secrets (`JWT_SECRET`, `AI_SERVICE_URL`, `X_INTERNAL_TOKEN`, `GOOGLE_CLIENT_ID`, `DATABASE_URL`) must be stored as environment variables only.
- **Enforcement**: `.env` files are gitignored. `.env.example` with placeholder values is committed.

## NFR-007: Database — 3NF and University Compliance
- **Rule**: The final schema as defined in `03_01_Canonical_Data_Model.md` must satisfy Third Normal Form.
- **Verification**: The schema must contain a minimum of 8 tables, at least 3 enforced relationships via foreign keys, and at least 3 triggers (as specified in `03_01_Canonical_Data_Model.md`).

## NFR-008: WearOS Sync Idempotency
- **Rule**: The `POST /api/activity/sync` endpoint must be idempotent. Sending the same `(log_date, steps, calories_burned)` multiple times must produce the same result in the database as sending it once.
- **Mechanism**: Implemented via `INSERT ... ON CONFLICT (user_id, log_date) DO UPDATE`.
