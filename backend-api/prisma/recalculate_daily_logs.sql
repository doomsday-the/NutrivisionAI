DO $$
DECLARE
  r RECORD;
  v_cal NUMERIC;
  v_pro NUMERIC;
  v_carb NUMERIC;
  v_fat NUMERIC;
BEGIN
  FOR r IN 
    SELECT DISTINCT user_id, (logged_at AT TIME ZONE CURRENT_SETTING('timezone'))::DATE as l_date 
    FROM meals
  LOOP
    INSERT INTO daily_logs (user_id, log_date, target_calories, total_calories, total_protein_g, total_carbs_g, total_fat_g, calories_burned, remaining_calories, steps)
    VALUES (r.user_id, r.l_date, 2000, 0, 0, 0, 0, 0, 2000, 0)
    ON CONFLICT (user_id, log_date) DO NOTHING;

    SELECT 
      COALESCE(SUM(total_calories), 0),
      COALESCE(SUM(total_protein_g), 0),
      COALESCE(SUM(total_carbs_g), 0),
      COALESCE(SUM(total_fat_g), 0)
    INTO v_cal, v_pro, v_carb, v_fat
    FROM meals
    WHERE user_id = r.user_id AND (logged_at AT TIME ZONE CURRENT_SETTING('timezone'))::DATE = r.l_date;

    UPDATE daily_logs
    SET total_calories = v_cal,
        total_protein_g = v_pro,
        total_carbs_g = v_carb,
        total_fat_g = v_fat,
        remaining_calories = target_calories - v_cal + calories_burned
    WHERE user_id = r.user_id AND log_date = r.l_date;
  END LOOP;
END $$;
