# 11_01 Failure Philosophy

**Scope**: Defines the exact behavior for every meaningful failure scenario in NutriVision AI. No failure behavior is left implicit or decided by individual Builders.

**General Principles**:
- Failures are always logged with a correlation ID (`session_id` or `request_id`).
- The user is never shown raw error messages or stack traces.
- If a partial result is possible and safe, return it with a `warnings` field.
- If a complete result is not possible, return the appropriate HTTP error and a deterministic error code.

---

## Node.js Backend Failures

### F-001: AI Service Unavailable or Timeout
**Trigger**: `POST {AI_SERVICE_URL}/predict` does not respond within 30 seconds, or returns HTTP 5xx.  
**Action**: Do NOT retry. Abort the meal analysis. Return HTTP 503 to the client with error code `AI_SERVICE_UNAVAILABLE`.  
**Database**: No rows are written. No transaction is opened.  
**User message**: `"Food detection is temporarily unavailable. Please try again."`  
**Log**: Log at ERROR level with `session_id` and elapsed time.

### F-002: Database Transaction Failure During Meal Save
**Trigger**: Any INSERT into `meals`, `meal_items`, `ai_match_log`, or `daily_logs` throws a database error during the transaction opened in `API-002`.  
**Action**: ROLLBACK the entire transaction immediately.  
**Response**: Return HTTP 500 with error code `MEAL_SAVE_FAILED`.  
**User message**: `"We could not save your meal. Please try again."`  
**Log**: Log at ERROR level with full error, `session_id`, and user_id.  
**Note**: The AI service call has already completed at this point. The result is discarded. This is acceptable — the user retries the upload.

### F-003: AI Service Returns Empty Detections
**Trigger**: `POST /predict` returns HTTP 200 but `detections: []`.  
**Action**: Do NOT treat as an error. Return HTTP 200 to the client with an empty `items` array and all calorie/macro totals as `0`.  
**Database**: Still insert a row into `meals` to record that the user attempted a log. Do not insert rows into `meal_items` or `ai_match_log`.  
**User message**: `"We could not identify any food in this image. You can add items manually."`

### F-004: AI Detection Returns `matched_food_id: null`
**Trigger**: A detection has a `detected_label` but `matched_food_id` is null (no database match).  
**Action**: Skip that detection item. Continue processing remaining detections that have valid `matched_food_id` values.  
**Database**: Still insert a row into `ai_match_log` with `matched_food_id = null` for audit purposes.  
**Log**: Log at WARN level with `detected_label` and `session_id`.

### F-005: Activity Sync Write Failure (WearOS)
**Trigger**: `PUT /api/activity/sync` — the upsert into `daily_logs` fails.  
**Action**: Return HTTP 500 with error code `ACTIVITY_SYNC_FAILED`.  
**WearOS behavior**: The WearOS app must retry the sync on next foreground or sync window. The server is idempotent — resending the same `(log_date, steps, calories_burned)` is safe (upsert).

### F-006: Invalid or Expired JWT
**Trigger**: Any protected endpoint receives a JWT that fails signature verification, or has `exp` in the past.  
**Action**: Return HTTP 401 with error code `UNAUTHORIZED`.  
**User behavior**: Client discards the token and redirects to the Google OAuth login screen.  
```json
{ "error": "UNAUTHORIZED", "message": "Session expired. Please sign in again." }
```

### F-007: Google Token Verification Failure
**Trigger**: `POST /api/auth/google` — `google-auth-library` rejects the `id_token`.  
**Action**: Return HTTP 401 with error code `INVALID_GOOGLE_TOKEN`. Do not create or update any user record.

### F-008: Request Validation Failure
**Trigger**: Any endpoint receives a request body or query param that fails Zod schema validation.  
**Action**: Return HTTP 400 with error code `VALIDATION_ERROR` and the specific field(s) that failed.  
```json
{ "error": "VALIDATION_ERROR", "message": "meal_type must be one of: breakfast, lunch, dinner, snack." }
```

---

## Python AI Service Failures

### F-009: Image File Unreadable or Corrupt
**Trigger**: FastAPI cannot decode the uploaded file as an image (e.g., corrupted bytes).  
**Action**: Return HTTP 400 with error code `INVALID_IMAGE`.  
**The Node.js backend**: Propagates this as a 400 to the client.

### F-010: Inference Exception (Future Real Model Phase)
**Trigger**: The YOLO or MobileNet inference call raises an unhandled exception.  
**Action**: Catch the exception, log it at ERROR level with `session_id`, return HTTP 500 with error code `INFERENCE_FAILED`.  
**The Node.js backend**: Handles this as F-001 (AI Service Unavailable).

---

## ETL Pipeline Failures

### F-011: Malformed Row in IFCT/USDA Source Data
**Trigger**: A row in the staging table has a NULL value in a required column (e.g., `food_name` is null), or a numeric column contains a non-numeric string.  
**Action**: Skip the row. Log a WARN-level entry with the row identifier and the failing column. Continue processing remaining rows. Do NOT abort the entire import.  
**Post-import**: The ETL script must output a summary: `{total_rows, imported, skipped, errors}`.

### F-012: Duplicate Food on ETL Insert
**Trigger**: ETL attempts to insert a `food_item` where `(external_id, source_id)` already exists.  
**Action**: Skip the INSERT (do not UPDATE). Log at DEBUG level. This prevents re-imports from overwriting manually corrected data.

---

## Summary Table

| ID | Scenario | HTTP Status | Retry | Rollback | User Notified |
|---|---|---|---|---|---|
| F-001 | AI service timeout | 503 | No | N/A | Yes |
| F-002 | DB transaction failure | 500 | No | Yes | Yes |
| F-003 | Empty AI detection | 200 | N/A | N/A | Yes (soft msg) |
| F-004 | AI label unmatched | 200 (partial) | N/A | N/A | No |
| F-005 | Activity sync DB fail | 500 | WearOS retries | No | Yes |
| F-006 | Expired JWT | 401 | N/A | N/A | Yes |
| F-007 | Bad Google token | 401 | N/A | N/A | Yes |
| F-008 | Validation error | 400 | N/A | N/A | Yes |
| F-009 | Corrupt image | 400 | N/A | N/A | Yes |
| F-010 | Inference exception | 500 | No (Node handles) | N/A | Via F-001 |
| F-011 | Malformed ETL row | N/A | Skip + log | N/A | No |
| F-012 | Duplicate ETL row | N/A | Skip | N/A | No |
