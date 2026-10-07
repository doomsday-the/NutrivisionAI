import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import FormData from 'form-data';
import { AuthRequest } from '../middlewares/auth';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const analyzeMeal = async (req: AuthRequest, res: Response) => {
  const file = req.file;
  const { meal_type } = req.body;
  const user_id = req.user!.user_id;

  if (!file) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Image file is required' });
  }

  const session_id = crypto.randomUUID();

  try {
    // 1. Call AI Service (TC-001) — forward image as multipart
    const formData = new FormData();
    formData.append('image', file.buffer, { filename: file.originalname, contentType: file.mimetype });
    formData.append('session_id', session_id);

    const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/predict`, formData, {
      headers: {
        ...formData.getHeaders(),
        'X-Internal-Token': process.env.X_INTERNAL_TOKEN
      },
      timeout: 30000
    });

    const { detections } = aiResponse.data;

    // 2. Call Stored Procedure for atomic transaction
    // sp_log_meal(p_user_id INT, p_meal_type VARCHAR, p_image_url TEXT, p_detections JSONB, p_session_id VARCHAR)
    const result: any = await prisma.$queryRaw`
      CALL public.sp_log_meal(
        ${user_id}::INT,
        ${meal_type}::VARCHAR,
        ${'http://mock-image-url.com/img.jpg'}::TEXT,
        ${JSON.stringify(detections)}::JSONB,
        ${session_id}::VARCHAR,
        null
      )
    `;

    const mealId = result && result[0]?.p_meal_id ? Number(result[0].p_meal_id) : null;
    if (!mealId) {
      console.error('[Meal Analyze Error] Stored procedure did not return a valid meal_id', result);
      return res.status(500).json({
        error: 'MEAL_SAVE_FAILED',
        message: 'Failed to record meal transaction.'
      });
    }

    const meal = await prisma.meals.findUnique({
      where: { meal_id: mealId },
      include: {
        meal_items: {
          include: { food: true }
        }
      }
    });

    if (!meal) {
      return res.status(500).json({ error: 'MEAL_SAVE_FAILED', message: 'Meal could not be retrieved.' });
    }

    const confidenceMap = new Map<number, number>();
    for (const d of (detections || [])) {
      if (d.matched_food_id && typeof d.confidence === 'number') {
        confidenceMap.set(d.matched_food_id, d.confidence);
      }
    }

    const items = meal.meal_items.map((item) => ({
      item_id: item.item_id,
      food_id: item.food_id,
      food_name: item.food?.name || 'Unknown food',
      quantity_grams: Number(item.quantity_grams),
      estimated_calories: Number(item.estimated_calories),
      confidence: confidenceMap.get(item.food_id) ?? 1.0,
      food: item.food
    }));

    return res.status(201).json({
      meal_id: meal.meal_id,
      meal_type: meal.meal_type,
      logged_at: meal.logged_at.toISOString(),
      total_calories: Number(meal.total_calories || 0),
      total_protein_g: Number(meal.total_protein_g || 0),
      total_carbs_g: Number(meal.total_carbs_g || 0),
      total_fat_g: Number(meal.total_fat_g || 0),
      items,
      meal_items: items
    });

  } catch (error: any) {
    console.error('[Meal Analyze Error]', error);

    // F-001: AI Service Timeout or 5xx
    if (error.code === 'ECONNABORTED' || (error.response && error.response.status >= 500)) {
      return res.status(503).json({
        error: 'AI_SERVICE_UNAVAILABLE',
        message: 'Food detection is temporarily unavailable. Please try again.'
      });
    }

    // F-002: Database Transaction Failure
    return res.status(500).json({
      error: 'MEAL_SAVE_FAILED',
      message: 'We could not save your meal. Please try again.'
    });
  }
};

export const correctMealItem = async (req: AuthRequest, res: Response) => {
  const user_id = req.user!.user_id;

  const rawMealId = Array.isArray(req.params.mealId) ? req.params.mealId[0] : req.params.mealId;
  const rawItemId = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;

  // Strict validation: IDs must consist solely of digits and be positive integers
  if (!rawMealId || !/^\d+$/.test(rawMealId) || !rawItemId || !/^\d+$/.test(rawItemId)) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid mealId or itemId parameter' });
  }

  const mealId = parseInt(rawMealId, 10);
  const itemId = parseInt(rawItemId, 10);
  if (mealId <= 0 || itemId <= 0) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid mealId or itemId parameter' });
  }

  const { new_food_id, quantity_grams } = req.body;

  // Validate new_food_id: must be a positive integer
  let foodId: number;
  if (typeof new_food_id === 'number') {
    if (!Number.isInteger(new_food_id) || new_food_id <= 0) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid new_food_id' });
    }
    foodId = new_food_id;
  } else if (typeof new_food_id === 'string' && /^\d+$/.test(new_food_id.trim())) {
    foodId = parseInt(new_food_id.trim(), 10);
    if (foodId <= 0) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid new_food_id' });
    }
  } else {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid new_food_id' });
  }

  // Validate quantity_grams: must be a positive finite number (> 0)
  let quantity: number;
  if (typeof quantity_grams === 'number') {
    if (isNaN(quantity_grams) || !isFinite(quantity_grams) || quantity_grams <= 0) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid quantity_grams' });
    }
    quantity = quantity_grams;
  } else if (typeof quantity_grams === 'string' && /^\d+(\.\d+)?$/.test(quantity_grams.trim())) {
    quantity = Number(quantity_grams.trim());
    if (isNaN(quantity) || !isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid quantity_grams' });
    }
  } else {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid quantity_grams' });
  }

  try {
    // Verify the meal belongs to the user
    const meal = await prisma.meals.findUnique({
      where: { meal_id: mealId }
    });

    if (!meal || meal.user_id !== user_id) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Meal not found' });
    }

    // Verify the item belongs to the meal
    const mealItem = await prisma.meal_items.findUnique({
      where: { item_id: itemId }
    });

    if (!mealItem || mealItem.meal_id !== mealId) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Meal item not found' });
    }

    // Get the new food to calculate calories
    const newFood = await prisma.food_items.findUnique({
      where: { food_id: foodId },
      include: {
        food_nutrients: {
          include: { nutrient: true }
        }
      }
    });

    if (!newFood) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'New food item not found' });
    }

    // Calculate new calories
    const energyNutrient = newFood.food_nutrients.find(n =>
      n.nutrient_id === 1 || n.nutrient.name.toLowerCase() === 'energy' || n.nutrient.name.toLowerCase() === 'calories'
    );

    let estimated_calories = 0;
    if (energyNutrient) {
      estimated_calories = (Number(energyNutrient.value_per_100g) / 100) * quantity;
    }

    await prisma.$transaction(async (tx) => {
      // Recalculate meal totals with the corrected item before writing
      const allItems = await tx.meal_items.findMany({
        where: { meal_id: mealId },
        include: {
          food: {
            include: {
              food_nutrients: {
                include: { nutrient: true }
              }
            }
          }
        }
      });

      let totalCal = 0, totalPro = 0, totalCarb = 0, totalFat = 0;

      for (const item of allItems) {
        if (item.item_id === itemId) {
          const qtyMultiplier = quantity / 100;
          const energy = newFood.food_nutrients.find(n => n.nutrient_id === 1 || n.nutrient.name.toLowerCase() === 'energy' || n.nutrient.name.toLowerCase() === 'calories');
          const protein = newFood.food_nutrients.find(n => n.nutrient_id === 2 || n.nutrient.name.toLowerCase() === 'protein');
          const carbs = newFood.food_nutrients.find(n => n.nutrient_id === 3 || n.nutrient.name.toLowerCase() === 'carbohydrate' || n.nutrient.name.toLowerCase() === 'carbs');
          const fat = newFood.food_nutrients.find(n => n.nutrient_id === 4 || n.nutrient.name.toLowerCase() === 'fat' || n.nutrient.name.toLowerCase() === 'total lipid (fat)');

          if (energy) totalCal += Number(energy.value_per_100g) * qtyMultiplier;
          if (protein) totalPro += Number(protein.value_per_100g) * qtyMultiplier;
          if (carbs) totalCarb += Number(carbs.value_per_100g) * qtyMultiplier;
          if (fat) totalFat += Number(fat.value_per_100g) * qtyMultiplier;
        } else {
          const qtyMultiplier = Number(item.quantity_grams) / 100;
          const energy = item.food.food_nutrients.find(n => n.nutrient_id === 1 || n.nutrient.name.toLowerCase() === 'energy' || n.nutrient.name.toLowerCase() === 'calories');
          const protein = item.food.food_nutrients.find(n => n.nutrient_id === 2 || n.nutrient.name.toLowerCase() === 'protein');
          const carbs = item.food.food_nutrients.find(n => n.nutrient_id === 3 || n.nutrient.name.toLowerCase() === 'carbohydrate' || n.nutrient.name.toLowerCase() === 'carbs');
          const fat = item.food.food_nutrients.find(n => n.nutrient_id === 4 || n.nutrient.name.toLowerCase() === 'fat' || n.nutrient.name.toLowerCase() === 'total lipid (fat)');

          if (energy) totalCal += Number(energy.value_per_100g) * qtyMultiplier;
          if (protein) totalPro += Number(protein.value_per_100g) * qtyMultiplier;
          if (carbs) totalCarb += Number(carbs.value_per_100g) * qtyMultiplier;
          if (fat) totalFat += Number(fat.value_per_100g) * qtyMultiplier;
        }
      }

      // Update parent meal totals FIRST so any triggers or readers observe the recalculated totals
      await tx.meals.update({
        where: { meal_id: mealId },
        data: {
          total_calories: totalCal,
          total_protein_g: totalPro,
          total_carbs_g: totalCarb,
          total_fat_g: totalFat
        }
      });

      // Update item (this fires trg_update_daily_log on meal_items, which now reads the updated meals totals)
      await tx.meal_items.update({
        where: { item_id: itemId },
        data: {
          food_id: foodId,
          quantity_grams: quantity,
          estimated_calories: estimated_calories,
          user_corrected: true
        }
      });

      // Explicitly update daily_logs inside transaction to ensure totals are perfectly fresh
      await tx.$executeRaw`
        UPDATE public.daily_logs
        SET total_calories = (
              SELECT COALESCE(SUM(m.total_calories), 0) FROM public.meals m
              WHERE m.user_id = ${meal.user_id} AND (m.logged_at AT TIME ZONE 'UTC')::DATE = (${meal.logged_at}::timestamptz AT TIME ZONE 'UTC')::DATE
            ),
            total_protein_g = (
              SELECT COALESCE(SUM(m.total_protein_g), 0) FROM public.meals m
              WHERE m.user_id = ${meal.user_id} AND (m.logged_at AT TIME ZONE 'UTC')::DATE = (${meal.logged_at}::timestamptz AT TIME ZONE 'UTC')::DATE
            ),
            total_carbs_g = (
              SELECT COALESCE(SUM(m.total_carbs_g), 0) FROM public.meals m
              WHERE m.user_id = ${meal.user_id} AND (m.logged_at AT TIME ZONE 'UTC')::DATE = (${meal.logged_at}::timestamptz AT TIME ZONE 'UTC')::DATE
            ),
            total_fat_g = (
              SELECT COALESCE(SUM(m.total_fat_g), 0) FROM public.meals m
              WHERE m.user_id = ${meal.user_id} AND (m.logged_at AT TIME ZONE 'UTC')::DATE = (${meal.logged_at}::timestamptz AT TIME ZONE 'UTC')::DATE
            ),
            remaining_calories = target_calories - (
              SELECT COALESCE(SUM(m.total_calories), 0) FROM public.meals m
              WHERE m.user_id = ${meal.user_id} AND (m.logged_at AT TIME ZONE 'UTC')::DATE = (${meal.logged_at}::timestamptz AT TIME ZONE 'UTC')::DATE
            ) + calories_burned
        WHERE user_id = ${meal.user_id} AND log_date = (${meal.logged_at}::timestamptz AT TIME ZONE 'UTC')::DATE;
      `;

      // Also log the correction in ai_match_log
      await tx.ai_match_log.create({
        data: {
          detected_label: mealItem.food_id.toString(),
          matched_food_id: mealItem.food_id,
          user_corrected: true,
          corrected_food_id: foodId,
          weight_grams: quantity
        }
      });
    });

    // Fetch updated meal to return
    const updatedMeal = await prisma.meals.findUnique({
      where: { meal_id: mealId },
      include: {
        meal_items: {
          include: { food: true }
        }
      }
    });

    const items = updatedMeal!.meal_items.map((item) => ({
      item_id: item.item_id,
      food_id: item.food_id,
      food_name: item.food?.name || 'Unknown food',
      quantity_grams: Number(item.quantity_grams),
      estimated_calories: Number(item.estimated_calories),
      user_corrected: item.user_corrected,
      food: item.food
    }));

    return res.status(200).json({
      meal_id: updatedMeal!.meal_id,
      meal_type: updatedMeal!.meal_type,
      total_calories: Number(updatedMeal!.total_calories),
      total_protein_g: Number(updatedMeal!.total_protein_g),
      total_carbs_g: Number(updatedMeal!.total_carbs_g),
      total_fat_g: Number(updatedMeal!.total_fat_g),
      items
    });

  } catch (error) {
    console.error('[Correct Meal Item Error]', error);
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to correct meal item' });
  }
};

export const deleteMeal = async (req: AuthRequest, res: Response) => {
  const user_id = req.user!.user_id;
  const rawMealId = Array.isArray(req.params.mealId) ? req.params.mealId[0] : req.params.mealId;
  const mealId = parseInt(rawMealId, 10);

  if (isNaN(mealId) || mealId <= 0) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid mealId parameter' });
  }

  try {
    const meal = await prisma.meals.findUnique({
      where: { meal_id: mealId }
    });

    if (!meal) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Meal not found' });
    }

    if (meal.user_id !== user_id) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'You do not have permission to delete this meal' });
    }

    await prisma.$transaction(async (tx) => {
      // Delete child meal items first (FK constraint)
      await tx.meal_items.deleteMany({
        where: { meal_id: mealId }
      });

      // Delete the meal
      await tx.meals.delete({
        where: { meal_id: mealId }
      });

      // Recalculate daily_logs via raw SQL to ensure totals are perfectly accurate
      await tx.$executeRaw`
        UPDATE public.daily_logs
        SET total_calories = (
              SELECT COALESCE(SUM(m.total_calories), 0) FROM public.meals m
              WHERE m.user_id = ${meal.user_id} AND (m.logged_at AT TIME ZONE 'UTC')::DATE = (${meal.logged_at}::timestamptz AT TIME ZONE 'UTC')::DATE
            ),
            total_protein_g = (
              SELECT COALESCE(SUM(m.total_protein_g), 0) FROM public.meals m
              WHERE m.user_id = ${meal.user_id} AND (m.logged_at AT TIME ZONE 'UTC')::DATE = (${meal.logged_at}::timestamptz AT TIME ZONE 'UTC')::DATE
            ),
            total_carbs_g = (
              SELECT COALESCE(SUM(m.total_carbs_g), 0) FROM public.meals m
              WHERE m.user_id = ${meal.user_id} AND (m.logged_at AT TIME ZONE 'UTC')::DATE = (${meal.logged_at}::timestamptz AT TIME ZONE 'UTC')::DATE
            ),
            total_fat_g = (
              SELECT COALESCE(SUM(m.total_fat_g), 0) FROM public.meals m
              WHERE m.user_id = ${meal.user_id} AND (m.logged_at AT TIME ZONE 'UTC')::DATE = (${meal.logged_at}::timestamptz AT TIME ZONE 'UTC')::DATE
            ),
            remaining_calories = target_calories - (
              SELECT COALESCE(SUM(m.total_calories), 0) FROM public.meals m
              WHERE m.user_id = ${meal.user_id} AND (m.logged_at AT TIME ZONE 'UTC')::DATE = (${meal.logged_at}::timestamptz AT TIME ZONE 'UTC')::DATE
            ) + calories_burned
        WHERE user_id = ${meal.user_id} AND log_date = (${meal.logged_at}::timestamptz AT TIME ZONE 'UTC')::DATE;
      `;
    });

    return res.status(204).send();
  } catch (error) {
    console.error('[Delete Meal Error]', error);
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete meal' });
  }
};

export const getMealHistory = async (req: AuthRequest, res: Response) => {
  const user_id = req.user!.user_id;
  const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
  const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || '10', 10)));
  const dateStr = req.query.date as string | undefined;
  const startParam = req.query.start as string | undefined;
  const endParam = req.query.end as string | undefined;

  const skip = (page - 1) * limit;

  const whereClause: any = {
    user_id
  };

  if (startParam && endParam) {
    whereClause.logged_at = {
      gte: new Date(startParam),
      lte: new Date(endParam)
    };
  } else if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);
    whereClause.logged_at = {
      gte: startOfDay,
      lte: endOfDay
    };
  }

  try {
    const [total, rawMeals] = await Promise.all([
      prisma.meals.count({ where: whereClause }),
      prisma.meals.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { logged_at: 'desc' },
        include: {
          meal_items: {
            include: { food: true }
          }
        }
      })
    ]);

    const meals = rawMeals.map(meal => ({
      meal_id: meal.meal_id,
      meal_type: meal.meal_type,
      logged_at: meal.logged_at.toISOString(),
      total_calories: Number(meal.total_calories || 0),
      total_protein_g: Number(meal.total_protein_g || 0),
      total_carbs_g: Number(meal.total_carbs_g || 0),
      total_fat_g: Number(meal.total_fat_g || 0),
      items: meal.meal_items.map(item => ({
        item_id: item.item_id,
        food_id: item.food_id,
        food_name: item.food?.name || 'Unknown food',
        quantity_grams: Number(item.quantity_grams),
        estimated_calories: Number(item.estimated_calories),
        user_corrected: item.user_corrected,
        food: item.food
      }))
    }));

    return res.status(200).json({
      meals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[Meal History Error]', error);
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch meal history' });
  }
};

export const createMeal = async (req: AuthRequest, res: Response) => {
  const user_id = req.user!.user_id;
  const { meal_type } = req.body;

  try {
    const meal = await prisma.meals.create({
      data: {
        user_id,
        meal_type,
        total_calories: 0,
        total_protein_g: 0,
        total_carbs_g: 0,
        total_fat_g: 0,
        logged_at: new Date()
      }
    });

    return res.status(201).json({
      meal_id: meal.meal_id,
      meal_type: meal.meal_type,
      logged_at: meal.logged_at.toISOString(),
      total_calories: 0,
      total_protein_g: 0,
      total_carbs_g: 0,
      total_fat_g: 0,
      items: []
    });
  } catch (error) {
    console.error('[Create Meal Error]', error);
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to create meal' });
  }
};

export const addMealItem = async (req: AuthRequest, res: Response) => {
  const user_id = req.user!.user_id;
  const rawMealId = Array.isArray(req.params.mealId) ? req.params.mealId[0] : req.params.mealId;
  const mealId = parseInt(rawMealId, 10);
  const { food_id, quantity_grams } = req.body;

  const foodId = Number(food_id);
  const quantity = Number(quantity_grams);

  if (isNaN(mealId) || mealId <= 0) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid mealId' });
  }

  try {
    const meal = await prisma.meals.findUnique({
      where: { meal_id: mealId }
    });

    if (!meal) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Meal not found' });
    }

    if (meal.user_id !== user_id) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'You do not have permission to modify this meal' });
    }

    const food = await prisma.food_items.findUnique({
      where: { food_id: foodId },
      include: {
        food_nutrients: {
          include: { nutrient: true }
        }
      }
    });

    if (!food) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Food item not found' });
    }

    // Calculate calories for this item
    const energyNutrient = food.food_nutrients.find(n =>
      n.nutrient_id === 1 || n.nutrient?.name?.toLowerCase() === 'energy' || n.nutrient?.name?.toLowerCase() === 'calories'
    );
    const estimated_calories = energyNutrient ? (Number(energyNutrient.value_per_100g) / 100) * quantity : 0;

    let updatedMeal: any;

    await prisma.$transaction(async (tx) => {
      // 1. Create the new meal item
      await tx.meal_items.create({
        data: {
          meal_id: mealId,
          food_id: foodId,
          quantity_grams: quantity,
          estimated_calories: estimated_calories,
          user_corrected: true
        }
      });

      // 2. Fetch all items in meal to recalculate totals
      const allItems = await tx.meal_items.findMany({
        where: { meal_id: mealId },
        include: {
          food: {
            include: {
              food_nutrients: {
                include: { nutrient: true }
              }
            }
          }
        }
      });

      let totalCal = 0, totalPro = 0, totalCarb = 0, totalFat = 0;
      for (const item of allItems) {
        const qtyMultiplier = Number(item.quantity_grams) / 100;
        const energy = item.food.food_nutrients.find(n => n.nutrient_id === 1 || n.nutrient?.name?.toLowerCase() === 'energy' || n.nutrient?.name?.toLowerCase() === 'calories');
        const protein = item.food.food_nutrients.find(n => n.nutrient_id === 2 || n.nutrient?.name?.toLowerCase() === 'protein');
        const carbs = item.food.food_nutrients.find(n => n.nutrient_id === 3 || n.nutrient?.name?.toLowerCase() === 'carbohydrate' || n.nutrient?.name?.toLowerCase() === 'carbs');
        const fat = item.food.food_nutrients.find(n => n.nutrient_id === 4 || n.nutrient?.name?.toLowerCase() === 'fat' || n.nutrient?.name?.toLowerCase() === 'total lipid (fat)');

        if (energy) totalCal += Number(energy.value_per_100g) * qtyMultiplier;
        if (protein) totalPro += Number(protein.value_per_100g) * qtyMultiplier;
        if (carbs) totalCarb += Number(carbs.value_per_100g) * qtyMultiplier;
        if (fat) totalFat += Number(fat.value_per_100g) * qtyMultiplier;
      }

      // 3. Update parent meal totals
      updatedMeal = await tx.meals.update({
        where: { meal_id: mealId },
        data: {
          total_calories: totalCal,
          total_protein_g: totalPro,
          total_carbs_g: totalCarb,
          total_fat_g: totalFat
        },
        include: {
          meal_items: {
            include: { food: true }
          }
        }
      });

      // 4. Ensure daily_logs row exists
      const profile = await tx.user_profiles.findUnique({ where: { user_id } });
      const targetCalories = profile ? Number(profile.daily_calorie_target) : 2000;

      await tx.$executeRaw`
        INSERT INTO public.daily_logs (
          user_id, log_date, target_calories, total_calories, total_protein_g, total_carbs_g, total_fat_g, calories_burned, remaining_calories, steps
        ) VALUES (
          ${user_id}::INT,
          (${meal.logged_at}::timestamptz AT TIME ZONE 'UTC')::DATE,
          ${targetCalories}::NUMERIC,
          0, 0, 0, 0, 0,
          ${targetCalories}::NUMERIC,
          0
        )
        ON CONFLICT (user_id, log_date) DO NOTHING;
      `;

      // 5. Update daily_logs with raw SQL
      await tx.$executeRaw`
        UPDATE public.daily_logs
        SET total_calories = (
              SELECT COALESCE(SUM(m.total_calories), 0) FROM public.meals m
              WHERE m.user_id = ${meal.user_id} AND (m.logged_at AT TIME ZONE 'UTC')::DATE = (${meal.logged_at}::timestamptz AT TIME ZONE 'UTC')::DATE
            ),
            total_protein_g = (
              SELECT COALESCE(SUM(m.total_protein_g), 0) FROM public.meals m
              WHERE m.user_id = ${meal.user_id} AND (m.logged_at AT TIME ZONE 'UTC')::DATE = (${meal.logged_at}::timestamptz AT TIME ZONE 'UTC')::DATE
            ),
            total_carbs_g = (
              SELECT COALESCE(SUM(m.total_carbs_g), 0) FROM public.meals m
              WHERE m.user_id = ${meal.user_id} AND (m.logged_at AT TIME ZONE 'UTC')::DATE = (${meal.logged_at}::timestamptz AT TIME ZONE 'UTC')::DATE
            ),
            total_fat_g = (
              SELECT COALESCE(SUM(m.total_fat_g), 0) FROM public.meals m
              WHERE m.user_id = ${meal.user_id} AND (m.logged_at AT TIME ZONE 'UTC')::DATE = (${meal.logged_at}::timestamptz AT TIME ZONE 'UTC')::DATE
            ),
            remaining_calories = target_calories - (
              SELECT COALESCE(SUM(m.total_calories), 0) FROM public.meals m
              WHERE m.user_id = ${meal.user_id} AND (m.logged_at AT TIME ZONE 'UTC')::DATE = (${meal.logged_at}::timestamptz AT TIME ZONE 'UTC')::DATE
            ) + calories_burned
        WHERE user_id = ${meal.user_id} AND log_date = (${meal.logged_at}::timestamptz AT TIME ZONE 'UTC')::DATE;
      `;
    });

    const items = updatedMeal.meal_items.map((item: any) => ({
      item_id: item.item_id,
      food_id: item.food_id,
      food_name: item.food?.name || 'Unknown food',
      quantity_grams: Number(item.quantity_grams),
      estimated_calories: Number(item.estimated_calories),
      user_corrected: item.user_corrected,
      food: item.food
    }));

    return res.status(201).json({
      meal_id: updatedMeal.meal_id,
      meal_type: updatedMeal.meal_type,
      total_calories: Number(updatedMeal.total_calories),
      total_protein_g: Number(updatedMeal.total_protein_g),
      total_carbs_g: Number(updatedMeal.total_carbs_g),
      total_fat_g: Number(updatedMeal.total_fat_g),
      items
    });
  } catch (error) {
    console.error('[Add Meal Item Error]', error);
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to add meal item' });
  }
};
