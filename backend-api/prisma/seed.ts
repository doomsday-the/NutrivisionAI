import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database...');

  // 1. Seed Nutrient Types
  await prisma.nutrient_types.upsert({
    where: { name: 'energy' },
    update: {},
    create: { name: 'energy', display_name: 'Energy', unit: 'kcal', category: 'General', daily_value_ref: 2000, sort_order: 1 },
  });
  await prisma.nutrient_types.upsert({
    where: { name: 'protein' },
    update: {},
    create: { name: 'protein', display_name: 'Protein', unit: 'g', category: 'Macros', daily_value_ref: 50, sort_order: 2 },
  });
  await prisma.nutrient_types.upsert({
    where: { name: 'carbohydrate' },
    update: {},
    create: { name: 'carbohydrate', display_name: 'Carbohydrate', unit: 'g', category: 'Macros', daily_value_ref: 275, sort_order: 3 },
  });
  await prisma.nutrient_types.upsert({
    where: { name: 'fat' },
    update: {},
    create: { name: 'fat', display_name: 'Total Fat', unit: 'g', category: 'Macros', daily_value_ref: 78, sort_order: 4 },
  });
  await prisma.nutrient_types.upsert({
    where: { name: 'fiber' },
    update: {},
    create: { name: 'fiber', display_name: 'Dietary Fiber', unit: 'g', category: 'Macros', daily_value_ref: 28, sort_order: 5 },
  });

  // 2. Seed Food Sources
  const ifct = await prisma.food_sources.upsert({
    where: { source_name: 'ICMR-NIN IFCT 2017' },
    update: {},
    create: { source_name: 'ICMR-NIN IFCT 2017', source_url: 'https://www.nin.res.in/ebooks/IFCT2017.pdf' },
  });
  const usda = await prisma.food_sources.upsert({
    where: { source_name: 'USDA FoodData Central' },
    update: {},
    create: { source_name: 'USDA FoodData Central', source_url: 'https://fdc.nal.usda.gov/' },
  });

  // 3. Seed Food Categories
  const catCereals = await prisma.food_categories.upsert({
    where: { slug: 'cereals-and-millets' },
    update: {},
    create: { name: 'Cereals and Millets', slug: 'cereals-and-millets' },
  });

  // 4. Seed Mock Food Item (Rice - cooked)
  const rice = await prisma.food_items.upsert({
    where: { food_id: 12 }, // We hardcode the ID to match the AI Mock contract TC-001
    update: {},
    create: {
      food_id: 12,
      name: 'Rice - cooked (boiled)',
      food_type: 'cooked',
      source_id: ifct.source_id,
      category_id: catCereals.category_id,
      is_verified: true,
    },
  });

  // Ensure nutrients are attached to rice
  const nutrients = await prisma.nutrient_types.findMany();
  const getNutrientId = (name: string) => nutrients.find(n => n.name === name)?.nutrient_id || 0;

  // Macros per 100g of cooked rice (approx)
  const riceMacros = [
    { nutrient_id: getNutrientId('energy'), value_per_100g: 130 },
    { nutrient_id: getNutrientId('protein'), value_per_100g: 2.7 },
    { nutrient_id: getNutrientId('carbohydrate'), value_per_100g: 28 },
    { nutrient_id: getNutrientId('fat'), value_per_100g: 0.3 },
    { nutrient_id: getNutrientId('fiber'), value_per_100g: 0.4 },
  ];

  for (const macro of riceMacros) {
    await prisma.food_nutrients.upsert({
      where: { food_id_nutrient_id: { food_id: rice.food_id, nutrient_id: macro.nutrient_id } },
      update: { value_per_100g: macro.value_per_100g },
      create: { food_id: rice.food_id, nutrient_id: macro.nutrient_id, value_per_100g: macro.value_per_100g },
    });
  }

  // 5. Seed Mock Food Item (Dal)
  const dal = await prisma.food_items.upsert({
    where: { food_id: 34 }, // Match AI Mock contract TC-001
    update: {},
    create: {
      food_id: 34,
      name: 'Dal - cooked',
      food_type: 'cooked',
      source_id: ifct.source_id,
      category_id: catCereals.category_id, // simplified
      is_verified: true,
    },
  });

  const dalMacros = [
    { nutrient_id: getNutrientId('energy'), value_per_100g: 116 },
    { nutrient_id: getNutrientId('protein'), value_per_100g: 9 },
    { nutrient_id: getNutrientId('carbohydrate'), value_per_100g: 20 },
    { nutrient_id: getNutrientId('fat'), value_per_100g: 0.4 },
    { nutrient_id: getNutrientId('fiber'), value_per_100g: 8 },
  ];

  for (const macro of dalMacros) {
    await prisma.food_nutrients.upsert({
      where: { food_id_nutrient_id: { food_id: dal.food_id, nutrient_id: macro.nutrient_id } },
      update: { value_per_100g: macro.value_per_100g },
      create: { food_id: dal.food_id, nutrient_id: macro.nutrient_id, value_per_100g: macro.value_per_100g },
    });
  }

  console.log('Seeding Complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
