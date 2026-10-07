import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Database Seeding ---');

  // 1. Seed Required Nutrient Types with Stable IDs (1 to 7)
  const nutrientDefinitions = [
    { nutrient_id: 1, name: 'energy', display_name: 'Energy', unit: 'kcal', category: 'General', daily_value_ref: 2000, sort_order: 1 },
    { nutrient_id: 2, name: 'protein', display_name: 'Protein', unit: 'g', category: 'Macros', daily_value_ref: 50, sort_order: 2 },
    { nutrient_id: 3, name: 'carbohydrate', display_name: 'Carbohydrate', unit: 'g', category: 'Macros', daily_value_ref: 275, sort_order: 3 },
    { nutrient_id: 4, name: 'fat', display_name: 'Total Fat', unit: 'g', category: 'Macros', daily_value_ref: 78, sort_order: 4 },
    { nutrient_id: 5, name: 'fiber', display_name: 'Dietary Fiber', unit: 'g', category: 'Macros', daily_value_ref: 28, sort_order: 5 },
    { nutrient_id: 6, name: 'sugars', display_name: 'Total Sugars', unit: 'g', category: 'Macros', daily_value_ref: 50, sort_order: 6 },
    { nutrient_id: 7, name: 'sodium', display_name: 'Sodium', unit: 'mg', category: 'Micros', daily_value_ref: 2300, sort_order: 7 },
  ];

  for (const n of nutrientDefinitions) {
    await prisma.nutrient_types.upsert({
      where: { nutrient_id: n.nutrient_id },
      update: {
        name: n.name,
        display_name: n.display_name,
        unit: n.unit,
        category: n.category,
        daily_value_ref: n.daily_value_ref,
        sort_order: n.sort_order,
      },
      create: n,
    });
  }
  console.log('✔ Nutrient types seeded (7 stable types)');

  // 2. Seed Food Sources
  const ifctSource = await prisma.food_sources.upsert({
    where: { source_id: 1 },
    update: {
      source_name: 'ICMR-NIN IFCT 2017',
      source_version: '2017',
      source_url: 'https://www.nin.res.in/ebooks/IFCT2017.pdf',
    },
    create: {
      source_id: 1,
      source_name: 'ICMR-NIN IFCT 2017',
      source_version: '2017',
      source_url: 'https://www.nin.res.in/ebooks/IFCT2017.pdf',
    },
  });

  const usdaSource = await prisma.food_sources.upsert({
    where: { source_id: 2 },
    update: {
      source_name: 'USDA FoodData Central',
      source_version: 'April 2024',
      source_url: 'https://fdc.nal.usda.gov/',
    },
    create: {
      source_id: 2,
      source_name: 'USDA FoodData Central',
      source_version: 'April 2024',
      source_url: 'https://fdc.nal.usda.gov/',
    },
  });
  console.log('✔ Food sources seeded (IFCT=1, USDA=2)');

  // 3. Seed Food Categories
  const categories = [
    { category_id: 1, name: 'Cereals and Millets', slug: 'cereals-and-millets' },
    { category_id: 2, name: 'Pulses and Legumes', slug: 'pulses-and-legumes' },
    { category_id: 3, name: 'Dairy and Milk Products', slug: 'dairy-and-milk-products' },
    { category_id: 4, name: 'Fast Foods & Prepared', slug: 'fast-foods-and-prepared' },
    { category_id: 5, name: 'Fruits', slug: 'fruits' },
    { category_id: 6, name: 'Poultry & Meats', slug: 'poultry-and-meats' },
    { category_id: 7, name: 'Nuts & Seeds', slug: 'nuts-and-seeds' },
  ];

  for (const cat of categories) {
    await prisma.food_categories.upsert({
      where: { category_id: cat.category_id },
      update: { name: cat.name, slug: cat.slug },
      create: cat,
    });
  }
  console.log('✔ Food categories seeded');

  // 4. Seed the 15 MVP Foods with Stable IDs
  // ID 12 (Rice) & ID 34 (Dal) are required by AI Service Contract TC-001
  const mvpFoods = [
    {
      food_id: 12,
      external_id: 'IFCT-002',
      source_id: ifctSource.source_id,
      category_id: 1,
      name: 'Rice - cooked (boiled)',
      food_type: 'cooked',
      nutrients: { energy: 130, protein: 2.7, carbohydrate: 28.0, fat: 0.3, fiber: 0.4, sodium: 1 },
    },
    {
      food_id: 34,
      external_id: 'IFCT-004',
      source_id: ifctSource.source_id,
      category_id: 2,
      name: 'Dal - cooked',
      food_type: 'cooked',
      nutrients: { energy: 116, protein: 9.0, carbohydrate: 20.0, fat: 0.4, fiber: 8.0, sodium: 200 },
    },
    {
      food_id: 13,
      external_id: 'IFCT-013',
      source_id: ifctSource.source_id,
      category_id: 3,
      name: "Milk (cow's)",
      food_type: 'beverage',
      nutrients: { energy: 61, protein: 3.2, carbohydrate: 4.8, fat: 3.3, fiber: 0.0, sodium: 44 },
    },
    {
      food_id: 14,
      external_id: 'IFCT-014',
      source_id: ifctSource.source_id,
      category_id: 2,
      name: 'Rajma (cooked)',
      food_type: 'cooked',
      nutrients: { energy: 127, protein: 8.7, carbohydrate: 22.8, fat: 0.5, fiber: 6.4, sodium: 200 },
    },
    {
      food_id: 15,
      external_id: 'IFCT-015',
      source_id: ifctSource.source_id,
      category_id: 2,
      name: 'Chana (cooked)',
      food_type: 'cooked',
      nutrients: { energy: 164, protein: 8.9, carbohydrate: 27.4, fat: 2.6, fiber: 7.6, sodium: 150 },
    },
    {
      food_id: 16,
      external_id: '10001',
      source_id: usdaSource.source_id,
      category_id: 4,
      name: 'Pizza (cheese)',
      food_type: 'packaged',
      nutrients: { energy: 266, protein: 11.39, carbohydrate: 33.33, fat: 9.69, fiber: 2.3, sodium: 598 },
    },
    {
      food_id: 17,
      external_id: '10002',
      source_id: usdaSource.source_id,
      category_id: 4,
      name: 'Burger (beef)',
      food_type: 'packaged',
      nutrients: { energy: 254, protein: 11.75, carbohydrate: 29.41, fat: 10.0, fiber: 1.5, sodium: 450 },
    },
    {
      food_id: 18,
      external_id: '10003',
      source_id: usdaSource.source_id,
      category_id: 4,
      name: 'Pasta (cooked)',
      food_type: 'cooked',
      nutrients: { energy: 158, protein: 5.8, carbohydrate: 31.0, fat: 0.9, fiber: 1.8, sodium: 5 },
    },
    {
      food_id: 19,
      external_id: '10004',
      source_id: usdaSource.source_id,
      category_id: 1,
      name: 'Oats (cooked)',
      food_type: 'cooked',
      nutrients: { energy: 71, protein: 2.5, carbohydrate: 12.0, fat: 1.5, fiber: 1.7, sodium: 2 },
    },
    {
      food_id: 20,
      external_id: '10005',
      source_id: usdaSource.source_id,
      category_id: 1,
      name: 'Bread (white)',
      food_type: 'packaged',
      nutrients: { energy: 266, protein: 8.85, carbohydrate: 49.4, fat: 3.33, fiber: 2.7, sodium: 491 },
    },
    {
      food_id: 21,
      external_id: '10006',
      source_id: usdaSource.source_id,
      category_id: 5,
      name: 'Apple',
      food_type: 'raw',
      nutrients: { energy: 52, protein: 0.26, carbohydrate: 13.8, fat: 0.17, fiber: 2.4, sodium: 1 },
    },
    {
      food_id: 22,
      external_id: '10007',
      source_id: usdaSource.source_id,
      category_id: 5,
      name: 'Banana',
      food_type: 'raw',
      nutrients: { energy: 89, protein: 1.09, carbohydrate: 22.8, fat: 0.33, fiber: 2.6, sodium: 1 },
    },
    {
      food_id: 23,
      external_id: '10008',
      source_id: usdaSource.source_id,
      category_id: 6,
      name: 'Chicken breast (grilled)',
      food_type: 'cooked',
      nutrients: { energy: 165, protein: 31.0, carbohydrate: 0.0, fat: 3.57, fiber: 0.0, sodium: 74 },
    },
    {
      food_id: 24,
      external_id: '10009',
      source_id: usdaSource.source_id,
      category_id: 7,
      name: 'Almonds',
      food_type: 'raw',
      nutrients: { energy: 579, protein: 21.2, carbohydrate: 21.6, fat: 49.9, fiber: 12.5, sodium: 1 },
    },
    {
      food_id: 25,
      external_id: '10010',
      source_id: usdaSource.source_id,
      category_id: 3,
      name: 'Yogurt (plain)',
      food_type: 'packaged',
      nutrients: { energy: 61, protein: 3.47, carbohydrate: 4.66, fat: 3.25, fiber: 0.0, sodium: 46 },
    },
  ];

  const nutrientMap: Record<string, number> = {
    energy: 1,
    protein: 2,
    carbohydrate: 3,
    fat: 4,
    fiber: 5,
    sugars: 6,
    sodium: 7,
  };

  for (const item of mvpFoods) {
    const { nutrients, ...foodData } = item;
    await prisma.food_items.upsert({
      where: { food_id: foodData.food_id },
      update: {
        external_id: foodData.external_id,
        source_id: foodData.source_id,
        category_id: foodData.category_id,
        name: foodData.name,
        food_type: foodData.food_type,
        reference_unit: '100g',
        is_verified: true,
        is_active: true,
      },
      create: {
        ...foodData,
        reference_unit: '100g',
        is_verified: true,
        is_active: true,
      },
    });

    for (const [nutName, val] of Object.entries(nutrients)) {
      const nutId = nutrientMap[nutName];
      if (nutId) {
        await prisma.food_nutrients.upsert({
          where: { food_id_nutrient_id: { food_id: foodData.food_id, nutrient_id: nutId } },
          update: { value_per_100g: val },
          create: {
            food_id: foodData.food_id,
            nutrient_id: nutId,
            value_per_100g: val,
          },
        });
      }
    }
  }
  console.log(`✔ 15 MVP foods seeded with stable IDs (Rice=12, Dal=34) and full macro profiles`);

  // 5. Seed Dev User & Default Profile (NODE_ENV === 'development' only)
  if (process.env.NODE_ENV === 'development') {
    const devPassword = process.env.DEV_USER_PASSWORD || 'devpassword';
    const devPasswordHash = await bcrypt.hash(devPassword, 10);
    const devUser = await prisma.users.upsert({
      where: { email: 'dev@test.com' },
      update: {
        display_name: 'Dev User',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        role: 'admin',
      },
      create: {
        google_id: 'dev_user_123',
        email: 'dev@test.com',
        display_name: 'Dev User',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        role: 'admin',
        password_hash: devPasswordHash,
        last_login_at: new Date(),
      },
    });

    await prisma.user_profiles.upsert({
      where: { user_id: devUser.user_id },
      update: {
        daily_calorie_target: 2000,
        activity_level: 'moderate',
        goal: 'maintain',
      },
      create: {
        user_id: devUser.user_id,
        age: 25,
        height_cm: 175.0,
        weight_kg: 70.0,
        activity_level: 'moderate',
        goal: 'maintain',
        daily_calorie_target: 2000,
      },
    });
    console.log('✔ Dev user & profile seeded (dev@test.com)');
  } else {
    console.log('ℹ Skipping dev user seed in production environment');
  }

  // 6. Synchronize Database Sequences
  await prisma.$executeRawUnsafe(`SELECT setval('food_items_food_id_seq', COALESCE((SELECT MAX(food_id) FROM food_items), 1))`);
  await prisma.$executeRawUnsafe(`SELECT setval('nutrient_types_nutrient_id_seq', COALESCE((SELECT MAX(nutrient_id) FROM nutrient_types), 1))`);
  await prisma.$executeRawUnsafe(`SELECT setval('food_sources_source_id_seq', COALESCE((SELECT MAX(source_id) FROM food_sources), 1))`);
  await prisma.$executeRawUnsafe(`SELECT setval('food_categories_category_id_seq', COALESCE((SELECT MAX(category_id) FROM food_categories), 1))`);
  await prisma.$executeRawUnsafe(`SELECT setval('users_user_id_seq', COALESCE((SELECT MAX(user_id) FROM users), 1))`);
  console.log('✔ Primary key sequences synchronized');

  console.log('--- Database Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
