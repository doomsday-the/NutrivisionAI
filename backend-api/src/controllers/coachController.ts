import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();

/**
 * POST /api/coach/explain  &  GET /api/coach/daily-insight
 * Provides real-time Gemini AI nutrition coaching, actionable suggestions,
 * and smart macro/calorie metrics tailored to Indian cuisine and user goals.
 */
export const explainPlate = async (req: AuthRequest, res: Response) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'COACH_UNAVAILABLE',
        message: 'AI Coach is not configured. Set GEMINI_API_KEY to enable this feature.',
      });
    }

    const user_id = req.user!.user_id;

    // Pull params from body or query
    const body = req.body || {};
    let date = body.date || (req.query.date as string) || new Date().toLocaleDateString('en-CA');
    let total_calories = body.total_calories;
    let target_calories = body.target_calories;
    let total_protein_g = body.total_protein_g;
    let total_carbs_g = body.total_carbs_g;
    let total_fat_g = body.total_fat_g;
    let meals = body.meals;
    const user_question = body.user_question;

    // Fetch user profile for personalisation
    const [profile, user] = await Promise.all([
      prisma.user_profiles.findUnique({ where: { user_id } }),
      prisma.users.findUnique({ where: { user_id } }),
    ]);

    const goal = profile?.goal ?? 'maintain';
    const activityLevel = profile?.activity_level ?? 'moderate';
    const displayName = user?.display_name ?? 'Health Explorer';
    const defaultTarget = profile?.daily_calorie_target ? Number(profile.daily_calorie_target) : 2000;
    target_calories = target_calories ?? defaultTarget;

    // If meals or totals not supplied in body, query database directly
    if (!Array.isArray(meals) || total_calories === undefined) {
      const [dailyLogRows, mealsRows] = await Promise.all([
        prisma.$queryRaw<any[]>`
          SELECT * FROM public.daily_logs
          WHERE user_id = ${user_id} AND to_char(log_date, 'YYYY-MM-DD') = ${date}
          LIMIT 1
        `,
        prisma.$queryRaw<any[]>`
          SELECT meal_id, meal_type, total_calories, logged_at
          FROM public.meals
          WHERE user_id = ${user_id}
            AND logged_at >= ${date}::date
            AND logged_at < (${date}::date + interval '1 day')
          ORDER BY logged_at ASC
        `,
      ]);

      const log = dailyLogRows[0];
      const mealIds = mealsRows.map((m: any) => m.meal_id);

      let itemsByMeal: Record<number, any[]> = {};
      if (mealIds.length > 0) {
        const items = await prisma.meal_items.findMany({
          where: { meal_id: { in: mealIds } },
          include: { food: true },
        });
        for (const item of items) {
          if (!itemsByMeal[item.meal_id]) itemsByMeal[item.meal_id] = [];
          itemsByMeal[item.meal_id].push({
            name: item.food?.name,
            quantity_grams: Number(item.quantity_grams),
            calories: Number(item.estimated_calories),
          });
        }
      }

      meals = mealsRows.map((m: any) => ({
        meal_id: m.meal_id,
        meal_type: m.meal_type,
        total_calories: Number(m.total_calories || 0),
        logged_at: m.logged_at,
        items: itemsByMeal[m.meal_id] || [],
      }));

      if (log) {
        total_calories = Number(log.total_calories || 0);
        total_protein_g = Number(log.total_protein_g || 0);
        total_carbs_g = Number(log.total_carbs_g || 0);
        total_fat_g = Number(log.total_fat_g || 0);
        target_calories = Number(log.target_calories || target_calories);
      } else {
        total_calories = meals.reduce((sum: number, m: any) => sum + m.total_calories, 0);
        total_protein_g = total_protein_g ?? 0;
        total_carbs_g = total_carbs_g ?? 0;
        total_fat_g = total_fat_g ?? 0;
      }
    }

    const calorieGap = Math.round((target_calories ?? 2000) - (total_calories ?? 0));
    const calorieStatus = calorieGap > 0
      ? `${calorieGap} kcal remaining`
      : `${Math.abs(calorieGap)} kcal over target`;

    // Build structured meal summary with food names if available
    const mealSummary = Array.isArray(meals) && meals.length > 0
      ? meals.map((m: any) => {
          const itemList = m.items && m.items.length > 0
            ? ` (${m.items.map((i: any) => i.name || i.food_name).filter(Boolean).join(', ')})`
            : '';
          return `  • ${m.meal_type}: ${Math.round(m.total_calories)} kcal${itemList}`;
        }).join('\n')
      : '  • No meals logged yet today';

    const systemPrompt = `You are NutriCoach, an intelligent, encouraging AI nutritionist embedded in NutriVision — an Indian cuisine-focused nutrition engine.
You understand Indian food culture (dal, sabzi, roti, rice, paneer, sprouts, curd, idli, dosa, regional spices) and metabolic health.
You prioritize realistic, achievable advice.

IMPORTANT: Return your response in valid JSON format only, with no markdown code fences or backticks. Follow this exact JSON structure:
{
  "badge": "A short 2 to 4 word status badge (e.g., 'Protein Boost Needed', 'Optimal Pacing', 'Light & Balanced', 'Hydration Focus', 'Great Start')",
  "summary": "A 1 to 2 sentence executive briefing on the user's progress today.",
  "suggestions": [
    "Specific Indian food swap or addition suggestion 1 (e.g. Add 100g paneer or curd for a 12g protein boost)",
    "Specific suggestion 2",
    "Specific suggestion 3"
  ],
  "macro_critique": "A concise 1-sentence assessment of their protein, carb, and fat balance.",
  "next_meal_tip": "Specific, practical recommendation for what they should eat for their next meal.",
  "full_advice": "A cohesive 2 to 3 paragraph warm coaching commentary bringing it all together, ending with one motivating sentence."
}`;

    const userPrompt = `Here is ${displayName}'s nutrition snapshot for ${date}:

Daily Goal: ${goal === 'lose' ? 'Weight Loss' : goal === 'gain' ? 'Muscle Gain' : 'Maintenance'} | Activity Level: ${activityLevel}
Calories: ${Math.round(total_calories ?? 0)} / ${Math.round(target_calories ?? 2000)} kcal (${calorieStatus})
Macros: Protein ${Math.round(total_protein_g ?? 0)}g · Carbs ${Math.round(total_carbs_g ?? 0)}g · Fat ${Math.round(total_fat_g ?? 0)}g

Meals Logged:
${mealSummary}

${user_question ? `User Question: ${user_question}` : 'Task: Provide daily briefing, healthy Indian swaps, and smart suggestions for their next meal.'}

Return JSON only.`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const candidateModels = [
      process.env.GEMINI_MODEL || 'gemini-3.5-flash',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-3.1-flash-lite'
    ];

    let rawText = '';
    for (const mName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: mName }, { apiVersion: 'v1' });
        const result = await model.generateContent([
          { text: systemPrompt },
          { text: userPrompt },
        ]);
        rawText = result.response.text();
        if (rawText) break;
      } catch (mErr: any) {
        console.warn("[Coach model error]:", mErr.message);
      }
    }

    if (!rawText) {
      throw new Error('AI Coach is temporarily overloaded. Please try again shortly.');
    }

    // Parse structured JSON response with resilient fallback
    let parsed: any = null;
    try {
      const cleanJson = rawText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      // Fallback parser if output is plain text
      const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
      const bulletPoints = lines
        .filter((l) => l.trim().startsWith('•') || l.trim().startsWith('-') || l.trim().startsWith('*'))
        .map((l) => l.replace(/^[•\-*]\s*/, '').trim());

      parsed = {
        badge: calorieGap > 0 ? 'On Track' : 'Calorie Target Met',
        summary: lines[0] || `You've logged ${Math.round(total_calories ?? 0)} kcal today.`,
        suggestions: bulletPoints.length > 0
          ? bulletPoints.slice(0, 3)
          : [
              'Add a portion of protein (paneer, dal, sprouts, or eggs) to your next meal.',
              'Include a fresh bowl of cucumber and tomato salad for micronutrients.',
              'Choose whole grain flatbreads or brown rice for sustained energy.',
            ],
        macro_critique: `Protein: ${Math.round(total_protein_g ?? 0)}g, Carbs: ${Math.round(total_carbs_g ?? 0)}g, Fat: ${Math.round(total_fat_g ?? 0)}g.`,
        next_meal_tip: 'Focus on lean protein and colorful vegetables for your next plate.',
        full_advice: rawText,
      };
    }

    const advice = parsed.full_advice || rawText;

    return res.status(200).json({
      advice,
      badge: parsed.badge || 'NutriCoach AI Active',
      summary: parsed.summary || 'Daily nutrition briefing updated.',
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      macro_critique: parsed.macro_critique || calorieStatus,
      next_meal_tip: parsed.next_meal_tip || 'Keep up the healthy eating momentum!',
      context: {
        date,
        total_calories: Math.round(total_calories ?? 0),
        target_calories: Math.round(target_calories ?? 2000),
        remaining_calories: Math.round(calorieGap),
        calorie_status: calorieStatus,
        total_protein_g: Math.round(total_protein_g ?? 0),
        total_carbs_g: Math.round(total_carbs_g ?? 0),
        total_fat_g: Math.round(total_fat_g ?? 0),
        meals_count: Array.isArray(meals) ? meals.length : 0,
      },
    });

  } catch (error: any) {
    console.error('[Coach Error]', error?.message ?? error);
    return res.status(500).json({
      error: 'COACH_ERROR',
      message: 'The AI Coach encountered an issue. Please try again in a moment.',
    });
  }
};
