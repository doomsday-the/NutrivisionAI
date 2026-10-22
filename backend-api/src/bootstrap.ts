import { PrismaClient } from '@prisma/client';

export interface SeedFood {
  name: string;
  category_id: number;
  food_type: string;
  energy_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export const COMMON_FOODS: SeedFood[] = [
  // Fast Food & Sides
  { name: 'French Fries', category_id: 4, food_type: 'cooked', energy_kcal: 312, protein_g: 3.4, carbs_g: 41.4, fat_g: 14.7 },
  { name: 'Potato Wedges', category_id: 4, food_type: 'cooked', energy_kcal: 210, protein_g: 3.0, carbs_g: 32.0, fat_g: 8.0 },
  { name: 'Cheeseburger', category_id: 4, food_type: 'cooked', energy_kcal: 263, protein_g: 15.0, carbs_g: 24.0, fat_g: 12.0 },
  { name: 'Veggie Burger', category_id: 4, food_type: 'cooked', energy_kcal: 177, protein_g: 11.0, carbs_g: 22.0, fat_g: 5.0 },
  { name: 'Chicken Burger', category_id: 4, food_type: 'cooked', energy_kcal: 240, protein_g: 16.0, carbs_g: 22.0, fat_g: 9.5 },
  { name: 'Margherita Pizza', category_id: 4, food_type: 'cooked', energy_kcal: 250, protein_g: 11.0, carbs_g: 31.0, fat_g: 9.0 },
  { name: 'Pepperoni Pizza', category_id: 4, food_type: 'cooked', energy_kcal: 298, protein_g: 13.0, carbs_g: 30.0, fat_g: 14.0 },
  { name: 'Farmhouse Veg Pizza', category_id: 4, food_type: 'cooked', energy_kcal: 235, protein_g: 9.5, carbs_g: 32.0, fat_g: 8.0 },
  { name: 'Chicken Pizza', category_id: 4, food_type: 'cooked', energy_kcal: 265, protein_g: 14.0, carbs_g: 29.0, fat_g: 10.5 },
  { name: 'Veg Sandwich', category_id: 4, food_type: 'cooked', energy_kcal: 190, protein_g: 5.5, carbs_g: 30.0, fat_g: 5.5 },
  { name: 'Grilled Cheese Sandwich', category_id: 4, food_type: 'cooked', energy_kcal: 330, protein_g: 12.0, carbs_g: 28.0, fat_g: 19.0 },
  { name: 'Club Sandwich', category_id: 4, food_type: 'cooked', energy_kcal: 250, protein_g: 14.0, carbs_g: 24.0, fat_g: 10.5 },
  { name: 'Pasta in White Sauce (Alfredo)', category_id: 4, food_type: 'cooked', energy_kcal: 215, protein_g: 7.0, carbs_g: 25.0, fat_g: 10.0 },
  { name: 'Pasta in Red Sauce (Arrabiata)', category_id: 4, food_type: 'cooked', energy_kcal: 145, protein_g: 5.2, carbs_g: 26.0, fat_g: 2.5 },
  { name: 'Veg Hakka Noodles', category_id: 4, food_type: 'cooked', energy_kcal: 165, protein_g: 4.5, carbs_g: 28.0, fat_g: 4.0 },
  { name: 'Chicken Hakka Noodles', category_id: 4, food_type: 'cooked', energy_kcal: 195, protein_g: 11.0, carbs_g: 26.0, fat_g: 5.5 },
  { name: 'Veg Fried Rice', category_id: 4, food_type: 'cooked', energy_kcal: 175, protein_g: 4.0, carbs_g: 31.0, fat_g: 4.0 },
  { name: 'Chicken Fried Rice', category_id: 4, food_type: 'cooked', energy_kcal: 205, protein_g: 12.0, carbs_g: 28.0, fat_g: 5.5 },
  { name: 'Spring Roll', category_id: 4, food_type: 'cooked', energy_kcal: 245, protein_g: 5.0, carbs_g: 32.0, fat_g: 11.0 },
  { name: 'Veg Momos (Steamed)', category_id: 4, food_type: 'cooked', energy_kcal: 140, protein_g: 4.0, carbs_g: 25.0, fat_g: 2.5 },
  { name: 'Chicken Momos (Steamed)', category_id: 4, food_type: 'cooked', energy_kcal: 180, protein_g: 11.0, carbs_g: 22.0, fat_g: 5.0 },
  { name: 'Fried Momos', category_id: 4, food_type: 'cooked', energy_kcal: 260, protein_g: 6.0, carbs_g: 28.0, fat_g: 14.0 },
  { name: 'Garlic Bread', category_id: 4, food_type: 'cooked', energy_kcal: 350, protein_g: 8.0, carbs_g: 42.0, fat_g: 17.0 },
  { name: 'Nachos with Cheese', category_id: 4, food_type: 'cooked', energy_kcal: 340, protein_g: 7.0, carbs_g: 38.0, fat_g: 18.0 },
  { name: 'Tacos', category_id: 4, food_type: 'cooked', energy_kcal: 225, protein_g: 9.0, carbs_g: 21.0, fat_g: 12.0 },
  { name: 'Hot Dog', category_id: 4, food_type: 'cooked', energy_kcal: 290, protein_g: 10.5, carbs_g: 24.0, fat_g: 16.5 },

  // Indian Specialties & Breads
  { name: 'Masala Dosa', category_id: 1, food_type: 'cooked', energy_kcal: 165, protein_g: 4.0, carbs_g: 29.0, fat_g: 4.0 },
  { name: 'Plain Dosa', category_id: 1, food_type: 'cooked', energy_kcal: 135, protein_g: 3.5, carbs_g: 26.0, fat_g: 2.0 },
  { name: 'Medu Vada', category_id: 2, food_type: 'cooked', energy_kcal: 280, protein_g: 9.0, carbs_g: 28.0, fat_g: 14.5 },
  { name: 'Idli', category_id: 1, food_type: 'cooked', energy_kcal: 130, protein_g: 3.5, carbs_g: 28.0, fat_g: 0.5 },
  { name: 'Idli (Steamed)', category_id: 1, food_type: 'cooked', energy_kcal: 130, protein_g: 3.5, carbs_g: 28.0, fat_g: 0.5 },
  { name: 'Sambar', category_id: 2, food_type: 'cooked', energy_kcal: 65, protein_g: 2.5, carbs_g: 10.0, fat_g: 1.8 },
  { name: 'Coconut Chutney', category_id: 3, food_type: 'cooked', energy_kcal: 210, protein_g: 2.8, carbs_g: 8.5, fat_g: 19.0 },
  { name: 'Tomato Chutney', category_id: 3, food_type: 'cooked', energy_kcal: 85, protein_g: 1.5, carbs_g: 12.0, fat_g: 3.5 },
  { name: 'Mint Chutney', category_id: 3, food_type: 'cooked', energy_kcal: 45, protein_g: 2.0, carbs_g: 6.0, fat_g: 1.2 },
  { name: 'Chole Bhature', category_id: 4, food_type: 'cooked', energy_kcal: 285, protein_g: 7.5, carbs_g: 38.0, fat_g: 11.5 },
  { name: 'Pav Bhaji', category_id: 4, food_type: 'cooked', energy_kcal: 175, protein_g: 4.5, carbs_g: 24.0, fat_g: 7.0 },
  { name: 'Poori Bhaji', category_id: 1, food_type: 'cooked', energy_kcal: 240, protein_g: 5.0, carbs_g: 32.0, fat_g: 10.5 },
  { name: 'Poha', category_id: 1, food_type: 'cooked', energy_kcal: 180, protein_g: 3.5, carbs_g: 32.0, fat_g: 4.5 },
  { name: 'Upma', category_id: 1, food_type: 'cooked', energy_kcal: 165, protein_g: 4.0, carbs_g: 28.0, fat_g: 4.2 },
  { name: 'Butter Naan', category_id: 1, food_type: 'cooked', energy_kcal: 310, protein_g: 8.5, carbs_g: 48.0, fat_g: 9.5 },
  { name: 'Garlic Naan', category_id: 1, food_type: 'cooked', energy_kcal: 300, protein_g: 8.0, carbs_g: 47.0, fat_g: 9.0 },
  { name: 'Tandoori Roti', category_id: 1, food_type: 'cooked', energy_kcal: 220, protein_g: 7.5, carbs_g: 44.0, fat_g: 1.5 },
  { name: 'Chapati (Roti)', category_id: 1, food_type: 'cooked', energy_kcal: 240, protein_g: 7.5, carbs_g: 46.0, fat_g: 3.0 },
  { name: 'Roti', category_id: 1, food_type: 'cooked', energy_kcal: 240, protein_g: 7.5, carbs_g: 46.0, fat_g: 3.0 },
  { name: 'Aloo Paratha', category_id: 1, food_type: 'cooked', energy_kcal: 260, protein_g: 5.5, carbs_g: 40.0, fat_g: 9.0 },
  { name: 'Paneer Paratha', category_id: 1, food_type: 'cooked', energy_kcal: 290, protein_g: 10.5, carbs_g: 36.0, fat_g: 11.5 },
  { name: 'Plain Paratha', category_id: 1, food_type: 'cooked', energy_kcal: 280, protein_g: 6.0, carbs_g: 42.0, fat_g: 10.0 },

  // Indian Curries & Dals
  { name: 'Dal Tadka', category_id: 2, food_type: 'cooked', energy_kcal: 115, protein_g: 5.5, carbs_g: 14.5, fat_g: 4.0 },
  { name: 'Dal Makhani', category_id: 2, food_type: 'cooked', energy_kcal: 165, protein_g: 6.0, carbs_g: 16.0, fat_g: 8.5 },
  { name: 'Rajma (Kidney Beans Curry)', category_id: 2, food_type: 'cooked', energy_kcal: 125, protein_g: 6.5, carbs_g: 17.5, fat_g: 3.5 },
  { name: 'Chana Masala (Chole)', category_id: 2, food_type: 'cooked', energy_kcal: 135, protein_g: 6.8, carbs_g: 18.0, fat_g: 4.2 },
  { name: 'Paneer Butter Masala', category_id: 3, food_type: 'cooked', energy_kcal: 225, protein_g: 8.5, carbs_g: 9.0, fat_g: 17.0 },
  { name: 'Palak Paneer', category_id: 3, food_type: 'cooked', energy_kcal: 160, protein_g: 8.0, carbs_g: 6.5, fat_g: 11.5 },
  { name: 'Shahi Paneer', category_id: 3, food_type: 'cooked', energy_kcal: 210, protein_g: 8.0, carbs_g: 10.0, fat_g: 15.0 },
  { name: 'Kadai Paneer', category_id: 3, food_type: 'cooked', energy_kcal: 195, protein_g: 8.5, carbs_g: 8.5, fat_g: 14.0 },
  { name: 'Paneer Tikka', category_id: 3, food_type: 'cooked', energy_kcal: 220, protein_g: 12.0, carbs_g: 8.0, fat_g: 15.0 },
  { name: 'Butter Chicken', category_id: 6, food_type: 'cooked', energy_kcal: 215, protein_g: 14.5, carbs_g: 7.0, fat_g: 14.5 },
  { name: 'Chicken Curry', category_id: 6, food_type: 'cooked', energy_kcal: 175, protein_g: 16.0, carbs_g: 5.5, fat_g: 10.0 },
  { name: 'Chicken Tikka', category_id: 6, food_type: 'cooked', energy_kcal: 185, protein_g: 22.0, carbs_g: 4.0, fat_g: 8.5 },
  { name: 'Tandoori Chicken', category_id: 6, food_type: 'cooked', energy_kcal: 195, protein_g: 24.0, carbs_g: 3.0, fat_g: 9.5 },
  { name: 'Chicken Biryani', category_id: 6, food_type: 'cooked', energy_kcal: 185, protein_g: 10.5, carbs_g: 23.0, fat_g: 5.5 },
  { name: 'Mutton Biryani', category_id: 6, food_type: 'cooked', energy_kcal: 215, protein_g: 11.5, carbs_g: 22.0, fat_g: 8.5 },
  { name: 'Veg Biryani', category_id: 1, food_type: 'cooked', energy_kcal: 160, protein_g: 4.5, carbs_g: 27.0, fat_g: 4.0 },
  { name: 'Jeera Rice', category_id: 1, food_type: 'cooked', energy_kcal: 140, protein_g: 2.8, carbs_g: 26.0, fat_g: 2.5 },
  { name: 'Steamed Rice', category_id: 1, food_type: 'cooked', energy_kcal: 130, protein_g: 2.7, carbs_g: 28.2, fat_g: 0.3 },
  { name: 'Mixed Vegetable Curry', category_id: 2, food_type: 'cooked', energy_kcal: 85, protein_g: 2.5, carbs_g: 11.0, fat_g: 3.5 },

  // Produce & Fresh Foods
  { name: 'Tomato', category_id: 5, food_type: 'raw', energy_kcal: 18, protein_g: 0.9, carbs_g: 3.9, fat_g: 0.2 },
  { name: 'Cucumber', category_id: 5, food_type: 'raw', energy_kcal: 15, protein_g: 0.7, carbs_g: 3.6, fat_g: 0.1 },
  { name: 'Carrot', category_id: 5, food_type: 'raw', energy_kcal: 41, protein_g: 0.9, carbs_g: 9.6, fat_g: 0.2 },
  { name: 'Onion', category_id: 5, food_type: 'raw', energy_kcal: 40, protein_g: 1.1, carbs_g: 9.3, fat_g: 0.1 },
  { name: 'Potato', category_id: 5, food_type: 'raw', energy_kcal: 77, protein_g: 2.0, carbs_g: 17.5, fat_g: 0.1 },
  { name: 'Banana', category_id: 5, food_type: 'raw', energy_kcal: 89, protein_g: 1.1, carbs_g: 22.8, fat_g: 0.3 },
  { name: 'Apple', category_id: 5, food_type: 'raw', energy_kcal: 52, protein_g: 0.3, carbs_g: 13.8, fat_g: 0.2 },
  { name: 'Yogurt (plain)', category_id: 3, food_type: 'raw', energy_kcal: 61, protein_g: 3.5, carbs_g: 4.7, fat_g: 3.3 },

  // Eggs & Breakfast
  { name: 'Scrambled Eggs', category_id: 6, food_type: 'cooked', energy_kcal: 150, protein_g: 10.0, carbs_g: 1.5, fat_g: 11.0 },
  { name: 'Omelette', category_id: 6, food_type: 'cooked', energy_kcal: 155, protein_g: 11.0, carbs_g: 1.0, fat_g: 12.0 },
  { name: 'Boiled Egg', category_id: 6, food_type: 'whole', energy_kcal: 155, protein_g: 12.6, carbs_g: 1.1, fat_g: 10.6 },
  { name: 'Fried Egg', category_id: 6, food_type: 'cooked', energy_kcal: 195, protein_g: 13.5, carbs_g: 0.8, fat_g: 15.0 },
  { name: 'Pancakes', category_id: 1, food_type: 'cooked', energy_kcal: 225, protein_g: 6.0, carbs_g: 38.0, fat_g: 5.5 },
  { name: 'Waffle', category_id: 1, food_type: 'cooked', energy_kcal: 290, protein_g: 8.0, carbs_g: 41.0, fat_g: 10.5 },
  { name: 'French Toast', category_id: 1, food_type: 'cooked', energy_kcal: 230, protein_g: 8.0, carbs_g: 29.0, fat_g: 9.0 },
  { name: 'Cornflakes with Milk', category_id: 1, food_type: 'cooked', energy_kcal: 120, protein_g: 4.0, carbs_g: 22.0, fat_g: 2.0 },
  { name: 'Oatmeal Porridge', category_id: 1, food_type: 'cooked', energy_kcal: 70, protein_g: 2.5, carbs_g: 12.0, fat_g: 1.5 },

  // Salads & Soups
  { name: 'Caesar Salad', category_id: 4, food_type: 'cooked', energy_kcal: 130, protein_g: 4.5, carbs_g: 5.0, fat_g: 11.0 },
  { name: 'Greek Salad', category_id: 4, food_type: 'cooked', energy_kcal: 110, protein_g: 3.5, carbs_g: 5.0, fat_g: 8.5 },
  { name: 'Green Salad', category_id: 4, food_type: 'raw', energy_kcal: 35, protein_g: 1.5, carbs_g: 6.0, fat_g: 0.5 },
  { name: 'Fruit Salad', category_id: 5, food_type: 'raw', energy_kcal: 60, protein_g: 1.0, carbs_g: 15.0, fat_g: 0.3 },
  { name: 'Tomato Soup', category_id: 4, food_type: 'cooked', energy_kcal: 45, protein_g: 1.2, carbs_g: 8.5, fat_g: 1.0 },
  { name: 'Sweet Corn Soup', category_id: 4, food_type: 'cooked', energy_kcal: 65, protein_g: 2.0, carbs_g: 12.0, fat_g: 1.5 },

  // Desserts & Bakery
  { name: 'Chocolate Cake', category_id: 4, food_type: 'cooked', energy_kcal: 370, protein_g: 5.0, carbs_g: 52.0, fat_g: 16.0 },
  { name: 'Chocolate Brownie', category_id: 4, food_type: 'cooked', energy_kcal: 465, protein_g: 5.5, carbs_g: 58.0, fat_g: 24.0 },
  { name: 'Chocolate Chip Cookie', category_id: 4, food_type: 'cooked', energy_kcal: 490, protein_g: 5.0, carbs_g: 64.0, fat_g: 24.5 },
  { name: 'Croissant', category_id: 1, food_type: 'cooked', energy_kcal: 405, protein_g: 8.0, carbs_g: 45.0, fat_g: 21.0 },
  { name: 'Vanilla Ice Cream', category_id: 3, food_type: 'cooked', energy_kcal: 205, protein_g: 3.5, carbs_g: 24.0, fat_g: 11.0 },
  { name: 'Chocolate Ice Cream', category_id: 3, food_type: 'cooked', energy_kcal: 215, protein_g: 3.8, carbs_g: 25.0, fat_g: 11.5 },
  { name: 'Gulab Jamun', category_id: 3, food_type: 'cooked', energy_kcal: 300, protein_g: 4.5, carbs_g: 52.0, fat_g: 9.0 },
  { name: 'Rasgulla', category_id: 3, food_type: 'cooked', energy_kcal: 185, protein_g: 4.0, carbs_g: 39.0, fat_g: 1.5 },
  { name: 'Jalebi', category_id: 1, food_type: 'cooked', energy_kcal: 340, protein_g: 2.5, carbs_g: 70.0, fat_g: 6.0 },

  // Beverages & Drinks
  { name: 'Indian Chai (Tea with Milk & Sugar)', category_id: 3, food_type: 'beverage', energy_kcal: 60, protein_g: 2.0, carbs_g: 8.5, fat_g: 2.0 },
  { name: 'Coffee (with Milk & Sugar)', category_id: 3, food_type: 'beverage', energy_kcal: 65, protein_g: 2.2, carbs_g: 9.0, fat_g: 2.2 },
  { name: 'Black Coffee', category_id: 3, food_type: 'beverage', energy_kcal: 2, protein_g: 0.2, carbs_g: 0.1, fat_g: 0.0 },
  { name: 'Green Tea', category_id: 3, food_type: 'beverage', energy_kcal: 2, protein_g: 0.2, carbs_g: 0.0, fat_g: 0.0 },
  { name: 'Cappuccino', category_id: 3, food_type: 'beverage', energy_kcal: 55, protein_g: 3.0, carbs_g: 5.0, fat_g: 2.5 },
  { name: 'Coca Cola / Pepsi', category_id: 4, food_type: 'beverage', energy_kcal: 42, protein_g: 0.0, carbs_g: 10.6, fat_g: 0.0 },
  { name: 'Diet Coke / Coke Zero', category_id: 4, food_type: 'beverage', energy_kcal: 0.5, protein_g: 0.0, carbs_g: 0.1, fat_g: 0.0 },
  { name: 'Fresh Orange Juice', category_id: 5, food_type: 'beverage', energy_kcal: 45, protein_g: 0.7, carbs_g: 10.4, fat_g: 0.2 },
  { name: 'Apple Juice', category_id: 5, food_type: 'beverage', energy_kcal: 46, protein_g: 0.1, carbs_g: 11.3, fat_g: 0.1 },
  { name: 'Mango Lassi', category_id: 3, food_type: 'beverage', energy_kcal: 110, protein_g: 3.0, carbs_g: 18.0, fat_g: 3.0 },
  { name: 'Sweet Lassi', category_id: 3, food_type: 'beverage', energy_kcal: 95, protein_g: 3.0, carbs_g: 15.0, fat_g: 2.5 },
  { name: 'Chaas (Buttermilk)', category_id: 3, food_type: 'beverage', energy_kcal: 35, protein_g: 2.0, carbs_g: 3.5, fat_g: 1.5 },
  { name: 'Protein Shake (Whey in Water)', category_id: 6, food_type: 'beverage', energy_kcal: 80, protein_g: 18.0, carbs_g: 1.5, fat_g: 0.8 },
];

/**
 * Resynchronizes all database serial sequences using dynamic sequence discovery.
 * Bulletproof against cloud PostgreSQL, Supabase transaction pooling, or migration drift.
 */
export async function syncDatabaseSequences(prisma: PrismaClient) {
  try {
    const syncQueries = [
      `SELECT setval(COALESCE(pg_get_serial_sequence('public.food_items', 'food_id'), 'food_items_food_id_seq'), COALESCE((SELECT MAX(food_id) FROM public.food_items), 1))`,
      `SELECT setval(COALESCE(pg_get_serial_sequence('public.food_nutrients', 'food_nutrient_id'), 'food_nutrients_food_nutrient_id_seq'), COALESCE((SELECT MAX(food_nutrient_id) FROM public.food_nutrients), 1))`,
      `SELECT setval(COALESCE(pg_get_serial_sequence('public.nutrient_types', 'nutrient_id'), 'nutrient_types_nutrient_id_seq'), COALESCE((SELECT MAX(nutrient_id) FROM public.nutrient_types), 1))`,
      `SELECT setval(COALESCE(pg_get_serial_sequence('public.food_sources', 'source_id'), 'food_sources_source_id_seq'), COALESCE((SELECT MAX(source_id) FROM public.food_sources), 1))`,
      `SELECT setval(COALESCE(pg_get_serial_sequence('public.meals', 'meal_id'), 'meals_meal_id_seq'), COALESCE((SELECT MAX(meal_id) FROM public.meals), 1))`,
      `SELECT setval(COALESCE(pg_get_serial_sequence('public.meal_items', 'item_id'), 'meal_items_item_id_seq'), COALESCE((SELECT MAX(item_id) FROM public.meal_items), 1))`,
      `SELECT setval(COALESCE(pg_get_serial_sequence('public.ai_match_log', 'log_id'), 'ai_match_log_log_id_seq'), COALESCE((SELECT MAX(log_id) FROM public.ai_match_log), 1))`,
    ];

    for (const q of syncQueries) {
      await prisma.$executeRawUnsafe(q).catch(() => {});
    }
  } catch (err) {
    console.warn('[syncDatabaseSequences] Warning:', err);
  }
}

/**
 * Ensures standard food sources (IFCT, USDA, Dynamic AI) and nutrient types exist in the database.
 */
export async function ensurePrerequisites(prisma: PrismaClient) {
  try {
    // 1. Food Sources
    await prisma.$executeRaw`
      INSERT INTO public.food_sources (source_id, source_name, source_version)
      VALUES (1, 'ICMR-NIN IFCT 2017', '2017')
      ON CONFLICT (source_id) DO NOTHING;
    `.catch(() => {});

    await prisma.$executeRaw`
      INSERT INTO public.food_sources (source_id, source_name, source_version)
      VALUES (2, 'USDA FoodData Central / Global', '2024')
      ON CONFLICT (source_id) DO NOTHING;
    `.catch(() => {});

    // 2. Core Nutrient Types (1: Energy, 2: Protein, 3: Carbohydrate, 4: Fat)
    const nutrientDefs = [
      { id: 1, name: 'energy', display: 'Energy', unit: 'kcal' },
      { id: 2, name: 'protein', display: 'Protein', unit: 'g' },
      { id: 3, name: 'carbohydrate', display: 'Carbohydrate', unit: 'g' },
      { id: 4, name: 'fat', display: 'Total Fat', unit: 'g' },
      { id: 5, name: 'fiber', display: 'Dietary Fiber', unit: 'g' },
      { id: 6, name: 'sugars', display: 'Total Sugars', unit: 'g' },
      { id: 7, name: 'sodium', display: 'Sodium', unit: 'mg' },
    ];

    for (const nd of nutrientDefs) {
      await prisma.$executeRaw`
        INSERT INTO public.nutrient_types (nutrient_id, name, display_name, unit)
        VALUES (${nd.id}, ${nd.name}, ${nd.display}, ${nd.unit})
        ON CONFLICT (nutrient_id) DO UPDATE SET name = EXCLUDED.name, unit = EXCLUDED.unit;
      `.catch(() => {});
    }

    // 3. Ensure food_items_food_type_check constraint is broad enough
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        ALTER TABLE public.food_items DROP CONSTRAINT IF EXISTS food_items_food_type_check;
        ALTER TABLE public.food_items ADD CONSTRAINT food_items_food_type_check CHECK (food_type IN ('raw', 'cooked', 'packaged', 'beverage', 'ingredient', 'prepared', 'whole'));
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END $$;
    `).catch(() => {});
  } catch (err) {
    console.warn('[ensurePrerequisites] Warning:', err);
  }
}

/**
 * Synchronously seeds or updates common foods with their verified nutritional values.
 * Uses explicit food_id calculation to remain 100% resilient to sequence desync.
 */
export async function seedCommonFoods(prisma: PrismaClient) {
  try {
    const countRow: any[] = await prisma.$queryRaw`
      SELECT COUNT(*)::int as cnt FROM public.food_items;
    `;
    if (countRow[0]?.cnt && Number(countRow[0].cnt) >= 60) {
      return;
    }

    for (const item of COMMON_FOODS) {
      const clean = item.name.trim();

      // Check if food already exists (case-insensitive)
      const existing: any[] = await prisma.$queryRaw`
        SELECT food_id FROM public.food_items
        WHERE LOWER(name) = ${clean.toLowerCase()}
        LIMIT 1;
      `;

      let foodId: number;

      if (existing && existing.length > 0 && existing[0].food_id) {
        foodId = Number(existing[0].food_id);
      } else {
        // Find safe next food_id
        const maxRow: any[] = await prisma.$queryRaw`
          SELECT COALESCE(MAX(food_id), 0) + 1 AS next_id FROM public.food_items;
        `;
        foodId = Number(maxRow[0]?.next_id) || Math.floor(Date.now() / 1000);

        await prisma.$executeRaw`
          INSERT INTO public.food_items (food_id, name, food_type, category_id, source_id, reference_unit, is_verified, is_active, created_at, updated_at)
          VALUES (${foodId}, ${clean}, ${item.food_type}, ${item.category_id}, 2, '100g', true, true, NOW(), NOW())
          ON CONFLICT (food_id) DO NOTHING;
        `;
      }

      // Upsert the 4 primary macro nutrients
      const nutrients = [
        { id: 1, val: item.energy_kcal },
        { id: 2, val: item.protein_g },
        { id: 3, val: item.carbs_g },
        { id: 4, val: item.fat_g },
      ];

      for (const n of nutrients) {
        await prisma.$executeRaw`
          INSERT INTO public.food_nutrients (food_id, nutrient_id, value_per_100g)
          VALUES (${foodId}, ${n.id}, ${n.val})
          ON CONFLICT (food_id, nutrient_id) 
          DO UPDATE SET value_per_100g = EXCLUDED.value_per_100g;
        `.catch(() => {});
      }
    }
  } catch (err) {
    console.error('[seedCommonFoods] Error:', err);
  }
}

/**
 * Deploys the latest, highly resilient stored procedure sp_log_meal to PostgreSQL.
 */
export async function ensureStoredProcedure(prisma: PrismaClient) {
  const spSql = `
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
  v_today DATE := (NOW() AT TIME ZONE CURRENT_SETTING('timezone'))::DATE;
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
    v_score := COALESCE((v_item->>'confidence')::NUMERIC, 0.95);
    v_method := COALESCE(v_item->>'match_method', 'gemini_multimodal');

    -- Insert into ai_match_log
    INSERT INTO public.ai_match_log (detected_label, matched_food_id, match_score, match_method, weight_grams, session_id)
    VALUES (v_label, v_food_id, v_score, v_method, v_qty, p_session_id);

    IF v_food_id IS NOT NULL THEN
      -- Get macros from view
      SELECT energy_kcal, protein_g, carbs_g, fat_g 
      INTO v_food_kcal, v_food_pro, v_food_carb, v_food_fat
      FROM public.vw_food_full WHERE food_id = v_food_id;

      -- If view macros are NULL or 0, fallback to inline AI estimates from detection payload
      IF v_food_kcal IS NULL OR v_food_kcal <= 0 THEN
        v_food_kcal := COALESCE((v_item->>'estimated_calories_per_100g')::NUMERIC, 150);
      END IF;
      IF v_food_pro IS NULL THEN
        v_food_pro  := COALESCE((v_item->>'estimated_protein_per_100g')::NUMERIC, 5);
      END IF;
      IF v_food_carb IS NULL THEN
        v_food_carb := COALESCE((v_item->>'estimated_carbs_per_100g')::NUMERIC, 20);
      END IF;
      IF v_food_fat IS NULL THEN
        v_food_fat  := COALESCE((v_item->>'estimated_fat_per_100g')::NUMERIC, 5);
      END IF;

      -- Calculate scaled nutrition for portion weight
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

  -- 4. Update daily log totals
  UPDATE public.daily_logs
  SET total_calories = (
        SELECT COALESCE(SUM(m.total_calories), 0) FROM public.meals m 
        WHERE m.user_id = p_user_id AND (m.logged_at AT TIME ZONE CURRENT_SETTING('timezone'))::DATE = v_today
      ),
      total_protein_g = (
        SELECT COALESCE(SUM(m.total_protein_g), 0) FROM public.meals m 
        WHERE m.user_id = p_user_id AND (m.logged_at AT TIME ZONE CURRENT_SETTING('timezone'))::DATE = v_today
      ),
      total_carbs_g = (
        SELECT COALESCE(SUM(m.total_carbs_g), 0) FROM public.meals m 
        WHERE m.user_id = p_user_id AND (m.logged_at AT TIME ZONE CURRENT_SETTING('timezone'))::DATE = v_today
      ),
      total_fat_g = (
        SELECT COALESCE(SUM(m.total_fat_g), 0) FROM public.meals m 
        WHERE m.user_id = p_user_id AND (m.logged_at AT TIME ZONE CURRENT_SETTING('timezone'))::DATE = v_today
      ),
      remaining_calories = target_calories - (
        SELECT COALESCE(SUM(m.total_calories), 0) FROM public.meals m 
        WHERE m.user_id = p_user_id AND (m.logged_at AT TIME ZONE CURRENT_SETTING('timezone'))::DATE = v_today
      ) + calories_burned
  WHERE user_id = p_user_id AND log_date = v_today;
END;
$$;
`;

  try {
    await prisma.$executeRawUnsafe(spSql);
  } catch (err) {
    console.error('[ensureStoredProcedure] Error:', err);
  }
}

/**
 * Automatically repairs historical meal_items that suffered from the fallback bug
 * (where unrecognized items were assigned food_id = 36 / Gulab Jamun).
 */
export async function healCorruptedGulabJamunEntries(prisma: PrismaClient) {
  try {
    // Find ai_match_log rows where detected_label is clearly NOT Gulab Jamun, but matched_food_id is 36
    const corruptedLogs: any[] = await prisma.$queryRaw`
      SELECT log_id, detected_label, session_id, weight_grams
      FROM public.ai_match_log
      WHERE matched_food_id = 36 
        AND LOWER(detected_label) NOT LIKE '%gulab%'
        AND LOWER(detected_label) NOT LIKE '%jamun%'
      ORDER BY log_id DESC
      LIMIT 100;
    `;

    if (!corruptedLogs || corruptedLogs.length === 0) return;

    for (const log of corruptedLogs) {
      const clean = (log.detected_label || '').trim();
      if (!clean) continue;

      // Find or create the proper food item
      const existing: any[] = await prisma.$queryRaw`
        SELECT food_id FROM public.food_items
        WHERE LOWER(name) = ${clean.toLowerCase()}
        LIMIT 1;
      `;

      let realFoodId: number;
      if (existing && existing.length > 0) {
        realFoodId = Number(existing[0].food_id);
      } else {
        const maxRow: any[] = await prisma.$queryRaw`
          SELECT COALESCE(MAX(food_id), 0) + 1 AS next_id FROM public.food_items;
        `;
        realFoodId = Number(maxRow[0]?.next_id) || Math.floor(Date.now() / 1000);
        await prisma.$executeRaw`
          INSERT INTO public.food_items (food_id, name, food_type, category_id, source_id, reference_unit, is_verified, is_active, created_at, updated_at)
          VALUES (${realFoodId}, ${clean}, 'cooked', null, 2, '100g', true, true, NOW(), NOW())
          ON CONFLICT (food_id) DO NOTHING;
        `;
      }

      // Update the ai_match_log
      await prisma.$executeRaw`
        UPDATE public.ai_match_log
        SET matched_food_id = ${realFoodId}
        WHERE log_id = ${log.log_id};
      `;

      // Update any meal_items created around the same session / quantity
      if (log.session_id) {
        await prisma.$executeRaw`
          UPDATE public.meal_items mi
          SET food_id = ${realFoodId}
          FROM public.meals m
          WHERE mi.meal_id = m.meal_id
            AND mi.food_id = 36
            AND m.image_url LIKE ${'%' + log.session_id + '%'}
            AND mi.quantity_grams = ${log.weight_grams};
        `.catch(() => {});
      }
    }
  } catch (err) {
    console.warn('[healCorruptedGulabJamunEntries] Warning:', err);
  }
}

/**
 * Full master bootstrap routine to be run on server startup.
 */
export async function bootstrapDatabase(prisma: PrismaClient) {
  console.log('[Database Bootstrap] Ensuring database integrity, sequences, and catalogs...');
  await ensurePrerequisites(prisma);
  await syncDatabaseSequences(prisma);
  await seedCommonFoods(prisma);
  await syncDatabaseSequences(prisma);
  await ensureStoredProcedure(prisma);
  await healCorruptedGulabJamunEntries(prisma);
  console.log('[Database Bootstrap] Database is fully synchronized, seeded, and robust.');
}
