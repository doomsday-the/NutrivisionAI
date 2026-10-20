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
FROM
  (
    users u
    LEFT JOIN daily_logs dl ON (
      (
        (u.user_id = dl.user_id)
        AND (dl.log_date = CURRENT_DATE)
      )
    )
  );