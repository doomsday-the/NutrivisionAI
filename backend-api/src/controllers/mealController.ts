import { GoogleGenerativeAI } from '@google/generative-ai';
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import FormData from 'form-data';
import { AuthRequest } from '../middlewares/auth';
import crypto from 'crypto';

axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error: any) => {
    return (
      axiosRetry.isNetworkError(error) ||
      (error.response?.status ? error.response.status >= 500 : false)
    );
  },
  shouldResetTimeout: true,
});

const prisma = new PrismaClient();
interface NutritionEstimate {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

async function matchFoodInDb(
  label: string, 
  prisma: PrismaClient,
  nutritionEstimate?: NutritionEstimate
): Promise<{ food_id: number; name: string }> {
  const clean = label.replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
  const cleanLower = clean.toLowerCase();

  // 1. Exact match (case-insensitive)
  const exact: any[] = await prisma.$queryRaw`
    SELECT food_id, name FROM public.food_items
    WHERE is_active = true AND LOWER(name) = ${cleanLower}
    LIMIT 1
  `;
  if (exact.length > 0) return exact[0];

  // 2. Prefix or bracket match (e.g. "Burger" matches "Burger (beef)")
  const prefixMatch: any[] = await prisma.$queryRaw`
    SELECT food_id, name FROM public.food_items
    WHERE is_active = true AND (
      LOWER(name) LIKE ${cleanLower + ' (%'}
      OR LOWER(name) LIKE ${cleanLower + ' %'}
    )
    ORDER BY LENGTH(name) ASC
    LIMIT 1
  `;
  if (prefixMatch.length > 0) return prefixMatch[0];

  // 3. Exact phrase containment (e.g. "French Fries" matches "French Fries")
  const phraseMatch: any[] = await prisma.$queryRaw`
    SELECT food_id, name FROM public.food_items
    WHERE is_active = true AND LOWER(name) LIKE ${'%' + cleanLower + '%'}
    ORDER BY 
      CASE WHEN LOWER(name) = ${cleanLower} THEN 0
           WHEN LOWER(name) LIKE ${cleanLower + '%'} THEN 1
           ELSE 2 END,
      LENGTH(name) ASC
    LIMIT 1
  `;
  if (phraseMatch.length > 0) return phraseMatch[0];

  // 4. Multi-word search (all significant words must match)
  const stopWords = new Set(['and', 'with', 'the', 'for', 'in', 'cooked', 'fried', 'boiled', 'steamed', 'salad', 'fresh']);
  const words = cleanLower.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));

  if (words.length > 0) {
    const q = words.join(' & ');
    try {
      const ft: any[] = await prisma.$queryRaw`
        SELECT food_id, name, ts_rank(search_vector, to_tsquery('english', ${q})) as rank
        FROM public.food_items
        WHERE is_active = true AND search_vector @@ to_tsquery('english', ${q})
        ORDER BY rank DESC, LENGTH(name) ASC
        LIMIT 1
      `;
      if (ft.length > 0) return ft[0];
    } catch {}

    // Check if any major noun matches the start of a food name
    for (const w of words) {
      const nounMatch: any[] = await prisma.$queryRaw`
        SELECT food_id, name FROM public.food_items
        WHERE is_active = true AND (
          LOWER(name) = ${w}
          OR LOWER(name) LIKE ${w + ' (%'}
          OR LOWER(name) LIKE ${w + ' %'}
        )
        ORDER BY LENGTH(name) ASC
        LIMIT 1
      `;
      if (nounMatch.length > 0) return nounMatch[0];
    }
  }

  // 5. Dynamic Food Creation with Gemini Estimated Macros (DO NOT FALL BACK TO RICE)
  const cleanName = clean.length > 0 ? clean : label.trim();
  try {
    // 5a. Check if exact food item already exists
    const existing = await prisma.food_items.findFirst({
      where: { name: { equals: cleanName, mode: 'insensitive' } },
      select: { food_id: true, name: true }
    });
    if (existing) return { food_id: existing.food_id, name: existing.name };

    // 5b. Find or create a guaranteed valid source_id
    const sources: any[] = await prisma.$queryRaw`
      SELECT source_id FROM public.food_sources ORDER BY source_id ASC LIMIT 1
    `;
    let sourceId = sources.length > 0 ? Number(sources[0].source_id) : 1;
    if (sources.length === 0) {
      await prisma.$executeRaw`
        INSERT INTO public.food_sources (source_id, source_name, source_version)
        VALUES (1, 'NutriVision AI Dynamic', '2026')
        ON CONFLICT (source_id) DO NOTHING;
      `;
    }

    // 5c. Sync sequence before inserting
    await prisma.$executeRawUnsafe(
      `SELECT setval('food_items_food_id_seq', COALESCE((SELECT MAX(food_id) FROM public.food_items), 1))`
    ).catch(() => {});

    // 5d. Native PostgreSQL insert RETURNING food_id (bulletproof against ORM sequence issues)
    const inserted: any[] = await prisma.$queryRaw`
      INSERT INTO public.food_items (name, food_type, category_id, source_id, reference_unit, is_verified, is_active, created_at, updated_at)
      VALUES (${cleanName}, 'prepared', null, ${sourceId}, '100g', true, true, NOW(), NOW())
      RETURNING food_id, name;
    `;

    if (inserted && inserted.length > 0 && inserted[0].food_id) {
      const newFoodId = Number(inserted[0].food_id);

      const cals = Math.max(0, Number(nutritionEstimate?.calories) || 150);
      const pro = Math.max(0, Number(nutritionEstimate?.protein) || 5);
      const carbs = Math.max(0, Number(nutritionEstimate?.carbs) || 20);
      const fat = Math.max(0, Number(nutritionEstimate?.fat) || 5);

      const nutrients = [
        { id: 1, val: cals },
        { id: 2, val: pro },
        { id: 3, val: carbs },
        { id: 4, val: fat }
      ];

      for (const n of nutrients) {
        await prisma.$executeRaw`
          INSERT INTO public.food_nutrients (food_id, nutrient_id, value_per_100g)
          VALUES (${newFoodId}, ${n.id}, ${n.val})
          ON CONFLICT (food_id, nutrient_id) DO UPDATE SET value_per_100g = EXCLUDED.value_per_100g;
        `;
      }

      return { food_id: newFoodId, name: cleanName };
    }
  } catch (createErr: any) {
    console.error('[Dynamic Food Creation Error]', createErr?.message || createErr);
    const existing = await prisma.food_items.findFirst({
      where: { name: { equals: cleanName, mode: 'insensitive' } },
      select: { food_id: true, name: true }
    });
    if (existing) return { food_id: existing.food_id, name: existing.name };
  }

  // Safe fallback if dynamic creation fails: use an active food_id, but ALWAYS preserve the authentic cleanName!
  const genericFallback: any[] = await prisma.$queryRaw`
    SELECT food_id FROM public.food_items WHERE is_active = true LIMIT 1
  `;
  const safeFoodId = genericFallback[0]?.food_id || 12;
  return { food_id: safeFoodId, name: cleanName };
}

export const analyzeMeal = async (req: AuthRequest, res: Response) => {
  const file = req.file;
  const { meal_type } = req.body;
  const user_id = req.user!.user_id;

  if (!file) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Image file is required' });
  }

  const session_id = crypto.randomUUID();

  try {
    let detections: any[] = [];

    // Primary Detection: Resilient Gemini Multimodal Vision with Auto-Fallback
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      const candidateModels = [
        'gemini-3.5-flash-lite',
        'gemini-3.5-flash',
        'gemini-3.1-flash-lite',
        'gemini-3.8-flash'
      ];

      for (const mName of candidateModels) {
        if (detections.length > 0) break;
        for (const apiVer of [undefined, 'v1']) {
          if (detections.length > 0) break;
          try {
            const genAI = new GoogleGenerativeAI(geminiKey);
            const model = genAI.getGenerativeModel(
              { model: mName },
              apiVer ? { apiVersion: apiVer } : undefined
            );

          const prompt = `You are a world-class culinary computer vision and nutritional intelligence AI capable of recognizing any food, beverage, dish, or cuisine worldwide (Indian, Continental, Fast Food, Asian, Mediterranean, Healthy, Bakery, Beverages, etc.).
Analyze this meal image and return a JSON array of all distinct food and beverage items present on the plate or table.

For each item, specify:
- "detected_label": Clean, canonical food name (e.g. "French Fries", "Cheeseburger", "Masala Dosa", "Dal Makhani", "Coca Cola", "Caesar Salad", "Chicken Biryani", "Vanilla Ice Cream", "Omelette")
- "suggested_weight_grams": Realistic portion weight in grams (e.g. 150 for bowls/fries, 200 for burgers/sandwiches, 50 for rotis, 250 for drinks, 100 for sides)
- "confidence": number between 0.75 and 0.99
- "estimated_calories_per_100g": realistic kcal per 100g
- "estimated_protein_per_100g": realistic grams of protein per 100g
- "estimated_carbs_per_100g": realistic grams of carbohydrates per 100g
- "estimated_fat_per_100g": realistic grams of fat per 100g

CRITICAL: Return ONLY a valid JSON array. No markdown formatting, no code blocks, no other text.
Example format:
[
  {"detected_label": "French Fries", "suggested_weight_grams": 150, "confidence": 0.95, "estimated_calories_per_100g": 312, "estimated_protein_per_100g": 3.4, "estimated_carbs_per_100g": 41.4, "estimated_fat_per_100g": 14.7},
  {"detected_label": "Cheeseburger", "suggested_weight_grams": 220, "confidence": 0.95, "estimated_calories_per_100g": 263, "estimated_protein_per_100g": 15.0, "estimated_carbs_per_100g": 24.0, "estimated_fat_per_100g": 12.0}
]`;

          const imagePart = {
            inlineData: {
              data: file.buffer.toString('base64'),
              mimeType: file.mimetype || 'image/jpeg'
            }
          };

          const visionResult = await model.generateContent([prompt, imagePart]);
          const textResp = visionResult.response.text();

          let parsedItems: any[] = [];
          const jsonMatch = textResp.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            try {
              parsedItems = JSON.parse(jsonMatch[0]);
            } catch {}
          }
          if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
            try {
              const clean = textResp.replace(/```json/gi, '').replace(/```/g, '').trim();
              parsedItems = JSON.parse(clean);
            } catch {}
          }

          if (Array.isArray(parsedItems) && parsedItems.length > 0) {
            for (const item of parsedItems) {
              const label = (item.detected_label || '').trim();
              const lower = label.toLowerCase();
              if (!label || lower.includes('no food') || lower.includes('empty plate') || lower.includes('non-food')) {
                continue;
              }

              const nutritionEstimate = {
                calories: Number(item.estimated_calories_per_100g) || undefined,
                protein: Number(item.estimated_protein_per_100g) || undefined,
                carbs: Number(item.estimated_carbs_per_100g) || undefined,
                fat: Number(item.estimated_fat_per_100g) || undefined,
              };

              const dbMatch = await matchFoodInDb(label, prisma, nutritionEstimate);
              detections.push({
                detected_label: label, // Preserve the authentic food name detected by AI!
                matched_food_id: dbMatch.food_id,
                confidence: Number(item.confidence) || 0.95,
                suggested_weight_grams: Number(item.suggested_weight_grams) || 150,
                match_method: 'gemini_multimodal'
              });
            }
          }
        } catch (geminiErr: any) {
          console.warn(`[Gemini Vision model ${mName} (ver: ${apiVer}) error]:`, geminiErr.message);
        }
      }
    }
  }

    // Fallback Detection: Roboflow AI Service
    if (detections.length === 0) {
      try {
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

        detections = aiResponse.data?.detections || [];
      } catch (rfErr: any) {
        console.warn('[Roboflow Fallback error]:', rfErr.message);
      }
    }
    const sanitizedFilename = file.originalname ? file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_') : 'meal.jpg';
    const imageUrl = `/uploads/meals/${session_id}_${sanitizedFilename}`;

    // 2. Call Stored Procedure for atomic transaction
    // sp_log_meal(p_user_id INT, p_meal_type VARCHAR, p_image_url TEXT, p_detections JSONB, p_session_id VARCHAR)
    const result: any = await prisma.$queryRaw`
      CALL public.sp_log_meal(
        ${user_id}::INT,
        ${meal_type}::VARCHAR,
        ${imageUrl}::TEXT,
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

    const detectionMap = new Map<number, { name: string; confidence: number }>();
    for (const d of (detections || [])) {
      if (d.matched_food_id && d.detected_label) {
        detectionMap.set(d.matched_food_id, {
          name: d.detected_label,
          confidence: typeof d.confidence === 'number' ? d.confidence : 0.95
        });
      }
    }

    const items = meal.meal_items.map((item, idx) => {
      const origDet = detections && detections[idx] ? detections[idx] : null;
      const cached = detectionMap.get(item.food_id);
      const foodName = origDet?.detected_label || cached?.name || item.food?.name || 'Plate Component';
      const confidence = origDet?.confidence ?? cached?.confidence ?? 0.95;
      return {
        item_id: item.item_id,
        food_id: item.food_id,
        food_name: foodName,
        quantity_grams: Number(item.quantity_grams),
        estimated_calories: Number(item.estimated_calories),
        confidence,
        food: item.food ? { ...item.food, name: foodName } : { food_id: item.food_id, name: foodName }
      };
    });

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

    // new_food_id: if supplied, change food; otherwise keep existing food_id
    let foodId = mealItem.food_id;
    if (new_food_id !== undefined && new_food_id !== null && new_food_id !== '') {
      if (typeof new_food_id === 'number' && Number.isInteger(new_food_id) && new_food_id > 0) {
        foodId = new_food_id;
      } else if (typeof new_food_id === 'string' && /^\d+$/.test(new_food_id.trim())) {
        const parsed = parseInt(new_food_id.trim(), 10);
        if (parsed > 0) foodId = parsed;
        else return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid new_food_id' });
      } else {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid new_food_id' });
      }
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
      // 1. Ensure daily_logs row exists for today
      const profile = await tx.user_profiles.findUnique({ where: { user_id } });
      const targetCalories = profile ? Number(profile.daily_calorie_target) : 2000;

      await tx.$executeRaw`
        INSERT INTO public.daily_logs (
          user_id, log_date, target_calories, total_calories, total_protein_g, total_carbs_g, total_fat_g, calories_burned, remaining_calories, steps
        ) VALUES (
          ${user_id}::INT,
          (${meal.logged_at}::timestamptz AT TIME ZONE CURRENT_SETTING('timezone'))::DATE,
          ${targetCalories}::NUMERIC,
          0, 0, 0, 0, 0,
          ${targetCalories}::NUMERIC,
          0
        )
        ON CONFLICT (user_id, log_date) DO NOTHING;
      `;

      // 2. Update item
      await tx.meal_items.update({
        where: { item_id: itemId },
        data: {
          food_id: foodId,
          quantity_grams: quantity,
          estimated_calories: estimated_calories,
          user_corrected: true
        }
      });

      // 3. Delegate meal totals recalculation to SQL engine
      await tx.$executeRaw`
        UPDATE public.meals
        SET total_calories = (
              SELECT COALESCE(SUM(estimated_calories), 0)
              FROM public.meal_items
              WHERE meal_id = ${mealId}
            ),
            total_protein_g = (
              SELECT COALESCE(SUM((quantity_grams / 100.0) * fn.value_per_100g), 0)
              FROM public.meal_items mi
              JOIN public.food_nutrients fn ON mi.food_id = fn.food_id
              JOIN public.nutrient_types nt ON fn.nutrient_id = nt.nutrient_id
              WHERE mi.meal_id = ${mealId} AND nt.name ILIKE '%protein%'
            ),
            total_carbs_g = (
              SELECT COALESCE(SUM((quantity_grams / 100.0) * fn.value_per_100g), 0)
              FROM public.meal_items mi
              JOIN public.food_nutrients fn ON mi.food_id = fn.food_id
              JOIN public.nutrient_types nt ON fn.nutrient_id = nt.nutrient_id
              WHERE mi.meal_id = ${mealId} AND (nt.name ILIKE '%carbohydrate%' OR nt.name ILIKE '%carbs%')
            ),
            total_fat_g = (
              SELECT COALESCE(SUM((quantity_grams / 100.0) * fn.value_per_100g), 0)
              FROM public.meal_items mi
              JOIN public.food_nutrients fn ON mi.food_id = fn.food_id
              JOIN public.nutrient_types nt ON fn.nutrient_id = nt.nutrient_id
              WHERE mi.meal_id = ${mealId} AND (nt.name ILIKE '%fat%' OR nt.name ILIKE '%lipid%')
            )
        WHERE meal_id = ${mealId};
      `;

      // 3.5 Recalculate daily_logs via raw SQL to ensure totals are perfectly accurate
      await tx.$executeRaw`
        UPDATE public.daily_logs
        SET total_calories = (
              SELECT COALESCE(SUM(m.total_calories), 0) FROM public.meals m
              WHERE m.user_id = ${meal.user_id} AND (m.logged_at AT TIME ZONE CURRENT_SETTING('timezone'))::DATE = (${meal.logged_at}::timestamptz AT TIME ZONE CURRENT_SETTING('timezone'))::DATE
            ),
            total_protein_g = (
              SELECT COALESCE(SUM(m.total_protein_g), 0) FROM public.meals m
              WHERE m.user_id = ${meal.user_id} AND (m.logged_at AT TIME ZONE CURRENT_SETTING('timezone'))::DATE = (${meal.logged_at}::timestamptz AT TIME ZONE CURRENT_SETTING('timezone'))::DATE
            ),
            total_carbs_g = (
              SELECT COALESCE(SUM(m.total_carbs_g), 0) FROM public.meals m
              WHERE m.user_id = ${meal.user_id} AND (m.logged_at AT TIME ZONE CURRENT_SETTING('timezone'))::DATE = (${meal.logged_at}::timestamptz AT TIME ZONE CURRENT_SETTING('timezone'))::DATE
            ),
            total_fat_g = (
              SELECT COALESCE(SUM(m.total_fat_g), 0) FROM public.meals m
              WHERE m.user_id = ${meal.user_id} AND (m.logged_at AT TIME ZONE CURRENT_SETTING('timezone'))::DATE = (${meal.logged_at}::timestamptz AT TIME ZONE CURRENT_SETTING('timezone'))::DATE
            ),
            remaining_calories = target_calories - (
              SELECT COALESCE(SUM(m.total_calories), 0) FROM public.meals m
              WHERE m.user_id = ${meal.user_id} AND (m.logged_at AT TIME ZONE CURRENT_SETTING('timezone'))::DATE = (${meal.logged_at}::timestamptz AT TIME ZONE CURRENT_SETTING('timezone'))::DATE
            ) + calories_burned
        WHERE user_id = ${meal.user_id} AND log_date = (${meal.logged_at}::timestamptz AT TIME ZONE CURRENT_SETTING('timezone'))::DATE;
      `;

      // 4. Also log the correction in ai_match_log
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
              WHERE m.user_id = ${meal.user_id} AND (m.logged_at AT TIME ZONE CURRENT_SETTING('timezone'))::DATE = (${meal.logged_at}::timestamptz AT TIME ZONE CURRENT_SETTING('timezone'))::DATE
            ),
            total_protein_g = (
              SELECT COALESCE(SUM(m.total_protein_g), 0) FROM public.meals m
              WHERE m.user_id = ${meal.user_id} AND (m.logged_at AT TIME ZONE CURRENT_SETTING('timezone'))::DATE = (${meal.logged_at}::timestamptz AT TIME ZONE CURRENT_SETTING('timezone'))::DATE
            ),
            total_carbs_g = (
              SELECT COALESCE(SUM(m.total_carbs_g), 0) FROM public.meals m
              WHERE m.user_id = ${meal.user_id} AND (m.logged_at AT TIME ZONE CURRENT_SETTING('timezone'))::DATE = (${meal.logged_at}::timestamptz AT TIME ZONE CURRENT_SETTING('timezone'))::DATE
            ),
            total_fat_g = (
              SELECT COALESCE(SUM(m.total_fat_g), 0) FROM public.meals m
              WHERE m.user_id = ${meal.user_id} AND (m.logged_at AT TIME ZONE CURRENT_SETTING('timezone'))::DATE = (${meal.logged_at}::timestamptz AT TIME ZONE CURRENT_SETTING('timezone'))::DATE
            ),
            remaining_calories = target_calories - (
              SELECT COALESCE(SUM(m.total_calories), 0) FROM public.meals m
              WHERE m.user_id = ${meal.user_id} AND (m.logged_at AT TIME ZONE CURRENT_SETTING('timezone'))::DATE = (${meal.logged_at}::timestamptz AT TIME ZONE CURRENT_SETTING('timezone'))::DATE
            ) + calories_burned
        WHERE user_id = ${meal.user_id} AND log_date = (${meal.logged_at}::timestamptz AT TIME ZONE CURRENT_SETTING('timezone'))::DATE;
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
    const startOfDay = new Date(`${dateStr}T00:00:00+05:30`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999+05:30`);
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

    await prisma.$transaction(async (tx) => {
      // 1. Ensure daily_logs row exists for today
      const profile = await tx.user_profiles.findUnique({ where: { user_id } });
      const targetCalories = profile ? Number(profile.daily_calorie_target) : 2000;

      await tx.$executeRaw`
        INSERT INTO public.daily_logs (
          user_id, log_date, target_calories, total_calories, total_protein_g, total_carbs_g, total_fat_g, calories_burned, remaining_calories, steps
        ) VALUES (
          ${user_id}::INT,
          (${meal.logged_at}::timestamptz AT TIME ZONE CURRENT_SETTING('timezone'))::DATE,
          ${targetCalories}::NUMERIC,
          0, 0, 0, 0, 0,
          ${targetCalories}::NUMERIC,
          0
        )
        ON CONFLICT (user_id, log_date) DO NOTHING;
      `;

      // 2. Create the new meal item
      await tx.meal_items.create({
        data: {
          meal_id: mealId,
          food_id: foodId,
          quantity_grams: quantity,
          estimated_calories: estimated_calories,
          user_corrected: true
        }
      });

      // 3. Delegate meal totals recalculation to SQL engine
      await tx.$executeRaw`
        UPDATE public.meals
        SET total_calories = (
              SELECT COALESCE(SUM(estimated_calories), 0)
              FROM public.meal_items
              WHERE meal_id = ${mealId}
            ),
            total_protein_g = (
              SELECT COALESCE(SUM((quantity_grams / 100.0) * fn.value_per_100g), 0)
              FROM public.meal_items mi
              JOIN public.food_nutrients fn ON mi.food_id = fn.food_id
              JOIN public.nutrient_types nt ON fn.nutrient_id = nt.nutrient_id
              WHERE mi.meal_id = ${mealId} AND nt.name ILIKE '%protein%'
            ),
            total_carbs_g = (
              SELECT COALESCE(SUM((quantity_grams / 100.0) * fn.value_per_100g), 0)
              FROM public.meal_items mi
              JOIN public.food_nutrients fn ON mi.food_id = fn.food_id
              JOIN public.nutrient_types nt ON fn.nutrient_id = nt.nutrient_id
              WHERE mi.meal_id = ${mealId} AND (nt.name ILIKE '%carbohydrate%' OR nt.name ILIKE '%carbs%')
            ),
            total_fat_g = (
              SELECT COALESCE(SUM((quantity_grams / 100.0) * fn.value_per_100g), 0)
              FROM public.meal_items mi
              JOIN public.food_nutrients fn ON mi.food_id = fn.food_id
              JOIN public.nutrient_types nt ON fn.nutrient_id = nt.nutrient_id
              WHERE mi.meal_id = ${mealId} AND (nt.name ILIKE '%fat%' OR nt.name ILIKE '%lipid%')
            )
        WHERE meal_id = ${mealId};
      `;

      // 4. Recalculate daily_logs via raw SQL to ensure totals are perfectly accurate
      await tx.$executeRaw`
        UPDATE public.daily_logs
        SET total_calories = (
              SELECT COALESCE(SUM(m.total_calories), 0) FROM public.meals m
              WHERE m.user_id = ${meal.user_id} AND (m.logged_at AT TIME ZONE CURRENT_SETTING('timezone'))::DATE = (${meal.logged_at}::timestamptz AT TIME ZONE CURRENT_SETTING('timezone'))::DATE
            ),
            total_protein_g = (
              SELECT COALESCE(SUM(m.total_protein_g), 0) FROM public.meals m
              WHERE m.user_id = ${meal.user_id} AND (m.logged_at AT TIME ZONE CURRENT_SETTING('timezone'))::DATE = (${meal.logged_at}::timestamptz AT TIME ZONE CURRENT_SETTING('timezone'))::DATE
            ),
            total_carbs_g = (
              SELECT COALESCE(SUM(m.total_carbs_g), 0) FROM public.meals m
              WHERE m.user_id = ${meal.user_id} AND (m.logged_at AT TIME ZONE CURRENT_SETTING('timezone'))::DATE = (${meal.logged_at}::timestamptz AT TIME ZONE CURRENT_SETTING('timezone'))::DATE
            ),
            total_fat_g = (
              SELECT COALESCE(SUM(m.total_fat_g), 0) FROM public.meals m
              WHERE m.user_id = ${meal.user_id} AND (m.logged_at AT TIME ZONE CURRENT_SETTING('timezone'))::DATE = (${meal.logged_at}::timestamptz AT TIME ZONE CURRENT_SETTING('timezone'))::DATE
            ),
            remaining_calories = target_calories - (
              SELECT COALESCE(SUM(m.total_calories), 0) FROM public.meals m
              WHERE m.user_id = ${meal.user_id} AND (m.logged_at AT TIME ZONE CURRENT_SETTING('timezone'))::DATE = (${meal.logged_at}::timestamptz AT TIME ZONE CURRENT_SETTING('timezone'))::DATE
            ) + calories_burned
        WHERE user_id = ${meal.user_id} AND log_date = (${meal.logged_at}::timestamptz AT TIME ZONE CURRENT_SETTING('timezone'))::DATE;
      `;
    });

    const updatedMeal = await prisma.meals.findUnique({
      where: { meal_id: mealId },
      include: {
        meal_items: {
          include: { food: true }
        }
      }
    });

    if (!updatedMeal) {
      return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to retrieve updated meal' });
    }

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
