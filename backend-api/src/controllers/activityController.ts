import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';

const prisma = new PrismaClient();

export const syncActivity = async (req: AuthRequest, res: Response) => {
  try {
    const { log_date, steps, calories_burned } = req.body;
    const user_id = req.user!.user_id;

    // First ensure a profile exists to get the target calories
    const profile = await prisma.user_profiles.findUnique({ where: { user_id } });
    const target = profile ? Number(profile.daily_calorie_target) : 2000;

    // We must use raw SQL for upsert if we want the trigger to run safely or do it via Prisma upsert
    const logDateObj = new Date(log_date); // YYYY-MM-DD string

    const updatedLog = await prisma.daily_logs.upsert({
      where: { user_id_log_date: { user_id, log_date: logDateObj } },
      update: {
        steps,
        calories_burned,
        target_calories: target,
        // The remaining_calories is handled by the trigger or calculated in DB, but we can compute here for now
        remaining_calories: target - Number(prisma.daily_logs.fields.total_calories || 0) + calories_burned,
      },
      create: {
        user_id,
        log_date: logDateObj,
        steps,
        calories_burned,
        target_calories: target,
        total_calories: 0,
        total_protein_g: 0,
        total_carbs_g: 0,
        total_fat_g: 0,
        remaining_calories: target + calories_burned
      }
    });

    // To ensure accuracy with trigger, we refetch
    const finalLog = await prisma.daily_logs.findUnique({
      where: { log_id: updatedLog.log_id }
    });

    return res.status(200).json({
      log_date,
      steps: finalLog!.steps,
      calories_burned: Number(finalLog!.calories_burned),
      total_calories: Number(finalLog!.total_calories),
      remaining_calories: Number(finalLog!.remaining_calories),
      target_calories: Number(finalLog!.target_calories)
    });

  } catch (error) {
    console.error('[Activity Sync Error]', error);
    return res.status(500).json({ error: 'ACTIVITY_SYNC_FAILED', message: 'Failed to sync activity data.' });
  }
};

export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user!.user_id;
    let log_date = req.query.date as string;
    
    if (!log_date) {
      log_date = new Date().toISOString().split('T')[0];
    }
    const logDateObj = new Date(log_date);

    const [dailyLog, profile, meals] = await Promise.all([
      prisma.daily_logs.findUnique({
        where: { user_id_log_date: { user_id, log_date: logDateObj } }
      }),
      prisma.user_profiles.findUnique({ where: { user_id } }),
      prisma.meals.findMany({
        where: {
          user_id,
          logged_at: {
            gte: new Date(`${log_date}T00:00:00.000Z`),
            lt: new Date(`${log_date}T23:59:59.999Z`)
          }
        },
        select: {
          meal_id: true,
          meal_type: true,
          total_calories: true,
          logged_at: true
        },
        orderBy: { logged_at: 'asc' }
      })
    ]);

    const target = profile ? Number(profile.daily_calorie_target) : 2000;

    if (!dailyLog) {
      return res.status(200).json({
        date: log_date,
        target_calories: target,
        total_calories: 0,
        calories_burned: 0,
        remaining_calories: target,
        total_protein_g: 0,
        total_carbs_g: 0,
        total_fat_g: 0,
        steps: 0,
        meals: []
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
      steps: dailyLog.steps,
      meals: meals.map(m => ({
        ...m,
        total_calories: Number(m.total_calories)
      }))
    });

  } catch (error) {
    console.error('[Dashboard Error]', error);
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to load dashboard.' });
  }
};
