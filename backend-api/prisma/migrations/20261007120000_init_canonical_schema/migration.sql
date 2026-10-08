-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";
CREATE SCHEMA IF NOT EXISTS "staging";

-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "google_id" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "display_name" VARCHAR(255) NOT NULL,
    "avatar_url" TEXT,
    "role" VARCHAR(20) NOT NULL DEFAULT 'user',
    "password_hash" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "profile_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "age" INTEGER,
    "height_cm" DECIMAL(5,2),
    "weight_kg" DECIMAL(5,2),
    "activity_level" VARCHAR(20),
    "goal" VARCHAR(20),
    "daily_calorie_target" DECIMAL(7,2),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("profile_id")
);

-- CreateTable
CREATE TABLE "food_sources" (
    "source_id" SERIAL NOT NULL,
    "source_name" VARCHAR(100) NOT NULL,
    "source_version" VARCHAR(50),
    "source_url" TEXT,
    "imported_at" TIMESTAMPTZ,
    "notes" TEXT,

    CONSTRAINT "food_sources_pkey" PRIMARY KEY ("source_id")
);

-- CreateTable
CREATE TABLE "food_categories" (
    "category_id" SERIAL NOT NULL,
    "parent_id" INTEGER,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "description" TEXT,

    CONSTRAINT "food_categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "food_items" (
    "food_id" SERIAL NOT NULL,
    "external_id" VARCHAR(100),
    "source_id" INTEGER NOT NULL,
    "category_id" INTEGER,
    "name" VARCHAR(255) NOT NULL,
    "name_local" VARCHAR(255),
    "food_type" VARCHAR(20) NOT NULL,
    "reference_unit" VARCHAR(180) NOT NULL DEFAULT '100g',
    "density_g_per_ml" DECIMAL(6,4),
    "brand" VARCHAR(150),
    "country_origin" VARCHAR(100),
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "search_vector" tsvector,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "food_items_pkey" PRIMARY KEY ("food_id")
);

-- CreateTable
CREATE TABLE "nutrient_types" (
    "nutrient_id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "category" VARCHAR(50),
    "daily_value_ref" DECIMAL(10,3),
    "sort_order" INTEGER,

    CONSTRAINT "nutrient_types_pkey" PRIMARY KEY ("nutrient_id")
);

-- CreateTable
CREATE TABLE "food_nutrients" (
    "food_nutrient_id" SERIAL NOT NULL,
    "food_id" INTEGER NOT NULL,
    "nutrient_id" INTEGER NOT NULL,
    "value_per_100g" DECIMAL(12,4) NOT NULL,
    "data_points" INTEGER,
    "min_value" DECIMAL(12,4),
    "max_value" DECIMAL(12,4),

    CONSTRAINT "food_nutrients_pkey" PRIMARY KEY ("food_nutrient_id")
);

-- CreateTable
CREATE TABLE "serving_sizes" (
    "serving_id" SERIAL NOT NULL,
    "food_id" INTEGER NOT NULL,
    "serving_name" VARCHAR(100) NOT NULL,
    "serving_unit" VARCHAR(20) NOT NULL,
    "quantity" DECIMAL(8,2) NOT NULL,
    "weight_grams" DECIMAL(8,2) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "serving_sizes_pkey" PRIMARY KEY ("serving_id")
);

-- CreateTable
CREATE TABLE "food_aliases" (
    "alias_id" SERIAL NOT NULL,
    "food_id" INTEGER NOT NULL,
    "alias" VARCHAR(255) NOT NULL,
    "alias_type" VARCHAR(50),
    "language" VARCHAR(10),

    CONSTRAINT "food_aliases_pkey" PRIMARY KEY ("alias_id")
);

-- CreateTable
CREATE TABLE "tags" (
    "tag_id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("tag_id")
);

-- CreateTable
CREATE TABLE "food_tags" (
    "food_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "food_tags_pkey" PRIMARY KEY ("food_id","tag_id")
);

-- CreateTable
CREATE TABLE "meals" (
    "meal_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "image_url" TEXT,
    "meal_type" VARCHAR(20) NOT NULL,
    "total_calories" DECIMAL(8,2),
    "total_protein_g" DECIMAL(8,2),
    "total_carbs_g" DECIMAL(8,2),
    "total_fat_g" DECIMAL(8,2),
    "notes" TEXT,
    "logged_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meals_pkey" PRIMARY KEY ("meal_id")
);

-- CreateTable
CREATE TABLE "meal_items" (
    "item_id" SERIAL NOT NULL,
    "meal_id" INTEGER NOT NULL,
    "food_id" INTEGER NOT NULL,
    "quantity_grams" DECIMAL(8,2) NOT NULL,
    "estimated_calories" DECIMAL(8,2) NOT NULL,
    "serving_id" INTEGER,
    "user_corrected" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "meal_items_pkey" PRIMARY KEY ("item_id")
);

-- CreateTable
CREATE TABLE "daily_logs" (
    "log_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "log_date" DATE NOT NULL,
    "total_calories" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "total_protein_g" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "total_carbs_g" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "total_fat_g" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "calories_burned" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "steps" INTEGER NOT NULL DEFAULT 0,
    "target_calories" DECIMAL(8,2) NOT NULL,
    "remaining_calories" DECIMAL(8,2),

    CONSTRAINT "daily_logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "ai_match_log" (
    "log_id" SERIAL NOT NULL,
    "detected_label" VARCHAR(255) NOT NULL,
    "matched_food_id" INTEGER,
    "match_score" DECIMAL(5,4),
    "match_method" VARCHAR(50),
    "weight_grams" DECIMAL(8,2),
    "user_corrected" BOOLEAN NOT NULL DEFAULT false,
    "corrected_food_id" INTEGER,
    "session_id" VARCHAR(100),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_match_log_pkey" PRIMARY KEY ("log_id")
);

-- Staging Tables
CREATE TABLE "staging"."icmr_food" (
    "ifct_code" VARCHAR(20),
    "food_name" TEXT,
    "food_group" TEXT,
    "energy_kcal" NUMERIC(10,3),
    "protein_g" NUMERIC(10,3),
    "fat_g" NUMERIC(10,3),
    "carbohydrate_g" NUMERIC(10,3),
    "fiber_g" NUMERIC(10,3),
    "sodium_mg" NUMERIC(10,3),
    "imported_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "staging"."usda_food" (
    "fdc_id" INTEGER,
    "data_type" VARCHAR(50),
    "description" TEXT,
    "food_category" TEXT,
    "publication_date" VARCHAR(20),
    "imported_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "staging"."usda_nutrient" (
    "fdc_id" INTEGER,
    "nutrient_name" VARCHAR(100),
    "amount" NUMERIC(14,4),
    "unit_name" VARCHAR(20),
    "imported_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");
CREATE UNIQUE INDEX "food_sources_source_name_key" ON "food_sources"("source_name");
CREATE UNIQUE INDEX "food_categories_name_key" ON "food_categories"("name");
CREATE UNIQUE INDEX "food_categories_slug_key" ON "food_categories"("slug");
CREATE UNIQUE INDEX "nutrient_types_name_key" ON "nutrient_types"("name");
CREATE UNIQUE INDEX "food_nutrients_food_id_nutrient_id_key" ON "food_nutrients"("food_id", "nutrient_id");
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");
CREATE UNIQUE INDEX "daily_logs_user_id_log_date_key" ON "daily_logs"("user_id", "log_date");
CREATE INDEX "food_items_search_vector_idx" ON "food_items" USING gin("search_vector");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "food_categories" ADD CONSTRAINT "food_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "food_categories"("category_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "food_items" ADD CONSTRAINT "food_items_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "food_sources"("source_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "food_items" ADD CONSTRAINT "food_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "food_categories"("category_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "food_nutrients" ADD CONSTRAINT "food_nutrients_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "food_items"("food_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "food_nutrients" ADD CONSTRAINT "food_nutrients_nutrient_id_fkey" FOREIGN KEY ("nutrient_id") REFERENCES "nutrient_types"("nutrient_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "serving_sizes" ADD CONSTRAINT "serving_sizes_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "food_items"("food_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "food_aliases" ADD CONSTRAINT "food_aliases_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "food_items"("food_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "food_tags" ADD CONSTRAINT "food_tags_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "food_items"("food_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "food_tags" ADD CONSTRAINT "food_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("tag_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "meals" ADD CONSTRAINT "meals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "meal_items" ADD CONSTRAINT "meal_items_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "meals"("meal_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "meal_items" ADD CONSTRAINT "meal_items_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "food_items"("food_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "meal_items" ADD CONSTRAINT "meal_items_serving_id_fkey" FOREIGN KEY ("serving_id") REFERENCES "serving_sizes"("serving_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ai_match_log" ADD CONSTRAINT "ai_match_log_matched_food_id_fkey" FOREIGN KEY ("matched_food_id") REFERENCES "food_items"("food_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_match_log" ADD CONSTRAINT "ai_match_log_corrected_food_id_fkey" FOREIGN KEY ("corrected_food_id") REFERENCES "food_items"("food_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Required SQL Views
CREATE OR REPLACE VIEW public.vw_user_daily_summary AS
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

CREATE OR REPLACE VIEW public.vw_food_full AS
SELECT
    fi.food_id,
    fi.name,
    fi.name_local,
    fi.food_type,
    fi.density_g_per_ml,
    fc.name AS category_name,
    fs.source_name,
    MAX(CASE WHEN nt.name = 'energy' OR nt.nutrient_id = 1 THEN fn.value_per_100g END) AS energy_kcal,
    MAX(CASE WHEN nt.name = 'protein' OR nt.nutrient_id = 2 THEN fn.value_per_100g END) AS protein_g,
    MAX(CASE WHEN nt.name = 'carbohydrate' OR nt.nutrient_id = 3 THEN fn.value_per_100g END) AS carbs_g,
    MAX(CASE WHEN nt.name = 'fat' OR nt.nutrient_id = 4 THEN fn.value_per_100g END) AS fat_g,
    MAX(CASE WHEN nt.name = 'fiber' OR nt.nutrient_id = 5 THEN fn.value_per_100g END) AS fiber_g,
    MAX(CASE WHEN nt.name = 'sugars' OR nt.nutrient_id = 6 THEN fn.value_per_100g END) AS sugars_g,
    MAX(CASE WHEN nt.name = 'sodium' OR nt.nutrient_id = 7 THEN fn.value_per_100g END) AS sodium_mg
FROM public.food_items fi
LEFT JOIN public.food_nutrients fn ON fi.food_id = fn.food_id
LEFT JOIN public.nutrient_types nt ON fn.nutrient_id = nt.nutrient_id
LEFT JOIN public.food_categories fc ON fi.category_id = fc.category_id
LEFT JOIN public.food_sources fs ON fi.source_id = fs.source_id
WHERE fi.is_active = TRUE
GROUP BY fi.food_id, fi.name, fi.name_local, fi.food_type, fi.density_g_per_ml, fc.name, fs.source_name;

-- Required SQL Triggers & Functions
CREATE OR REPLACE FUNCTION update_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.name_local, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_search_vector ON public.food_items;
CREATE TRIGGER trg_update_search_vector
BEFORE INSERT OR UPDATE ON public.food_items
FOR EACH ROW EXECUTE FUNCTION update_search_vector();

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_updated_at_food ON public.food_items;
CREATE TRIGGER trg_set_updated_at_food
BEFORE UPDATE ON public.food_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at_profile ON public.user_profiles;
CREATE TRIGGER trg_set_updated_at_profile
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Trigger to update daily logs when a meal item is added/updated/deleted
CREATE OR REPLACE FUNCTION update_daily_log_totals() RETURNS trigger AS $$
DECLARE
  v_user_id INT;
  v_log_date DATE;
  v_total_cal NUMERIC;
  v_total_pro NUMERIC;
  v_total_carb NUMERIC;
  v_total_fat NUMERIC;
  v_target NUMERIC;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT user_id, (logged_at AT TIME ZONE 'UTC')::DATE INTO v_user_id, v_log_date
    FROM public.meals WHERE meal_id = OLD.meal_id;
  ELSE
    SELECT user_id, (logged_at AT TIME ZONE 'UTC')::DATE INTO v_user_id, v_log_date
    FROM public.meals WHERE meal_id = NEW.meal_id;
  END IF;

  -- Summarize all meals for this user/date
  SELECT
    COALESCE(SUM(m.total_calories), 0),
    COALESCE(SUM(m.total_protein_g), 0),
    COALESCE(SUM(m.total_carbs_g), 0),
    COALESCE(SUM(m.total_fat_g), 0)
  INTO v_total_cal, v_total_pro, v_total_carb, v_total_fat
  FROM public.meals m
  WHERE m.user_id = v_user_id AND (m.logged_at AT TIME ZONE 'UTC')::DATE = v_log_date;

  -- Ensure daily log exists
  SELECT COALESCE(daily_calorie_target, 2000) INTO v_target
  FROM public.user_profiles WHERE user_id = v_user_id;
  IF v_target IS NULL THEN v_target := 2000; END IF;

  INSERT INTO public.daily_logs (user_id, log_date, target_calories, total_calories, total_protein_g, total_carbs_g, total_fat_g, calories_burned, remaining_calories, steps)
  VALUES (v_user_id, v_log_date, v_target, v_total_cal, v_total_pro, v_total_carb, v_total_fat, 0, v_target - v_total_cal, 0)
  ON CONFLICT (user_id, log_date) DO UPDATE
  SET total_calories = EXCLUDED.total_calories,
      total_protein_g = EXCLUDED.total_protein_g,
      total_carbs_g = EXCLUDED.total_carbs_g,
      total_fat_g = EXCLUDED.total_fat_g,
      remaining_calories = daily_logs.target_calories - EXCLUDED.total_calories + daily_logs.calories_burned;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_daily_log ON public.meal_items;
CREATE TRIGGER trg_update_daily_log
AFTER INSERT OR UPDATE OR DELETE ON public.meal_items
FOR EACH ROW EXECUTE FUNCTION update_daily_log_totals();

-- Required Stored Procedure: sp_log_meal
CREATE OR REPLACE PROCEDURE sp_log_meal(
  p_user_id INT,
  p_meal_type VARCHAR,
  p_image_url TEXT,
  p_detections JSONB,
  p_session_id VARCHAR,
  OUT p_meal_id INT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_item JSONB;
  v_food_id INT;
  v_qty NUMERIC;
  v_kcal NUMERIC;
  v_label VARCHAR;
  v_score NUMERIC;
  v_method VARCHAR;
  v_total_cal NUMERIC := 0;
  v_total_pro NUMERIC := 0;
  v_total_carb NUMERIC := 0;
  v_total_fat NUMERIC := 0;
  v_food_kcal NUMERIC;
  v_food_pro NUMERIC;
  v_food_carb NUMERIC;
  v_food_fat NUMERIC;
  v_target NUMERIC;
  v_today DATE := (NOW() AT TIME ZONE 'UTC')::DATE;
BEGIN
  -- 0. Ensure a daily_logs row exists for today
  SELECT COALESCE(daily_calorie_target, 2000) INTO v_target
  FROM public.user_profiles WHERE user_id = p_user_id;
  IF v_target IS NULL THEN v_target := 2000; END IF;

  INSERT INTO public.daily_logs (user_id, log_date, target_calories, total_calories, total_protein_g, total_carbs_g, total_fat_g, calories_burned, remaining_calories, steps)
  VALUES (p_user_id, v_today, v_target, 0, 0, 0, 0, 0, v_target, 0)
  ON CONFLICT (user_id, log_date) DO NOTHING;

  -- 1. Insert meal row
  INSERT INTO public.meals (user_id, meal_type, image_url, logged_at)
  VALUES (p_user_id, p_meal_type, p_image_url, NOW())
  RETURNING meal_id INTO p_meal_id;

  -- 2. Loop through detections
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_detections)
  LOOP
    v_food_id := (v_item->>'matched_food_id')::INT;
    v_qty := COALESCE((v_item->>'suggested_weight_grams')::NUMERIC, 100);
    v_label := v_item->>'detected_label';
    v_score := (v_item->>'confidence')::NUMERIC;
    v_method := COALESCE(v_item->>'match_method', 'mock');

    -- Insert into ai_match_log
    INSERT INTO public.ai_match_log (detected_label, matched_food_id, match_score, match_method, weight_grams, session_id)
    VALUES (v_label, v_food_id, v_score, v_method, v_qty, p_session_id);

    IF v_food_id IS NOT NULL THEN
      -- Get macros from view
      SELECT
        COALESCE(energy_kcal, 0),
        COALESCE(protein_g, 0),
        COALESCE(carbs_g, 0),
        COALESCE(fat_g, 0)
      INTO v_food_kcal, v_food_pro, v_food_carb, v_food_fat
      FROM public.vw_food_full WHERE food_id = v_food_id;

      -- Calculate scaled nutrition
      v_kcal := (COALESCE(v_food_kcal, 0) / 100) * v_qty;
      v_total_cal := v_total_cal + v_kcal;
      v_total_pro := v_total_pro + ((COALESCE(v_food_pro, 0) / 100) * v_qty);
      v_total_carb := v_total_carb + ((COALESCE(v_food_carb, 0) / 100) * v_qty);
      v_total_fat := v_total_fat + ((COALESCE(v_food_fat, 0) / 100) * v_qty);

      -- Insert meal item
      INSERT INTO public.meal_items (meal_id, food_id, quantity_grams, estimated_calories)
      VALUES (p_meal_id, v_food_id, v_qty, v_kcal);
    END IF;
  END LOOP;

  -- 3. Update meal totals
  UPDATE public.meals
  SET total_calories = v_total_cal,
      total_protein_g = v_total_pro,
      total_carbs_g = v_total_carb,
      total_fat_g = v_total_fat
  WHERE meal_id = p_meal_id;

  -- 4. Update daily log totals
  UPDATE public.daily_logs
  SET total_calories = (
        SELECT COALESCE(SUM(m.total_calories), 0) FROM public.meals m
        WHERE m.user_id = p_user_id AND (m.logged_at AT TIME ZONE 'UTC')::DATE = v_today
      ),
      total_protein_g = (
        SELECT COALESCE(SUM(m.total_protein_g), 0) FROM public.meals m
        WHERE m.user_id = p_user_id AND (m.logged_at AT TIME ZONE 'UTC')::DATE = v_today
      ),
      total_carbs_g = (
        SELECT COALESCE(SUM(m.total_carbs_g), 0) FROM public.meals m
        WHERE m.user_id = p_user_id AND (m.logged_at AT TIME ZONE 'UTC')::DATE = v_today
      ),
      total_fat_g = (
        SELECT COALESCE(SUM(m.total_fat_g), 0) FROM public.meals m
        WHERE m.user_id = p_user_id AND (m.logged_at AT TIME ZONE 'UTC')::DATE = v_today
      ),
      remaining_calories = target_calories - (
        SELECT COALESCE(SUM(m.total_calories), 0) FROM public.meals m
        WHERE m.user_id = p_user_id AND (m.logged_at AT TIME ZONE 'UTC')::DATE = v_today
      ) + calories_burned
  WHERE user_id = p_user_id AND log_date = v_today;
END;
$$;
