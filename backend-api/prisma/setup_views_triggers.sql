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


-- Required Triggers
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


-- Trigger to update daily logs when a meal item is added
CREATE OR REPLACE FUNCTION update_daily_log_totals() RETURNS trigger AS $$
DECLARE
  v_user_id INT;
  v_log_date DATE;
  v_total_cal NUMERIC;
  v_total_pro NUMERIC;
  v_total_carb NUMERIC;
  v_total_fat NUMERIC;
BEGIN
  -- Get user and date from meal
  SELECT user_id, (logged_at AT TIME ZONE 'UTC')::DATE INTO v_user_id, v_log_date
  FROM public.meals WHERE meal_id = NEW.meal_id;

  -- Summarize all meal items for this user/date
  SELECT 
    COALESCE(SUM(m.total_calories), 0),
    COALESCE(SUM(m.total_protein_g), 0),
    COALESCE(SUM(m.total_carbs_g), 0),
    COALESCE(SUM(m.total_fat_g), 0)
  INTO v_total_cal, v_total_pro, v_total_carb, v_total_fat
  FROM public.meals m
  WHERE m.user_id = v_user_id AND (m.logged_at AT TIME ZONE 'UTC')::DATE = v_log_date;

  -- Update daily log
  UPDATE public.daily_logs
  SET total_calories = v_total_cal,
      total_protein_g = v_total_pro,
      total_carbs_g = v_total_carb,
      total_fat_g = v_total_fat,
      remaining_calories = target_calories - v_total_cal + calories_burned
  WHERE user_id = v_user_id AND log_date = v_log_date;

  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_daily_log ON public.meal_items;
CREATE TRIGGER trg_update_daily_log
AFTER INSERT OR UPDATE OR DELETE ON public.meal_items
FOR EACH ROW EXECUTE FUNCTION update_daily_log_totals();
