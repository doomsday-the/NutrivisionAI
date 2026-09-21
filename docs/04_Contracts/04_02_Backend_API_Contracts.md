# 04_02 Backend API Contracts

**Service**: `backend-api` (Node.js, Express)  
**Base URL (local)**: `http://localhost:3000`  
**Base URL (production)**: Configured via environment variable.  
**All responses**: `Content-Type: application/json`  
**Authentication**: All endpoints except `POST /api/auth/google` require a valid JWT in the `Authorization: Bearer <token>` header. Requests without a valid token receive `401`.

---

## API-001: POST /api/auth/google

**Purpose**: Exchange a Google OAuth ID token for a NutriVision application JWT.

### Request
```json
{
  "id_token": "eyJhbGciOiJSUzI1Ni..."
}
```

### Behavior
1. Verify `id_token` using the `google-auth-library` package against NutriVision's Google Client ID.
2. Extract `sub` (google_id), `email`, `name`, `picture` from the verified payload.
3. `UPSERT` a row into `public.users` — insert if `google_id` not found, else update `last_login_at`.
4. Sign and return a NutriVision JWT.

**JWT Payload**:
```json
{ "user_id": 1, "email": "user@example.com" }
```

**JWT Configuration**:
- Algorithm: `HS256`
- Expiry: `7d` (7 days)
- Secret: `JWT_SECRET` environment variable
- No refresh tokens in MVP phase. Client re-authenticates via Google on expiry.

### Response — 200 OK
```json
{
  "token": "<jwt_string>",
  "user": {
    "user_id": 1,
    "email": "user@example.com",
    "display_name": "Arush Mehta",
    "avatar_url": "https://..."
  }
}
```

### Response — 401 Unauthorized
Returned when `id_token` is invalid, expired, or does not match the expected Google Client ID.
```json
{ "error": "INVALID_GOOGLE_TOKEN", "message": "Google token verification failed." }
```

---

## API-002: POST /api/meals/analyze

**Purpose**: Upload a meal image, trigger AI detection, calculate nutrition, persist the meal, and return the nutritional breakdown.

**Auth**: Required.

### Request
- **Content-Type**: `multipart/form-data`

| Field | Type | Required | Constraints |
|---|---|---|---|
| `image` | File | Yes | JPEG or PNG, max 10 MB |
| `meal_type` | string | Yes | One of: `breakfast`, `lunch`, `dinner`, `snack` |

### Behavior (Ordered Steps — all within a single DB transaction)
1. Validate `meal_type` and image file type/size.
2. Generate a `session_id` (UUID v4).
3. Forward image + `session_id` to `POST {AI_SERVICE_URL}/predict` with `X-Internal-Token` header. Timeout: 30 seconds.
4. For each detection where `matched_food_id` is not null:
   a. Query `food_nutrients` for the matched food's Energy, Protein, Carbohydrate, Fat values.
   b. Calculate nutrition: `value = (nutrient.value_per_100g / 100) * detection.suggested_weight_grams`. If `suggested_weight_grams` is null, default to `100`.
5. Insert one row into `meals`.
6. Insert one row into `meal_items` per detection.
7. Insert one row into `ai_match_log` per detection.
8. Upsert one row into `daily_logs` for today's date.
9. If any DB step fails, rollback the entire transaction and return `500`.
10. Return the meal summary.

### Response — 201 Created
```json
{
  "meal_id": 55,
  "meal_type": "lunch",
  "logged_at": "2026-09-21T13:45:00Z",
  "total_calories": 560.00,
  "total_protein_g": 22.10,
  "total_carbs_g": 61.30,
  "total_fat_g": 25.00,
  "items": [
    {
      "food_id": 12,
      "food_name": "Rice - cooked (boiled)",
      "quantity_grams": 150.00,
      "estimated_calories": 240.00,
      "confidence": 0.9400
    }
  ]
}
```

### Response — 400 Bad Request
```json
{ "error": "VALIDATION_ERROR", "message": "meal_type must be one of: breakfast, lunch, dinner, snack." }
```

### Response — 503 Service Unavailable
Returned when the AI service does not respond within 30 seconds or returns a 5xx.
```json
{ "error": "AI_SERVICE_UNAVAILABLE", "message": "Food detection is temporarily unavailable. Please try again." }
```

---

## API-003: POST /api/activity/sync

**Purpose**: Receive activity data pushed from the WearOS app and update the user's daily log.

**Auth**: Required (same JWT, called from WearOS via the Android companion app).

### Request
```json
{
  "log_date": "2026-09-21",
  "steps": 7500,
  "calories_burned": 300.00
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `log_date` | string | Yes | ISO 8601 date `YYYY-MM-DD` |
| `steps` | integer | Yes | >= 0 |
| `calories_burned` | float | Yes | >= 0.0, value from Google Fit API |

### Behavior
1. Validate all fields.
2. Upsert into `daily_logs` for `(user_id, log_date)`:
   - Set `steps = :steps`
   - Set `calories_burned = :calories_burned`
   - Recompute: `remaining_calories = target_calories - total_calories + calories_burned`
3. Return updated daily summary.

**Note**: The `calories_burned` value is always sourced from the Google Fit API on the WearOS/Android side. The backend does not calculate it from steps. This avoids the need for a per-user step-to-calorie formula on the server.

### Response — 200 OK
```json
{
  "log_date": "2026-09-21",
  "steps": 7500,
  "calories_burned": 300.00,
  "total_calories": 860.00,
  "remaining_calories": 540.00,
  "target_calories": 1700.00
}
```

### Response — 400 Bad Request
```json
{ "error": "VALIDATION_ERROR", "message": "log_date must be a valid YYYY-MM-DD date." }
```

---

## API-004: GET /api/dashboard

**Purpose**: Return all data needed to render the user's daily dashboard screen.

**Auth**: Required.  
**Query Params**: `date` (optional, ISO 8601 `YYYY-MM-DD`, defaults to today in UTC).

### Response — 200 OK
```json
{
  "date": "2026-09-21",
  "target_calories": 1700.00,
  "total_calories": 860.00,
  "calories_burned": 300.00,
  "remaining_calories": 540.00,
  "total_protein_g": 42.50,
  "total_carbs_g": 105.00,
  "total_fat_g": 28.00,
  "steps": 7500,
  "meals": [
    {
      "meal_id": 55,
      "meal_type": "lunch",
      "total_calories": 560.00,
      "logged_at": "2026-09-21T13:45:00Z"
    }
  ]
}
```

If no `daily_logs` row exists for the requested date, return zeroed values with `meals: []`. Do not return `404`.

---

## API-005: GET /api/profile

**Purpose**: Return the authenticated user's profile.

**Auth**: Required.

### Response — 200 OK
```json
{
  "user_id": 1,
  "email": "user@example.com",
  "display_name": "Arush Mehta",
  "avatar_url": "https://...",
  "profile": {
    "age": 20,
    "height_cm": 175.00,
    "weight_kg": 70.00,
    "activity_level": "moderate",
    "goal": "maintain",
    "daily_calorie_target": 1700.00
  }
}
```

If no profile exists yet, `profile` is `null`.

---

## API-006: PUT /api/profile

**Purpose**: Create or update the authenticated user's health profile and recalculate `daily_calorie_target`.

**Auth**: Required.

### Request
```json
{
  "age": 20,
  "height_cm": 175.00,
  "weight_kg": 70.00,
  "activity_level": "moderate",
  "goal": "maintain"
}
```

### Behavior
1. Validate all fields.
2. Calculate `daily_calorie_target` using the Mifflin-St Jeor equation adjusted for `activity_level` and `goal`:
   - BMR (Male): `(10 × weight_kg) + (6.25 × height_cm) − (5 × age) + 5`
   - BMR (Female): `(10 × weight_kg) + (6.25 × height_cm) − (5 × age) − 161`
   - **Note**: Gender is not collected in MVP. Default to male formula for now. Mark as TBD for v2.
   - TDEE multipliers: `sedentary=1.2`, `light=1.375`, `moderate=1.55`, `active=1.725`, `very_active=1.9`
   - Goal adjustments: `lose=-300 kcal`, `maintain=0`, `gain=+300 kcal`
3. Upsert `user_profiles` row.

### Response — 200 OK
Returns the full profile object (same shape as `GET /api/profile`).
