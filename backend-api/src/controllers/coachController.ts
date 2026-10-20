import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();

/**
 * POST /api/coach/explain
 * Accepts the current day's nutrition snapshot and returns Gemini-powered dietary feedback.
 * Requires GEMINI_API_KEY env var.
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

    // Pull today's context from DB if not provided in body
    const {
      date,
      total_calories,
      target_calories,
      total_protein_g,
      total_carbs_g,
      total_fat_g,
      meals,
      user_question,
    } = req.body;

    // Fetch user profile for personalisation
    const profile = await prisma.user_profiles.findUnique({ where: { user_id } });
    const user = await prisma.users.findUnique({ where: { user_id } });

    const goal = profile?.goal ?? 'maintain';
    const activityLevel = profile?.activity_level ?? 'moderate';
    const displayName = user?.display_name ?? 'the user';

    // Build structured nutrition context
    const mealSummary = Array.isArray(meals) && meals.length > 0
      ? meals.map((m: any) => `  • ${m.meal_type}: ${Math.round(m.total_calories)} kcal`).join('\n')
      : '  • No meals logged yet today';

    const calorieGap = Math.round((target_calories ?? 2000) - (total_calories ?? 0));
    const calorieStatus = calorieGap > 0
      ? `${calorieGap} kcal remaining`
      : `${Math.abs(calorieGap)} kcal over target`;

    const systemPrompt = `You are NutriCoach, a warm, knowledgeable AI nutrition assistant embedded in NutriVision — a computer-vision meal tracking app for Indian cuisine.

You speak in a friendly, encouraging tone. You understand Indian food culture, spices, and regional dishes. 
You prioritise practical, achievable advice over perfection.
Keep responses concise — 3 to 5 short paragraphs max.
Use bullet points for healthy swap suggestions.
Always end with one motivating sentence.`;

    const userPrompt = `Here is ${displayName}'s nutrition snapshot for ${date ?? 'today'}:

**Daily Goal:** ${goal === 'lose' ? 'Weight Loss' : goal === 'gain' ? 'Muscle Gain' : 'Maintenance'} | Activity: ${activityLevel}
**Calories:** ${Math.round(total_calories ?? 0)} / ${Math.round(target_calories ?? 2000)} kcal (${calorieStatus})
**Macros:** Protein ${Math.round(total_protein_g ?? 0)}g · Carbs ${Math.round(total_carbs_g ?? 0)}g · Fat ${Math.round(total_fat_g ?? 0)}g

**Meals Logged:**
${mealSummary}

${user_question ? `**User's question:** ${user_question}` : '**Task:** Summarise this day\'s nutrition, flag any micro/macronutrient concerns, suggest 2-3 healthy food swaps or additions specific to Indian cuisine, and highlight what they did well.'}

Respond in plain text. Do not use markdown headers. Use bullet points only for swap suggestions.`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userPrompt },
    ]);

    const responseText = result.response.text();

    return res.status(200).json({
      advice: responseText,
      context: {
        date,
        total_calories: Math.round(total_calories ?? 0),
        target_calories: Math.round(target_calories ?? 2000),
        calorie_status: calorieStatus,
      },
    });

  } catch (error: any) {
    console.error('[Coach Error]', error?.message ?? error);
    // Graceful degradation — return a fallback tip rather than a cold 500
    return res.status(500).json({
      error: 'COACH_ERROR',
      message: 'The AI Coach encountered an issue. Please try again in a moment.',
    });
  }
};
