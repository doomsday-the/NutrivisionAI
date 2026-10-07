-- Trigger to update daily logs when meal totals are updated
CREATE OR REPLACE FUNCTION update_daily_log_from_meals() RETURNS trigger AS $$
DECLARE
  v_log_date DATE;
  v_total_cal NUMERIC;
  v_total_pro NUMERIC;
  v_total_carb NUMERIC;
  v_total_fat NUMERIC;
BEGIN
  v_log_date := (NEW.logged_at AT TIME ZONE 'UTC')::DATE;

  SELECT
    COALESCE(SUM(m.total_calories), 0),
    COALESCE(SUM(m.total_protein_g), 0),
    COALESCE(SUM(m.total_carbs_g), 0),
    COALESCE(SUM(m.total_fat_g), 0)
  INTO v_total_cal, v_total_pro, v_total_carb, v_total_fat
  FROM public.meals m
  WHERE m.user_id = NEW.user_id AND (m.logged_at AT TIME ZONE 'UTC')::DATE = v_log_date;

  UPDATE public.daily_logs
  SET total_calories = v_total_cal,
      total_protein_g = v_total_pro,
      total_carbs_g = v_total_carb,
      total_fat_g = v_total_fat,
      remaining_calories = target_calories - v_total_cal + calories_burned
  WHERE user_id = NEW.user_id AND log_date = v_log_date;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_daily_log_meals ON public.meals;
CREATE TRIGGER trg_update_daily_log_meals
AFTER UPDATE OF total_calories, total_protein_g, total_carbs_g, total_fat_g ON public.meals
FOR EACH ROW EXECUTE FUNCTION update_daily_log_from_meals();
