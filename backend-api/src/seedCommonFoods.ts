import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedFood {
  name: string;
  category_id: number;
  food_type: string;
  energy_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

const COMMON_FOODS: SeedFood[] = [
  // Fast Food & Sides
  { name: 'French Fries', category_id: 4, food_type: 'prepared', energy_kcal: 312, protein_g: 3.4, carbs_g: 41.4, fat_g: 14.7 },
  { name: 'Potato Wedges', category_id: 4, food_type: 'prepared', energy_kcal: 210, protein_g: 3.0, carbs_g: 32.0, fat_g: 8.0 },
  { name: 'Cheeseburger', category_id: 4, food_type: 'prepared', energy_kcal: 263, protein_g: 15.0, carbs_g: 24.0, fat_g: 12.0 },
  { name: 'Veggie Burger', category_id: 4, food_type: 'prepared', energy_kcal: 177, protein_g: 11.0, carbs_g: 22.0, fat_g: 5.0 },
  { name: 'Chicken Burger', category_id: 4, food_type: 'prepared', energy_kcal: 240, protein_g: 16.0, carbs_g: 22.0, fat_g: 9.5 },
  { name: 'Margherita Pizza', category_id: 4, food_type: 'prepared', energy_kcal: 250, protein_g: 11.0, carbs_g: 31.0, fat_g: 9.0 },
  { name: 'Pepperoni Pizza', category_id: 4, food_type: 'prepared', energy_kcal: 298, protein_g: 13.0, carbs_g: 30.0, fat_g: 14.0 },
  { name: 'Farmhouse Veg Pizza', category_id: 4, food_type: 'prepared', energy_kcal: 235, protein_g: 9.5, carbs_g: 32.0, fat_g: 8.0 },
  { name: 'Chicken Pizza', category_id: 4, food_type: 'prepared', energy_kcal: 265, protein_g: 14.0, carbs_g: 29.0, fat_g: 10.5 },
  { name: 'Veg Sandwich', category_id: 4, food_type: 'prepared', energy_kcal: 190, protein_g: 5.5, carbs_g: 30.0, fat_g: 5.5 },
  { name: 'Grilled Cheese Sandwich', category_id: 4, food_type: 'prepared', energy_kcal: 330, protein_g: 12.0, carbs_g: 28.0, fat_g: 19.0 },
  { name: 'Club Sandwich', category_id: 4, food_type: 'prepared', energy_kcal: 250, protein_g: 14.0, carbs_g: 24.0, fat_g: 10.5 },
  { name: 'Pasta in White Sauce (Alfredo)', category_id: 4, food_type: 'prepared', energy_kcal: 215, protein_g: 7.0, carbs_g: 25.0, fat_g: 10.0 },
  { name: 'Pasta in Red Sauce (Arrabiata)', category_id: 4, food_type: 'prepared', energy_kcal: 145, protein_g: 5.2, carbs_g: 26.0, fat_g: 2.5 },
  { name: 'Veg Hakka Noodles', category_id: 4, food_type: 'prepared', energy_kcal: 165, protein_g: 4.5, carbs_g: 28.0, fat_g: 4.0 },
  { name: 'Chicken Hakka Noodles', category_id: 4, food_type: 'prepared', energy_kcal: 195, protein_g: 11.0, carbs_g: 26.0, fat_g: 5.5 },
  { name: 'Veg Fried Rice', category_id: 4, food_type: 'prepared', energy_kcal: 175, protein_g: 4.0, carbs_g: 31.0, fat_g: 4.0 },
  { name: 'Chicken Fried Rice', category_id: 4, food_type: 'prepared', energy_kcal: 205, protein_g: 12.0, carbs_g: 28.0, fat_g: 5.5 },
  { name: 'Spring Roll', category_id: 4, food_type: 'prepared', energy_kcal: 245, protein_g: 5.0, carbs_g: 32.0, fat_g: 11.0 },
  { name: 'Veg Momos (Steamed)', category_id: 4, food_type: 'prepared', energy_kcal: 140, protein_g: 4.0, carbs_g: 25.0, fat_g: 2.5 },
  { name: 'Chicken Momos (Steamed)', category_id: 4, food_type: 'prepared', energy_kcal: 180, protein_g: 11.0, carbs_g: 22.0, fat_g: 5.0 },
  { name: 'Fried Momos', category_id: 4, food_type: 'prepared', energy_kcal: 260, protein_g: 6.0, carbs_g: 28.0, fat_g: 14.0 },
  { name: 'Garlic Bread', category_id: 4, food_type: 'prepared', energy_kcal: 350, protein_g: 8.0, carbs_g: 42.0, fat_g: 17.0 },
  { name: 'Nachos with Cheese', category_id: 4, food_type: 'prepared', energy_kcal: 340, protein_g: 7.0, carbs_g: 38.0, fat_g: 18.0 },
  { name: 'Tacos', category_id: 4, food_type: 'prepared', energy_kcal: 225, protein_g: 9.0, carbs_g: 21.0, fat_g: 12.0 },
  { name: 'Hot Dog', category_id: 4, food_type: 'prepared', energy_kcal: 290, protein_g: 10.5, carbs_g: 24.0, fat_g: 16.5 },

  // Indian Specialties & Breads
  { name: 'Masala Dosa', category_id: 1, food_type: 'prepared', energy_kcal: 165, protein_g: 4.0, carbs_g: 29.0, fat_g: 4.0 },
  { name: 'Plain Dosa', category_id: 1, food_type: 'prepared', energy_kcal: 135, protein_g: 3.5, carbs_g: 26.0, fat_g: 2.0 },
  { name: 'Medu Vada', category_id: 2, food_type: 'prepared', energy_kcal: 280, protein_g: 9.0, carbs_g: 28.0, fat_g: 14.5 },
  { name: 'Idli (Steamed)', category_id: 1, food_type: 'prepared', energy_kcal: 130, protein_g: 3.5, carbs_g: 28.0, fat_g: 0.5 },
  { name: 'Sambar', category_id: 2, food_type: 'prepared', energy_kcal: 65, protein_g: 2.5, carbs_g: 10.0, fat_g: 1.8 },
  { name: 'Coconut Chutney', category_id: 3, food_type: 'prepared', energy_kcal: 210, protein_g: 2.8, carbs_g: 8.5, fat_g: 19.0 },
  { name: 'Chole Bhature', category_id: 4, food_type: 'prepared', energy_kcal: 285, protein_g: 7.5, carbs_g: 38.0, fat_g: 11.5 },
  { name: 'Pav Bhaji', category_id: 4, food_type: 'prepared', energy_kcal: 175, protein_g: 4.5, carbs_g: 24.0, fat_g: 7.0 },
  { name: 'Poori Bhaji', category_id: 1, food_type: 'prepared', energy_kcal: 240, protein_g: 5.0, carbs_g: 32.0, fat_g: 10.5 },
  { name: 'Poha', category_id: 1, food_type: 'prepared', energy_kcal: 180, protein_g: 3.5, carbs_g: 32.0, fat_g: 4.5 },
  { name: 'Upma', category_id: 1, food_type: 'prepared', energy_kcal: 165, protein_g: 4.0, carbs_g: 28.0, fat_g: 4.2 },
  { name: 'Butter Naan', category_id: 1, food_type: 'prepared', energy_kcal: 310, protein_g: 8.5, carbs_g: 48.0, fat_g: 9.5 },
  { name: 'Garlic Naan', category_id: 1, food_type: 'prepared', energy_kcal: 300, protein_g: 8.0, carbs_g: 47.0, fat_g: 9.0 },
  { name: 'Tandoori Roti', category_id: 1, food_type: 'prepared', energy_kcal: 220, protein_g: 7.5, carbs_g: 44.0, fat_g: 1.5 },
  { name: 'Chapati (Roti)', category_id: 1, food_type: 'prepared', energy_kcal: 240, protein_g: 7.5, carbs_g: 46.0, fat_g: 3.0 },
  { name: 'Aloo Paratha', category_id: 1, food_type: 'prepared', energy_kcal: 260, protein_g: 5.5, carbs_g: 40.0, fat_g: 9.0 },
  { name: 'Paneer Paratha', category_id: 1, food_type: 'prepared', energy_kcal: 290, protein_g: 10.5, carbs_g: 36.0, fat_g: 11.5 },
  { name: 'Plain Paratha', category_id: 1, food_type: 'prepared', energy_kcal: 280, protein_g: 6.0, carbs_g: 42.0, fat_g: 10.0 },

  // Indian Curries & Dals
  { name: 'Dal Tadka', category_id: 2, food_type: 'prepared', energy_kcal: 115, protein_g: 5.5, carbs_g: 14.5, fat_g: 4.0 },
  { name: 'Dal Makhani', category_id: 2, food_type: 'prepared', energy_kcal: 165, protein_g: 6.0, carbs_g: 16.0, fat_g: 8.5 },
  { name: 'Rajma (Kidney Beans Curry)', category_id: 2, food_type: 'prepared', energy_kcal: 125, protein_g: 6.5, carbs_g: 17.5, fat_g: 3.5 },
  { name: 'Chana Masala (Chole)', category_id: 2, food_type: 'prepared', energy_kcal: 135, protein_g: 6.8, carbs_g: 18.0, fat_g: 4.2 },
  { name: 'Paneer Butter Masala', category_id: 3, food_type: 'prepared', energy_kcal: 225, protein_g: 8.5, carbs_g: 9.0, fat_g: 17.0 },
  { name: 'Palak Paneer', category_id: 3, food_type: 'prepared', energy_kcal: 160, protein_g: 8.0, carbs_g: 6.5, fat_g: 11.5 },
  { name: 'Shahi Paneer', category_id: 3, food_type: 'prepared', energy_kcal: 210, protein_g: 8.0, carbs_g: 10.0, fat_g: 15.0 },
  { name: 'Kadai Paneer', category_id: 3, food_type: 'prepared', energy_kcal: 195, protein_g: 8.5, carbs_g: 8.5, fat_g: 14.0 },
  { name: 'Paneer Tikka', category_id: 3, food_type: 'prepared', energy_kcal: 220, protein_g: 12.0, carbs_g: 8.0, fat_g: 15.0 },
  { name: 'Butter Chicken', category_id: 6, food_type: 'prepared', energy_kcal: 215, protein_g: 14.5, carbs_g: 7.0, fat_g: 14.5 },
  { name: 'Chicken Curry', category_id: 6, food_type: 'prepared', energy_kcal: 175, protein_g: 16.0, carbs_g: 5.5, fat_g: 10.0 },
  { name: 'Chicken Tikka', category_id: 6, food_type: 'prepared', energy_kcal: 185, protein_g: 22.0, carbs_g: 4.0, fat_g: 8.5 },
  { name: 'Tandoori Chicken', category_id: 6, food_type: 'prepared', energy_kcal: 195, protein_g: 24.0, carbs_g: 3.0, fat_g: 9.5 },
  { name: 'Chicken Biryani', category_id: 6, food_type: 'prepared', energy_kcal: 185, protein_g: 10.5, carbs_g: 23.0, fat_g: 5.5 },
  { name: 'Mutton Biryani', category_id: 6, food_type: 'prepared', energy_kcal: 215, protein_g: 11.5, carbs_g: 22.0, fat_g: 8.5 },
  { name: 'Veg Biryani', category_id: 1, food_type: 'prepared', energy_kcal: 160, protein_g: 4.5, carbs_g: 27.0, fat_g: 4.0 },
  { name: 'Jeera Rice', category_id: 1, food_type: 'prepared', energy_kcal: 140, protein_g: 2.8, carbs_g: 26.0, fat_g: 2.5 },

  // Eggs & Breakfast
  { name: 'Scrambled Eggs', category_id: 6, food_type: 'prepared', energy_kcal: 150, protein_g: 10.0, carbs_g: 1.5, fat_g: 11.0 },
  { name: 'Omelette', category_id: 6, food_type: 'prepared', energy_kcal: 155, protein_g: 11.0, carbs_g: 1.0, fat_g: 12.0 },
  { name: 'Boiled Egg', category_id: 6, food_type: 'whole', energy_kcal: 155, protein_g: 12.6, carbs_g: 1.1, fat_g: 10.6 },
  { name: 'Fried Egg', category_id: 6, food_type: 'prepared', energy_kcal: 195, protein_g: 13.5, carbs_g: 0.8, fat_g: 15.0 },
  { name: 'Pancakes', category_id: 1, food_type: 'prepared', energy_kcal: 225, protein_g: 6.0, carbs_g: 38.0, fat_g: 5.5 },
  { name: 'Waffle', category_id: 1, food_type: 'prepared', energy_kcal: 290, protein_g: 8.0, carbs_g: 41.0, fat_g: 10.5 },
  { name: 'French Toast', category_id: 1, food_type: 'prepared', energy_kcal: 230, protein_g: 8.0, carbs_g: 29.0, fat_g: 9.0 },
  { name: 'Cornflakes with Milk', category_id: 1, food_type: 'prepared', energy_kcal: 120, protein_g: 4.0, carbs_g: 22.0, fat_g: 2.0 },
  { name: 'Oatmeal Porridge', category_id: 1, food_type: 'prepared', energy_kcal: 70, protein_g: 2.5, carbs_g: 12.0, fat_g: 1.5 },

  // Salads & Soups
  { name: 'Caesar Salad', category_id: 4, food_type: 'prepared', energy_kcal: 130, protein_g: 4.5, carbs_g: 5.0, fat_g: 11.0 },
  { name: 'Greek Salad', category_id: 4, food_type: 'prepared', energy_kcal: 110, protein_g: 3.5, carbs_g: 5.0, fat_g: 8.5 },
  { name: 'Green Salad', category_id: 4, food_type: 'raw', energy_kcal: 35, protein_g: 1.5, carbs_g: 6.0, fat_g: 0.5 },
  { name: 'Fruit Salad', category_id: 5, food_type: 'raw', energy_kcal: 60, protein_g: 1.0, carbs_g: 15.0, fat_g: 0.3 },
  { name: 'Tomato Soup', category_id: 4, food_type: 'prepared', energy_kcal: 45, protein_g: 1.2, carbs_g: 8.5, fat_g: 1.0 },
  { name: 'Sweet Corn Soup', category_id: 4, food_type: 'prepared', energy_kcal: 65, protein_g: 2.0, carbs_g: 12.0, fat_g: 1.5 },

  // Desserts & Bakery
  { name: 'Chocolate Cake', category_id: 4, food_type: 'prepared', energy_kcal: 370, protein_g: 5.0, carbs_g: 52.0, fat_g: 16.0 },
  { name: 'Chocolate Brownie', category_id: 4, food_type: 'prepared', energy_kcal: 465, protein_g: 5.5, carbs_g: 58.0, fat_g: 24.0 },
  { name: 'Chocolate Chip Cookie', category_id: 4, food_type: 'prepared', energy_kcal: 490, protein_g: 5.0, carbs_g: 64.0, fat_g: 24.5 },
  { name: 'Croissant', category_id: 1, food_type: 'prepared', energy_kcal: 405, protein_g: 8.0, carbs_g: 45.0, fat_g: 21.0 },
  { name: 'Vanilla Ice Cream', category_id: 3, food_type: 'prepared', energy_kcal: 205, protein_g: 3.5, carbs_g: 24.0, fat_g: 11.0 },
  { name: 'Chocolate Ice Cream', category_id: 3, food_type: 'prepared', energy_kcal: 215, protein_g: 3.8, carbs_g: 25.0, fat_g: 11.5 },
  { name: 'Gulab Jamun', category_id: 3, food_type: 'prepared', energy_kcal: 300, protein_g: 4.5, carbs_g: 52.0, fat_g: 9.0 },
  { name: 'Rasgulla', category_id: 3, food_type: 'prepared', energy_kcal: 185, protein_g: 4.0, carbs_g: 39.0, fat_g: 1.5 },
  { name: 'Jalebi', category_id: 1, food_type: 'prepared', energy_kcal: 340, protein_g: 2.5, carbs_g: 70.0, fat_g: 6.0 },

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

async function main() {
  console.log('Seeding popular global & Indian common foods...');
  let added = 0;
  let updated = 0;

  for (const item of COMMON_FOODS) {
    // Check if food already exists
    const existing = await prisma.food_items.findFirst({
      where: { name: { equals: item.name, mode: 'insensitive' } }
    });

    let foodId: number;

    if (!existing) {
      const created = await prisma.food_items.create({
        data: {
          name: item.name,
          food_type: item.food_type,
          category_id: item.category_id,
          source_id: 2, // USDA / Global verified
          reference_unit: '100g',
          is_verified: true,
          is_active: true,
        }
      });
      foodId = created.food_id;
      added++;
    } else {
      foodId = existing.food_id;
      updated++;
    }

    // Insert or update nutrients
    // 1: energy, 2: protein, 3: carbohydrate, 4: fat
    const nutrients = [
      { id: 1, val: item.energy_kcal },
      { id: 2, val: item.protein_g },
      { id: 3, val: item.carbs_g },
      { id: 4, val: item.fat_g }
    ];

    for (const n of nutrients) {
      await prisma.$executeRaw`
        INSERT INTO public.food_nutrients (food_id, nutrient_id, value_per_100g)
        VALUES (${foodId}, ${n.id}, ${n.val})
        ON CONFLICT (food_id, nutrient_id) 
        DO UPDATE SET value_per_100g = EXCLUDED.value_per_100g;
      `;
    }
  }

  console.log(`Seeding complete! Added: ${added}, Updated: ${updated}`);
}

main()
  .catch((e) => {
    console.error('Error seeding foods:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
