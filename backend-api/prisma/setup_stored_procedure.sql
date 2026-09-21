-- Stored Procedure to atomically log a meal with multiple items
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
BEGIN
  -- 1. Insert meal row (totals will be updated later)
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
    v_method := v_item->>'match_method';

    -- Insert into ai_match_log
    INSERT INTO public.ai_match_log (detected_label, matched_food_id, match_score, match_method, weight_grams, session_id)
    VALUES (v_label, v_food_id, v_score, v_method, v_qty, p_session_id);

    IF v_food_id IS NOT NULL THEN
      -- Get macros from view
      SELECT energy_kcal, protein_g, carbs_g, fat_g 
      INTO v_food_kcal, v_food_pro, v_food_carb, v_food_fat
      FROM public.vw_food_full WHERE food_id = v_food_id;

      -- Calculate scaled nutrition
      v_kcal := (v_food_kcal / 100) * v_qty;
      v_total_cal := v_total_cal + v_kcal;
      v_total_pro := v_total_pro + ((v_food_pro / 100) * v_qty);
      v_total_carb := v_total_carb + ((v_food_carb / 100) * v_qty);
      v_total_fat := v_total_fat + ((v_food_fat / 100) * v_qty);

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

  -- Note: trg_update_daily_log will automatically fire from the meal_items inserts
END;
$$;
