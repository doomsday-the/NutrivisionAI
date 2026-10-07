import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo data...');

  // 1. Create dev user
  const user = await prisma.users.upsert({
    where: { google_id: 'dev_user_123' },
    update: {},
    create: {
      google_id: 'dev_user_123',
      email: 'dev@test.com',
      display_name: 'Demo User',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo',
      password_hash: 'placeholder',
      last_login_at: new Date()
    }
  });

  const userId = user.user_id;

  // 2. Create profile
  await prisma.user_profiles.upsert({
    where: { user_id: userId },
    update: {},
    create: {
      user_id: userId,
      height_cm: 175,
      weight_kg: 70,
      age: 30,
      activity_level: 'active',
      goal: 'maintain',
      daily_calorie_target: 2000
    }
  });

  console.log('Created user and profile:', user.email);

  // 3. Clear existing logs and meals for demo user
  await prisma.meal_items.deleteMany({
    where: { meal: { user_id: userId } }
  });
  await prisma.meals.deleteMany({
    where: { user_id: userId }
  });
  await prisma.daily_logs.deleteMany({
    where: { user_id: userId }
  });

  // Fetch some common foods for the demo
  const foods = await prisma.food_items.findMany({
    take: 20
  });

  if (foods.length === 0) {
    console.log('No food items found! Run ETL first.');
    return;
  }

  // Helper to pick random foods
  const pickFood = () => foods[Math.floor(Math.random() * foods.length)];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 4. Inject 7 days of historical meal data
  for (let i = 6; i >= 0; i--) {
    const logDate = new Date(today);
    logDate.setDate(logDate.getDate() - i);
    
    // Random target/burn
    const target = 2000;
    const burned = Math.floor(Math.random() * 500) + 100;
    const steps = Math.floor(Math.random() * 5000) + 5000;

    // Create daily log first
    await prisma.daily_logs.create({
      data: {
        user_id: userId,
        log_date: logDate,
        target_calories: target,
        total_calories: 0,
        total_protein_g: 0,
        total_carbs_g: 0,
        total_fat_g: 0,
        calories_burned: burned,
        remaining_calories: target + burned,
        steps: steps
      }
    });

    const mealTypes = ['breakfast', 'lunch', 'dinner'];
    
    for (const type of mealTypes) {
      const mealTime = new Date(logDate);
      if (type === 'breakfast') mealTime.setHours(8, 30, 0);
      else if (type === 'lunch') mealTime.setHours(13, 0, 0);
      else mealTime.setHours(19, 30, 0);

      // Create meal
      const meal = await prisma.meals.create({
        data: {
          user_id: userId,
          meal_type: type,
          logged_at: mealTime,
          total_calories: 0,
          total_protein_g: 0,
          total_carbs_g: 0,
          total_fat_g: 0
        }
      });

      // Add 2-3 items per meal
      const numItems = Math.floor(Math.random() * 2) + 2;
      for (let j = 0; j < numItems; j++) {
        const food = pickFood();
        const qty = Math.floor(Math.random() * 100) + 100; // 100-200g
        
        await prisma.$executeRaw`
          INSERT INTO public.meal_items (meal_id, food_id, quantity_grams, estimated_calories)
          VALUES (
            ${meal.meal_id}, 
            ${food.food_id}, 
            ${qty}, 
            0
          )
        `;
      }
      
      await prisma.$executeRaw`
        WITH updated_items AS (
            UPDATE public.meal_items mi
            SET estimated_calories = COALESCE(ROUND((fn_energy.value_per_100g * mi.quantity_grams / 100.0), 1), 0)
            FROM public.food_items f
            LEFT JOIN public.food_nutrients fn_energy ON fn_energy.food_id = f.food_id AND fn_energy.nutrient_id = 2
            WHERE mi.meal_id = ${meal.meal_id} AND mi.food_id = f.food_id
            RETURNING mi.food_id, mi.quantity_grams, mi.estimated_calories
        ),
        macro_totals AS (
            SELECT 
                SUM(ui.estimated_calories) as sum_calories,
                SUM(ROUND((fn_protein.value_per_100g * ui.quantity_grams / 100.0), 1)) as sum_protein,
                SUM(ROUND((fn_carbs.value_per_100g * ui.quantity_grams / 100.0), 1)) as sum_carbs,
                SUM(ROUND((fn_fat.value_per_100g * ui.quantity_grams / 100.0), 1)) as sum_fat
            FROM updated_items ui
            LEFT JOIN public.food_nutrients fn_protein ON fn_protein.food_id = ui.food_id AND fn_protein.nutrient_id = 3
            LEFT JOIN public.food_nutrients fn_carbs ON fn_carbs.food_id = ui.food_id AND fn_carbs.nutrient_id = 5
            LEFT JOIN public.food_nutrients fn_fat ON fn_fat.food_id = ui.food_id AND fn_fat.nutrient_id = 4
        )
        UPDATE public.meals m
        SET 
            total_calories = COALESCE((SELECT sum_calories FROM macro_totals), 0),
            total_protein_g = COALESCE((SELECT sum_protein FROM macro_totals), 0),
            total_carbs_g = COALESCE((SELECT sum_carbs FROM macro_totals), 0),
            total_fat_g = COALESCE((SELECT sum_fat FROM macro_totals), 0)
        WHERE m.meal_id = ${meal.meal_id};
      `;
    }
    
    // Ensure daily log is fully synced
    await prisma.$executeRaw`
        WITH meal_totals AS (
            SELECT 
                COALESCE(SUM(total_calories), 0) as tc,
                COALESCE(SUM(total_protein_g), 0) as tp,
                COALESCE(SUM(total_carbs_g), 0) as tcarb,
                COALESCE(SUM(total_fat_g), 0) as tf
            FROM public.meals
            WHERE user_id = ${userId} AND logged_at >= ${logDate}::date AND logged_at < (${logDate}::date + interval '1 day')
        )
        UPDATE public.daily_logs
        SET 
            total_calories = mt.tc,
            total_protein_g = mt.tp,
            total_carbs_g = mt.tcarb,
            total_fat_g = mt.tf,
            remaining_calories = target_calories - mt.tc + calories_burned
        FROM meal_totals mt
        WHERE user_id = ${userId} AND log_date = ${logDate}::date;
    `;
  }

  console.log('Demo seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
