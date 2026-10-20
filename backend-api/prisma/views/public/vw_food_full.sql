SELECT
  fi.food_id,
  fi.name,
  fi.name_local,
  fi.food_type,
  fi.density_g_per_ml,
  fc.name AS category_name,
  fs.source_name,
  max(
    CASE
      WHEN (
        ((nt.name) :: text = 'energy' :: text)
        OR (nt.nutrient_id = 1)
      ) THEN fn.value_per_100g
      ELSE NULL :: numeric
    END
  ) AS energy_kcal,
  max(
    CASE
      WHEN (
        ((nt.name) :: text = 'protein' :: text)
        OR (nt.nutrient_id = 2)
      ) THEN fn.value_per_100g
      ELSE NULL :: numeric
    END
  ) AS protein_g,
  max(
    CASE
      WHEN (
        ((nt.name) :: text = 'carbohydrate' :: text)
        OR (nt.nutrient_id = 3)
      ) THEN fn.value_per_100g
      ELSE NULL :: numeric
    END
  ) AS carbs_g,
  max(
    CASE
      WHEN (
        ((nt.name) :: text = 'fat' :: text)
        OR (nt.nutrient_id = 4)
      ) THEN fn.value_per_100g
      ELSE NULL :: numeric
    END
  ) AS fat_g,
  max(
    CASE
      WHEN (
        ((nt.name) :: text = 'fiber' :: text)
        OR (nt.nutrient_id = 5)
      ) THEN fn.value_per_100g
      ELSE NULL :: numeric
    END
  ) AS fiber_g,
  max(
    CASE
      WHEN (
        ((nt.name) :: text = 'sugars' :: text)
        OR (nt.nutrient_id = 6)
      ) THEN fn.value_per_100g
      ELSE NULL :: numeric
    END
  ) AS sugars_g,
  max(
    CASE
      WHEN (
        ((nt.name) :: text = 'sodium' :: text)
        OR (nt.nutrient_id = 7)
      ) THEN fn.value_per_100g
      ELSE NULL :: numeric
    END
  ) AS sodium_mg
FROM
  (
    (
      (
        (
          food_items fi
          LEFT JOIN food_nutrients fn ON ((fi.food_id = fn.food_id))
        )
        LEFT JOIN nutrient_types nt ON ((fn.nutrient_id = nt.nutrient_id))
      )
      LEFT JOIN food_categories fc ON ((fi.category_id = fc.category_id))
    )
    LEFT JOIN food_sources fs ON ((fi.source_id = fs.source_id))
  )
WHERE
  (fi.is_active = TRUE)
GROUP BY
  fi.food_id,
  fi.name,
  fi.name_local,
  fi.food_type,
  fi.density_g_per_ml,
  fc.name,
  fs.source_name;