import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';

const prisma = new PrismaClient();

export const syncActivity = async (req: AuthRequest, res: Response) => {
  try {
    const { log_date, steps, calories_burned } = req.body;
    const user_id = req.user!.user_id;

    // Retrieve target calories from profile or default to 2000
    const profile = await prisma.user_profiles.findUnique({ where: { user_id } });
    const target = profile ? Number(profile.daily_calorie_target) : 2000;

    const result: any = await prisma.$queryRaw`
      INSERT INTO public.daily_logs (
        user_id, log_date, target_calories, total_calories, total_protein_g, total_carbs_g, total_fat_g, calories_burned, remaining_calories, steps
      ) VALUES (
        ${user_id}::INT,
        ${log_date}::DATE,
        ${target}::NUMERIC,
        0, 0, 0, 0,
        ${calories_burned}::NUMERIC,
        (${target}::NUMERIC + ${calories_burned}::NUMERIC),
        ${steps}::INT
      )
      ON CONFLICT (user_id, log_date) DO UPDATE SET
        steps = EXCLUDED.steps,
        calories_burned = EXCLUDED.calories_burned,
        remaining_calories = daily_logs.target_calories - daily_logs.total_calories + EXCLUDED.calories_burned
      RETURNING log_id, user_id, to_char(log_date, 'YYYY-MM-DD') AS log_date_str, steps, calories_burned, total_calories, remaining_calories, target_calories;
    `;

    const row = result[0];

    return res.status(200).json({
      log_date: row.log_date_str || log_date,
      steps: Number(row.steps),
      calories_burned: Number(row.calories_burned),
      total_calories: Number(row.total_calories),
      remaining_calories: Number(row.remaining_calories),
      target_calories: Number(row.target_calories)
    });

  } catch (error) {
    console.error('[Activity Sync Error]', error);
    return res.status(500).json({ error: 'ACTIVITY_SYNC_FAILED', message: 'Failed to sync activity data.' });
  }
};

export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user!.user_id;
    let log_date = req.query.date as string | undefined;
    if (!log_date) {
      log_date = new Date().toLocaleDateString('en-CA');
    }

    const profile = await prisma.user_profiles.findUnique({ where: { user_id } });
    const target = profile ? Number(profile.daily_calorie_target) : 2000;

    // Use raw SQL to query meals by local calendar date (stored as UTC but compared by date string)
    const [dailyLogRows, mealsRows] = await Promise.all([
      prisma.$queryRaw<any[]>`
        SELECT * FROM public.daily_logs
        WHERE user_id = ${user_id} AND to_char(log_date, 'YYYY-MM-DD') = ${log_date}
        LIMIT 1
      `,
      prisma.$queryRaw<any[]>`
        SELECT meal_id, meal_type, total_calories, logged_at
        FROM public.meals
        WHERE user_id = ${user_id}
          AND logged_at >= ${log_date}::date
          AND logged_at < (${log_date}::date + interval '1 day')
        ORDER BY logged_at ASC
      `
    ]);

    const dailyLog = dailyLogRows[0] || null;
    const meals = mealsRows.map((m: any) => ({
      meal_id: m.meal_id,
      meal_type: m.meal_type,
      total_calories: Number(m.total_calories || 0),
      logged_at: m.logged_at
    }));

    if (!dailyLog) {
      const mealCalories = meals.reduce((acc: number, m: any) => acc + Number(m.total_calories || 0), 0);
      return res.status(200).json({
        date: log_date,
        target_calories: target,
        total_calories: mealCalories,
        calories_burned: 0,
        remaining_calories: target - mealCalories,
        total_protein_g: 0,
        total_carbs_g: 0,
        total_fat_g: 0,
        steps: 0,
        meals
      });
    }

    return res.status(200).json({
      date: log_date,
      target_calories: Number(dailyLog.target_calories),
      total_calories: Number(dailyLog.total_calories),
      calories_burned: Number(dailyLog.calories_burned),
      remaining_calories: Number(dailyLog.remaining_calories),
      total_protein_g: Number(dailyLog.total_protein_g),
      total_carbs_g: Number(dailyLog.total_carbs_g),
      total_fat_g: Number(dailyLog.total_fat_g),
      steps: Number(dailyLog.steps),
      meals
    });

  } catch (error) {
    console.error('[Dashboard Error]', error);
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to load dashboard.' });
  }
};

export const getWeeklyActivity = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user!.user_id;
    let log_date = req.query.date as string | undefined;

    if (!log_date) {
      log_date = new Date().toISOString().split('T')[0];
    }
    
    // Get profile to determine target calories
    const profile = await prisma.user_profiles.findUnique({ where: { user_id } });
    const target = profile ? Number(profile.daily_calorie_target) : 2000;

    const endDate = new Date(`${log_date}T00:00:00.000Z`);
    const startDate = new Date(endDate.getTime() - 6 * 24 * 60 * 60 * 1000);

    const logs = await prisma.daily_logs.findMany({
      where: {
        user_id,
        log_date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { log_date: 'asc' }
    });

    const weeklyData = [];
    for (let i = 0; i <= 6; i++) {
      const current = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dayStr = current.toLocaleDateString('en-US', { weekday: 'short' });
      const log = logs.find(l => l.log_date.toISOString().startsWith(current.toISOString().split('T')[0]));
      
      weeklyData.push({
        day: dayStr,
        date: current.toISOString().split('T')[0],
        calories: log ? Number(log.total_calories) : 0,
        target: log ? Number(log.target_calories) : target
      });
    }

    return res.status(200).json(weeklyData);

  } catch (error) {
    console.error('[Weekly Activity Error]', error);
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to load weekly activity.' });
  }
};
