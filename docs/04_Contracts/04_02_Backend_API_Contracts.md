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

---

## API-007: GET /api/foods/search

**Purpose**: Search the food database using full-text search and partial name matching.

**Auth**: Required.

**Query Params**: `q` (string, required query string).

### Response — 200 OK
```json
[
  {
    "food_id": 12,
    "name": "Rice - cooked (boiled)",
    "brand": null,
    "reference_unit": "100g",
    "source": { "source_name": "IFCT_2017" },
    "food_nutrients": [
      {
        "food_nutrient_id": 45,
        "food_id": 12,
        "nutrient_id": 1,
        "value_per_100g": "130.0000",
        "nutrient": { "name": "Energy", "unit": "kcal" }
      }
    ]
  }
]
```

---

## API-008: PUT /api/meals/:mealId/items/:itemId

**Purpose**: Correct a misclassified or inaccurate meal item by selecting a new food ID and quantity.

**Auth**: Required.

### Request
```json
{
  "new_food_id": 34,
  "quantity_grams": 150
}
```

### Behavior
1. Validates that the meal belongs to the requesting user (returns 404 if not found).
2. Calculates new nutrient totals for the item and updates `meal_items`.
3. Recalculates parent `meals` macro/calorie totals.
4. Recalculates `daily_logs` totals and `remaining_calories`.
5. Logs correction into `ai_match_log`.

### Response — 200 OK
```json
{
  "meal_id": 55,
  "meal_type": "lunch",
  "total_calories": 480.00,
  "total_protein_g": 18.50,
  "total_carbs_g": 52.00,
  "total_fat_g": 12.00,
  "items": [
    {
      "item_id": 120,
      "food_id": 34,
      "food_name": "Dal Makhani",
      "quantity_grams": 150,
      "estimated_calories": 210,
      "user_corrected": true
    }
  ]
}
```

---

## API-009: DELETE /api/meals/:mealId

**Purpose**: Delete a logged meal and all associated meal items, recalculating the user's daily totals.

**Auth**: Required.

### Behavior
1. Validates that the meal belongs to the requesting user (returns 403 if belonging to another user, 404 if not found).
2. Deletes child `meal_items` (handling foreign key constraints).
3. Deletes parent `meals` record.
4. Updates `daily_logs` with raw SQL recalculation to subtract calories and update `remaining_calories`.

### Response — 204 No Content

---

## API-010: GET /api/meals/history

**Purpose**: Retrieve a paginated list of the user's past meals, including food items and nutrients.

**Auth**: Required.

**Query Params**:
- `page` (optional integer, default `1`)
- `limit` (optional integer, default `10`, max `100`)
- `date` (optional string, `YYYY-MM-DD` date filter)

### Response — 200 OK
```json
{
  "meals": [
    {
      "meal_id": 55,
      "meal_type": "lunch",
      "logged_at": "2026-10-07T13:45:00.000Z",
      "total_calories": 560.00,
      "total_protein_g": 22.10,
      "total_carbs_g": 61.30,
      "total_fat_g": 25.00,
      "items": [
        {
          "item_id": 120,
          "food_id": 12,
          "food_name": "Rice - cooked (boiled)",
          "quantity_grams": 150,
          "estimated_calories": 240,
          "user_corrected": false
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

---

## API-011: POST /api/meals

**Purpose**: Create an empty meal for manual food logging.

**Auth**: Required.

### Request
```json
{
  "meal_type": "lunch"
}
```

### Response — 201 Created
```json
{
  "meal_id": 56,
  "meal_type": "lunch",
  "logged_at": "2026-10-07T14:00:00.000Z",
  "total_calories": 0,
  "total_protein_g": 0,
  "total_carbs_g": 0,
  "total_fat_g": 0,
  "items": []
}
```

---

## API-012: POST /api/meals/:mealId/items

**Purpose**: Manually add a food item to an existing meal and recalculate meal and daily totals.

**Auth**: Required.

### Request
```json
{
  "food_id": 12,
  "quantity_grams": 150
}
```

### Response — 201 Created
```json
{
  "meal_id": 56,
  "meal_type": "lunch",
  "total_calories": 195.00,
  "total_protein_g": 4.05,
  "total_carbs_g": 42.00,
  "total_fat_g": 0.45,
  "items": [
    {
      "item_id": 125,
      "food_id": 12,
      "food_name": "Rice - cooked (boiled)",
      "quantity_grams": 150,
      "estimated_calories": 195,
      "user_corrected": true
    }
  ]
}
```

---

## API-013: POST /api/coach/explain & GET /api/coach/daily-insight

**Purpose**: AI-powered conversational nutritional feedback, dietary analysis, and actionable coaching tips using Google Gemini reasoning.

**Auth**: Required (`Authorization: Bearer <token>`).

### 1. Daily Insight (Automated Context Extraction)
- **Method**: `GET /api/coach/daily-insight?date=YYYY-MM-DD`
- **Behavior**: Automatically pulls user biometrics (calorie target, goal, activity level), current daily logs, and all meal records for the specified date from PostgreSQL, feeding context into the Gemini reasoning pipeline.

### 2. Conversational Q&A / Explicit Evaluation
- **Method**: `POST /api/coach/explain`
- **Request Body**:
```json
{
  "date": "2026-10-22",
  "total_calories": 2150,
  "target_calories": 2000,
  "total_protein_g": 85.5,
  "total_carbs_g": 240.0,
  "total_fat_g": 62.0,
  "meals": [
    { "name": "Lunch Nutrition Plate", "calories": 623 }
  ],
  "user_question": "How can I balance my protein for dinner?"
}
```

### Response — 200 OK
```json
{
  "advice": "You are currently within 150 kcal of your daily target with solid energy intake. Your carbohydrate ratio is balanced, but adding lean protein to dinner will optimize muscle recovery.",
  "badge": "On Track",
  "summary": "Caloric budget healthy with slight protein deficit.",
  "suggestions": [
    "Opt for 150g grilled paneer, tofu, or chicken breast for dinner",
    "Pair with a high-fiber green salad to stabilize digestion"
  ],
  "macro_critique": "Protein is at 70% of goal; carbs and fats are in ideal equilibrium.",
  "next_meal_tip": "Focus on high-protein, low-carbohydrate options for dinner.",
  "context": {
    "target_calories": 2000,
    "consumed_calories": 2150,
    "remaining_calories": -150
  }
}
```

### Response — 503 Service Unavailable
Returned when `GEMINI_API_KEY` is missing:
```json
{
  "error": "COACH_UNAVAILABLE",
  "message": "AI Coach is not configured. Set GEMINI_API_KEY to enable this feature."
}
```

---

## API-014: POST /api/auth/dev-login

**Purpose**: One-click development and testing authentication bypass to obtain a valid JWT token without requiring external Google OAuth consent popups.

**Availability**: Active only when `DEV_LOGIN_ENABLED=true` or `NODE_ENV=development`.

### Request
- **Method**: `POST /api/auth/dev-login`
- **Headers**: `Content-Type: application/json`
- **Body**: `{}` (Empty or optional password)

### Response — 200 OK
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": 1,
    "email": "dev@test.com",
    "display_name": "Dev User"
  }
}
```

### Response — 403 Forbidden
Returned if invoked in production mode with dev login disabled:
```json
{
  "error": "FORBIDDEN",
  "message": "Dev login is only available in development mode"
}
```

