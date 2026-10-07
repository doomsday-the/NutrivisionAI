-- Add canonical CHECK constraints per docs/03_Data/03_01_Canonical_Data_Model.md

-- 1. users: role check constraint ('admin', 'user')
ALTER TABLE "users"
ADD CONSTRAINT "users_role_check" CHECK ("role" IN ('admin', 'user'));

-- 2. user_profiles: activity_level and goal check constraints
ALTER TABLE "user_profiles"
ADD CONSTRAINT "user_profiles_activity_level_check" CHECK ("activity_level" IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
ADD CONSTRAINT "user_profiles_goal_check" CHECK ("goal" IN ('lose', 'maintain', 'gain'));

-- 3. food_items: food_type check constraint ('raw', 'cooked', 'packaged', 'beverage', 'ingredient')
ALTER TABLE "food_items"
ADD CONSTRAINT "food_items_food_type_check" CHECK ("food_type" IN ('raw', 'cooked', 'packaged', 'beverage', 'ingredient'));

-- 4. serving_sizes: serving_unit check constraint ('g', 'ml', 'piece', 'cup', 'tbsp', 'tsp')
ALTER TABLE "serving_sizes"
ADD CONSTRAINT "serving_sizes_serving_unit_check" CHECK ("serving_unit" IN ('g', 'ml', 'piece', 'cup', 'tbsp', 'tsp'));

-- 5. meals: meal_type check constraint ('breakfast', 'lunch', 'dinner', 'snack')
ALTER TABLE "meals"
ADD CONSTRAINT "meals_meal_type_check" CHECK ("meal_type" IN ('breakfast', 'lunch', 'dinner', 'snack'));
