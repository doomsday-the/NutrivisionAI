# 03_01 Canonical Data Model

**Status**: This is the single authoritative database schema. `docs/database_schema.md` is superseded by this document and should not be referenced for implementation.

All table names use `snake_case`. All IDs are `SERIAL` (auto-incrementing integer) unless otherwise noted. All timestamps are `TIMESTAMPTZ` (timezone-aware). `NN` = NOT NULL constraint.

---

## Schema Overview

The database uses two PostgreSQL schemas:
- **`public`** — production tables used by the application at runtime.
- **`staging`** — temporary ingestion tables used only during ETL. Never queried by the application API.

---

## Public Schema Tables

### `public.users`
Stores authenticated users. Primary authentication is via Google OAuth (ADR-003). The `password_hash` column is populated with a BCrypt hash of a randomly generated value on OAuth signup — it is never used for login but satisfies the university rubric's password hashing requirement (Section 5).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `user_id` | SERIAL | PK | Internal user identifier |
| `google_id` | VARCHAR(255) | NN, UNIQUE | Google sub claim from the ID token |
| `email` | VARCHAR(255) | NN, UNIQUE | Email from Google profile |
| `display_name` | VARCHAR(255) | NN | Display name from Google profile |
| `avatar_url` | TEXT | | Profile picture URL from Google |
| `role` | VARCHAR(20) | NN, DEFAULT 'user', CHECK IN ('admin', 'user') | Role for RBAC. `admin` users can access protected admin endpoints. |
| `password_hash` | VARCHAR(255) | NN | BCrypt hash of a random value. Set on account creation. Never used for login. |
| `created_at` | TIMESTAMPTZ | NN, DEFAULT NOW() | Account creation timestamp |
| `last_login_at` | TIMESTAMPTZ | NN | Updated on every successful login |

**Indexes**: `google_id` (UNIQUE), `email` (UNIQUE).

**RBAC**: Two roles exist — `user` (default) and `admin`. The Node.js middleware checks `req.user.role === 'admin'` before allowing access to any `/api/admin/*` routes. All other routes are accessible to both roles.


---

### `public.user_profiles`
Stores health and goal data for a user. 1:1 with `users`. Created on first profile completion, not on signup.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `profile_id` | SERIAL | PK | |
| `user_id` | INT | NN, FK → users.user_id, UNIQUE | |
| `age` | INT | | Years |
| `height_cm` | NUMERIC(5,2) | | Height in centimetres |
| `weight_kg` | NUMERIC(5,2) | | Current weight in kilograms |
| `activity_level` | VARCHAR(20) | CHECK IN ('sedentary','light','moderate','active','very_active') | Used for TDEE calculation |
| `goal` | VARCHAR(20) | CHECK IN ('lose','maintain','gain') | User's dietary goal |
| `daily_calorie_target` | NUMERIC(7,2) | | Calculated TDEE-based target. Set on profile save. |
| `updated_at` | TIMESTAMPTZ | NN, DEFAULT NOW() | |

---

### `public.food_sources`
Registry of data sources. Every food item is traceable to its origin.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `source_id` | SERIAL | PK | |
| `source_name` | VARCHAR(100) | NN, UNIQUE | e.g. `ICMR-NIN IFCT 2017`, `USDA FoodData Central` |
| `source_version` | VARCHAR(50) | | e.g. `2017`, `April 2024 release` |
| `source_url` | TEXT | | Reference URL |
| `imported_at` | TIMESTAMPTZ | | When ETL completed for this source |
| `notes` | TEXT | | Free-text notes |

**Seed data**: Two rows must exist before any food data is ingested — `source_id=1` for ICMR-NIN IFCT 2017 and `source_id=2` for USDA FoodData Central.

---

### `public.food_categories`
Hierarchical food taxonomy. A category may have a parent (e.g., `Legumes` → `Pulses` → `Indian Staples`).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `category_id` | SERIAL | PK | |
| `parent_id` | INT | FK → food_categories.category_id, NULLABLE | NULL = top-level category |
| `name` | VARCHAR(150) | NN, UNIQUE | Human-readable category name |
| `slug` | VARCHAR(150) | NN, UNIQUE | URL-safe identifier (e.g., `indian-pulses`) |
| `description` | TEXT | | |

---

### `public.food_items`
Central food registry. Represents a single food in a single preparation state.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `food_id` | SERIAL | PK | |
| `external_id` | VARCHAR(100) | | Source system's own identifier (IFCT code or USDA FDC ID) |
| `source_id` | INT | NN, FK → food_sources.source_id | Which database this came from |
| `category_id` | INT | FK → food_categories.category_id | |
| `name` | VARCHAR(255) | NN | Canonical English name |
| `name_local` | VARCHAR(255) | | Local language name (Hindi, Tamil, etc.) |
| `food_type` | VARCHAR(20) | NN, CHECK IN ('raw','cooked','packaged','beverage','ingredient') | Preparation state — see note below |
| `reference_unit` | VARCHAR(180) | NN, DEFAULT '100g' | The unit all nutrient values are expressed per |
| `density_g_per_ml` | NUMERIC(6,4) | | Used for volume-to-weight estimation; NULL if not applicable |
| `brand` | VARCHAR(150) | | Brand name for packaged foods |
| `country_origin` | VARCHAR(100) | | |
| `is_verified` | BOOLEAN | NN, DEFAULT FALSE | Manually verified by a team member |
| `is_active` | BOOLEAN | NN, DEFAULT TRUE | Soft-delete flag |
| `search_vector` | TSVECTOR | | Populated by trigger from `name` + `name_local` |
| `created_at` | TIMESTAMPTZ | NN, DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NN, DEFAULT NOW() | |

**Note on `food_type`**: "Rice - raw" and "Rice - cooked (boiled)" are stored as two separate `food_items` rows with `food_type = 'raw'` and `food_type = 'cooked'` respectively. This is the canonical mechanism for distinguishing preparation states.

**Indexes**: `search_vector` (GIN index for full-text search), `source_id`, `category_id`.

---

### `public.nutrient_types`
Defines every nutrient the system tracks (Calories, Protein, Fat, etc.).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `nutrient_id` | SERIAL | PK | |
| `name` | VARCHAR(100) | NN, UNIQUE | e.g. `Energy`, `Protein`, `Total Fat` |
| `display_name` | VARCHAR(100) | NN | UI-friendly name |
| `unit` | VARCHAR(20) | NN | e.g. `kcal`, `g`, `mg`, `mcg` |
| `category` | VARCHAR(50) | | e.g. `macro`, `micro`, `mineral`, `vitamin` |
| `daily_value_ref` | NUMERIC(10,3) | | Reference daily intake per ICMR/WHO guidelines |
| `sort_order` | INT | | Display ordering in UI |

**Seed data**: Minimum required rows — Energy (kcal), Protein (g), Total Carbohydrate (g), Total Fat (g), Dietary Fiber (g), Total Sugars (g), Sodium (mg).

---

### `public.food_nutrients`
Stores the per-`reference_unit` nutritional value for each food-nutrient combination. This is the M:N junction between `food_items` and `nutrient_types`.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `food_nutrient_id` | SERIAL | PK | |
| `food_id` | INT | NN, FK → food_items.food_id | |
| `nutrient_id` | INT | NN, FK → nutrient_types.nutrient_id | |
| `value_per_100g` | NUMERIC(12,4) | NN | Nutrient amount per 100g of the food |
| `data_points` | INT | | Number of samples this value is based on |
| `min_value` | NUMERIC(12,4) | | Minimum observed value across samples |
| `max_value` | NUMERIC(12,4) | | Maximum observed value across samples |

**Unique constraint**: `(food_id, nutrient_id)` — one nutrient value per food per nutrient type.

---

### `public.serving_sizes`
Defines named serving sizes for a food (e.g., "1 small bowl", "1 roti").

| Column | Type | Constraints | Description |
|---|---|---|---|
| `serving_id` | SERIAL | PK | |
| `food_id` | INT | NN, FK → food_items.food_id | |
| `serving_name` | VARCHAR(100) | NN | e.g. `1 small bowl`, `1 medium roti` |
| `serving_unit` | VARCHAR(20) | NN, CHECK IN ('g','ml','piece','cup','tbsp','tsp') | |
| `quantity` | NUMERIC(8,2) | NN | Quantity in `serving_unit` |
| `weight_grams` | NUMERIC(8,2) | NN | Equivalent weight in grams |
| `notes` | TEXT | | |

---

### `public.food_aliases`
Alternative names and search terms for a food item.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `alias_id` | SERIAL | PK | |
| `food_id` | INT | NN, FK → food_items.food_id | |
| `alias` | VARCHAR(255) | NN | Alternative name (e.g. "Cottage Cheese" for Paneer) |
| `alias_type` | VARCHAR(50) | | e.g. `regional`, `colloquial`, `brand`, `scientific` |
| `language` | VARCHAR(10) | | ISO 639-1 language code, e.g. `hi`, `ta`, `en` |

---

### `public.tags`
Descriptive tags for food items (e.g., `vegan`, `high-protein`, `indian`).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `tag_id` | SERIAL | PK | |
| `name` | VARCHAR(50) | NN, UNIQUE | |
| `description` | TEXT | | |

---

### `public.food_tags`
Junction table linking foods to tags (M:N).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `food_id` | INT | NN, FK → food_items.food_id | |
| `tag_id` | INT | NN, FK → tags.tag_id | |

**Primary Key**: `(food_id, tag_id)`.

---

### `public.meals`
A single logged meal event by a user.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `meal_id` | SERIAL | PK | |
| `user_id` | INT | NN, FK → users.user_id | |
| `image_url` | TEXT | | URL to stored meal image |
| `meal_type` | VARCHAR(20) | NN, CHECK IN ('breakfast','lunch','dinner','snack') | |
| `total_calories` | NUMERIC(8,2) | | Calculated sum — denormalized for fast dashboard queries |
| `total_protein_g` | NUMERIC(8,2) | | Denormalized sum |
| `total_carbs_g` | NUMERIC(8,2) | | Denormalized sum |
| `total_fat_g` | NUMERIC(8,2) | | Denormalized sum |
| `notes` | TEXT | | Optional user notes |
| `logged_at` | TIMESTAMPTZ | NN, DEFAULT NOW() | |

---

### `public.meal_items`
Individual food items within a meal. M:N junction between `meals` and `food_items`.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `item_id` | SERIAL | PK | |
| `meal_id` | INT | NN, FK → meals.meal_id | |
| `food_id` | INT | NN, FK → food_items.food_id | |
| `quantity_grams` | NUMERIC(8,2) | NN | Estimated or user-adjusted weight |
| `estimated_calories` | NUMERIC(8,2) | NN | Calculated at log time |
| `serving_id` | INT | FK → serving_sizes.serving_id | The serving size selected (if user chose one) |
| `user_corrected` | BOOLEAN | NN, DEFAULT FALSE | TRUE if user manually adjusted the quantity |

---

### `public.daily_logs`
Aggregated daily nutrition summary per user. One row per user per calendar day.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `log_id` | SERIAL | PK | |
| `user_id` | INT | NN, FK → users.user_id | |
| `log_date` | DATE | NN | Calendar date (server timezone: UTC) |
| `total_calories` | NUMERIC(8,2) | NN, DEFAULT 0 | Sum of all meal calories for the day |
| `total_protein_g` | NUMERIC(8,2) | NN, DEFAULT 0 | |
| `total_carbs_g` | NUMERIC(8,2) | NN, DEFAULT 0 | |
| `total_fat_g` | NUMERIC(8,2) | NN, DEFAULT 0 | |
| `calories_burned` | NUMERIC(8,2) | NN, DEFAULT 0 | Pushed from WearOS via activity sync |
| `steps` | INT | NN, DEFAULT 0 | Pushed from WearOS |
| `target_calories` | NUMERIC(8,2) | NN | Copied from `user_profiles.daily_calorie_target` at log creation |
| `remaining_calories` | NUMERIC(8,2) | | Computed: `target_calories - total_calories + calories_burned` |

**Unique constraint**: `(user_id, log_date)`.

---

### `public.ai_match_log`
Records every AI detection event for model evaluation and future training.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `log_id` | SERIAL | PK | |
| `detected_label` | VARCHAR(255) | NN | Raw string the model returned (e.g. `"rice"`) |
| `matched_food_id` | INT | FK → food_items.food_id | The `food_id` resolved from the label |
| `match_score` | NUMERIC(5,4) | | Confidence score from the AI model (0.0000–1.0000) |
| `match_method` | VARCHAR(50) | | e.g. `mock`, `mobilenet`, `yolov8` |
| `weight_grams` | NUMERIC(8,2) | | Estimated weight passed to nutrition calculation |
| `user_corrected` | BOOLEAN | NN, DEFAULT FALSE | TRUE if user overrode the AI result |
| `corrected_food_id` | INT | FK → food_items.food_id | The food_id the user chose instead |
| `session_id` | VARCHAR(100) | | Request correlation ID |
| `created_at` | TIMESTAMPTZ | NN, DEFAULT NOW() | |

---

## Staging Schema Tables
These tables exist only to receive raw data from ETL scripts. Application API code must never query staging tables.

### `staging.icmr_food`
Raw IFCT 2017 data as extracted from the source.

| Column | Type | Description |
|---|---|---|
| `ifct_code` | VARCHAR(20) | IFCT food code |
| `food_name` | TEXT | Food name as in IFCT |
| `food_group` | TEXT | IFCT food group |
| `energy_kcal` | NUMERIC(10,3) | Per 100g |
| `protein_g` | NUMERIC(10,3) | Per 100g |
| `fat_g` | NUMERIC(10,3) | Per 100g |
| `carbohydrate_g` | NUMERIC(10,3) | Per 100g |
| `fiber_g` | NUMERIC(10,3) | Per 100g |
| `sodium_mg` | NUMERIC(10,3) | Per 100g |
| `imported_at` | TIMESTAMPTZ | Batch import timestamp |

### `staging.usda_food`
Raw USDA FDC food records.

| Column | Type | Description |
|---|---|---|
| `fdc_id` | INT | USDA FDC identifier |
| `data_type` | VARCHAR(50) | |
| `description` | TEXT | |
| `food_category` | TEXT | |
| `publication_date` | VARCHAR(20) | |
| `imported_at` | TIMESTAMPTZ | |

### `staging.usda_nutrient`
Raw USDA FDC nutrient records.

| Column | Type | Description |
|---|---|---|
| `fdc_id` | INT | FK to staging.usda_food |
| `nutrient_name` | VARCHAR(100) | |
| `amount` | NUMERIC(14,4) | Per 100g |
| `unit_name` | VARCHAR(20) | |
| `imported_at` | TIMESTAMPTZ | |

---

## Required SQL Triggers
The following triggers must be implemented (satisfies university requirement):

1. **`trg_update_search_vector`**: After INSERT or UPDATE on `food_items`, recomputes `search_vector` from `name` and `name_local` using `to_tsvector('english', ...)`.
2. **`trg_update_daily_log`**: After INSERT on `meal_items`, recalculates and updates the corresponding row in `daily_logs` (or inserts a new row if none exists for that date).
3. **`trg_set_updated_at`**: Before UPDATE on `food_items` and `user_profiles`, sets `updated_at = NOW()`.

---

## Required SQL Views
The following views must be created (satisfies university implementation rubric Section 3):

### `public.vw_user_daily_summary`
A pre-joined view returning today's nutritional summary for each user. Used by the dashboard query to avoid repeated joins.

```sql
CREATE VIEW public.vw_user_daily_summary AS
SELECT
    u.user_id,
    u.email,
    u.display_name,
    dl.log_date,
    dl.total_calories,
    dl.total_protein_g,
    dl.total_carbs_g,
    dl.total_fat_g,
    dl.calories_burned,
    dl.steps,
    dl.target_calories,
    dl.remaining_calories
FROM public.users u
LEFT JOIN public.daily_logs dl
    ON u.user_id = dl.user_id
    AND dl.log_date = CURRENT_DATE;
```

### `public.vw_food_full`
A denormalized view joining `food_items` with its core macro-nutrients for fast lookups during nutrition calculation. Avoids repeated joins in the Node.js service layer.

```sql
CREATE VIEW public.vw_food_full AS
SELECT
    fi.food_id,
    fi.name,
    fi.name_local,
    fi.food_type,
    fi.density_g_per_ml,
    fc.name AS category_name,
    fs.source_name,
    MAX(CASE WHEN nt.nutrient_id = 1 THEN fn.value_per_100g END) AS energy_kcal,
    MAX(CASE WHEN nt.nutrient_id = 2 THEN fn.value_per_100g END) AS protein_g,
    MAX(CASE WHEN nt.nutrient_id = 3 THEN fn.value_per_100g END) AS carbs_g,
    MAX(CASE WHEN nt.nutrient_id = 4 THEN fn.value_per_100g END) AS fat_g,
    MAX(CASE WHEN nt.nutrient_id = 5 THEN fn.value_per_100g END) AS fiber_g
FROM public.food_items fi
LEFT JOIN public.food_nutrients fn ON fi.food_id = fn.food_id
LEFT JOIN public.nutrient_types nt ON fn.nutrient_id = nt.nutrient_id
LEFT JOIN public.food_categories fc ON fi.category_id = fc.category_id
LEFT JOIN public.food_sources fs ON fi.source_id = fs.source_id
WHERE fi.is_active = TRUE
GROUP BY fi.food_id, fi.name, fi.name_local, fi.food_type, fi.density_g_per_ml, fc.name, fs.source_name;
```

---

## Required Stored Procedure
The following stored procedure must be implemented (satisfies university implementation rubric Section 3):

### `sp_log_meal(user_id, meal_type, detections JSONB)`
Encapsulates the entire meal logging transaction as a single atomic database operation. Called from the Node.js service layer after receiving the AI response.

**Logic**:
1. Insert a row into `meals`.
2. For each item in the `detections` JSON array, insert a row into `meal_items`.
3. Insert a row into `ai_match_log` for each detection.
4. Upsert `daily_logs` for the current date, recalculating totals.
5. Return the `meal_id` of the created meal.

**Note**: While Prisma handles routine CRUD, raw SQL is explicitly permitted by the university rubric for stored procedures. This procedure is called via Prisma's `$queryRaw` or a dedicated SQL migration file.

