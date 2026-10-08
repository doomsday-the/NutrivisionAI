import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';
import { estimateSleepCalories } from '../utils/calorieEstimates';

const prisma = new PrismaClient();

const toNullableNumber = (value: unknown): number | null => (
  value == null ? null : Number(value)
);

export const syncActivity = async (req: AuthRequest, res: Response) => {
  try {
    const {
      steps,
      calories_burned,
      activity_types,
      activity_type,
      sleep_hours,
      include_sleep_calories,
    } = req.body;
    const user_id = req.user!.user_id;
    const loggedAt = new Date();
    const log_date = req.body.log_date ?? loggedAt.toISOString().split('T')[0];

    const profile = await prisma.user_profiles.findUnique({ where: { user_id } });
    const target = profile?.daily_calorie_target == null
      ? 2000
      : Number(profile.daily_calorie_target);
    if (sleep_hours !== undefined
      && sleep_hours !== null
      && (!profile?.age || !profile.height_cm || !profile.weight_kg)) {
      return res.status(400).json({
        error: 'PROFILE_DETAILS_REQUIRED',
        message: 'Add your age, height, and weight to your profile before estimating sleep calories.',
      });
    }
    const requestedSleepCalories = sleep_hours == null
      ? null
      : estimateSleepCalories({
        age: profile!.age!,
        heightCm: Number(profile!.height_cm),
        weightKg: Number(profile!.weight_kg),
      }, sleep_hours);
    if (requestedSleepCalories !== null
      && (!Number.isFinite(requestedSleepCalories) || requestedSleepCalories < 0)) {
      return res.status(400).json({
        error: 'PROFILE_DETAILS_INVALID',
        message: 'Your profile details cannot produce a valid sleep-calorie estimate.',
      });
    }

    const date = new Date(`${log_date}T00:00:00.000Z`);
    const row = await prisma.$transaction(async (tx) => {
      const existing = await tx.daily_logs.findUnique({
        where: { user_id_log_date: { user_id, log_date: date } },
      });

      const activityTypes = activity_types !== undefined
        ? [...new Set(activity_types)]
        : activity_type !== undefined
          ? [activity_type]
          : existing?.activity_types ?? [];
      const sleepHours = sleep_hours === undefined
        ? existing?.sleep_hours ?? null
        : sleep_hours;
      const sleepCalories = sleep_hours === undefined
        ? Number(existing?.sleep_calories ?? 0)
        : sleep_hours === null
          ? 0
          : requestedSleepCalories!;
      const sleepConfirmed = sleep_hours === undefined
        ? existing?.sleep_calories_confirmed ?? false
        : sleep_hours !== null && include_sleep_calories === true;
      const activityCalories = calories_burned;
      const totalCaloriesBurned = activityCalories + sleepCalories;
      const dailyTarget = existing ? Number(existing.target_calories) : target;

      return tx.daily_logs.upsert({
        where: { user_id_log_date: { user_id, log_date: date } },
        create: {
          user_id,
          log_date: date,
          steps,
          activity_calories_burned: activityCalories,
          activity_types: activityTypes,
          sleep_hours: sleepHours,
          sleep_calories: sleepCalories,
          sleep_calories_confirmed: sleepConfirmed,
          activity_logged_at: loggedAt,
          calories_burned: totalCaloriesBurned,
          target_calories: target,
          remaining_calories: target + totalCaloriesBurned,
        },
        update: {
          steps,
          activity_calories_burned: activityCalories,
          activity_types: activityTypes,
          sleep_hours: sleepHours,
          sleep_calories: sleepCalories,
          sleep_calories_confirmed: sleepConfirmed,
          activity_logged_at: loggedAt,
          calories_burned: totalCaloriesBurned,
          remaining_calories: dailyTarget - Number(existing?.total_calories ?? 0) + totalCaloriesBurned,
        },
      });
    });

    return res.status(200).json({
      log_date,
      steps: Number(row.steps),
      calories_burned: Number(row.calories_burned),
      activity_types: row.activity_types,
      sleep_hours: toNullableNumber(row.sleep_hours),
      sleep_calories: Number(row.sleep_calories),
      sleep_calories_confirmed: row.sleep_calories_confirmed,
      activity_logged_at: row.activity_logged_at,
      total_calories: Number(row.total_calories),
      remaining_calories: Number(row.remaining_calories),
      target_calories: Number(row.target_calories)
    });

  } catch (error) {
    console.error('[Activity Sync Error]', error);
    return res.status(500).json({ error: 'ACTIVITY_SYNC_FAILED', message: 'Failed to sync activity data.' });
  }
};

export const saveSleepActivity = async (req: AuthRequest, res: Response) => {
  try {
    const { sleep_hours } = req.body;
    const user_id = req.user!.user_id;
    const loggedAt = new Date();
    const log_date = loggedAt.toISOString().split('T')[0];
    const logDate = new Date(`${log_date}T00:00:00.000Z`);
    const profile = await prisma.user_profiles.findUnique({ where: { user_id } });

    if (!profile?.age || !profile.height_cm || !profile.weight_kg) {
      return res.status(400).json({
        error: 'PROFILE_DETAILS_REQUIRED',
        message: 'Add your age, height, and weight to your profile before estimating sleep calories.',
      });
    }

    const sleepCalories = estimateSleepCalories({
      age: profile.age,
      heightCm: Number(profile.height_cm),
      weightKg: Number(profile.weight_kg),
    }, sleep_hours);
    if (!Number.isFinite(sleepCalories) || sleepCalories < 0) {
      return res.status(400).json({
        error: 'PROFILE_DETAILS_INVALID',
        message: 'Your profile details cannot produce a valid sleep-calorie estimate.',
      });
    }
    const target = profile.daily_calorie_target == null ? 2000 : Number(profile.daily_calorie_target);

    const row = await prisma.$transaction(async (tx) => {
      const [existing, mealTotals] = await Promise.all([
        tx.daily_logs.findUnique({
          where: { user_id_log_date: { user_id, log_date: logDate } },
        }),
        tx.meals.aggregate({
          where: {
            user_id,
            logged_at: {
              gte: logDate,
              lt: new Date(logDate.getTime() + 24 * 60 * 60 * 1000),
            },
          },
          _sum: {
            total_calories: true,
            total_protein_g: true,
            total_carbs_g: true,
            total_fat_g: true,
          },
        }),
      ]);
      const activityCalories = Number(existing?.activity_calories_burned ?? existing?.calories_burned ?? 0);
      const totalCaloriesBurned = activityCalories + sleepCalories;
      const totalCalories = Number(existing?.total_calories ?? mealTotals._sum.total_calories ?? 0);
      const targetCalories = existing ? Number(existing.target_calories) : target;

      return tx.daily_logs.upsert({
        where: { user_id_log_date: { user_id, log_date: logDate } },
        create: {
          user_id,
          log_date: logDate,
          steps: 0,
          activity_types: [],
          activity_calories_burned: 0,
          calories_burned: sleepCalories,
          sleep_hours,
          sleep_calories: sleepCalories,
          sleep_calories_confirmed: true,
          activity_logged_at: loggedAt,
          target_calories: target,
          total_calories: totalCalories,
          total_protein_g: Number(mealTotals._sum.total_protein_g ?? 0),
          total_carbs_g: Number(mealTotals._sum.total_carbs_g ?? 0),
          total_fat_g: Number(mealTotals._sum.total_fat_g ?? 0),
          remaining_calories: target - totalCalories + sleepCalories,
        },
        update: {
          activity_calories_burned: activityCalories,
          calories_burned: totalCaloriesBurned,
          sleep_hours,
          sleep_calories: sleepCalories,
          sleep_calories_confirmed: true,
          activity_logged_at: loggedAt,
          remaining_calories: targetCalories - totalCalories + totalCaloriesBurned,
        },
      });
    });

    return res.status(200).json({
      log_date,
      activity_logged_at: row.activity_logged_at,
      steps: Number(row.steps),
      calories_burned: Number(row.calories_burned),
      activity_calories_burned: Number(row.activity_calories_burned),
      sleep_hours: toNullableNumber(row.sleep_hours),
      sleep_calories: Number(row.sleep_calories),
      sleep_calories_confirmed: row.sleep_calories_confirmed,
      total_calories: Number(row.total_calories),
      remaining_calories: Number(row.remaining_calories),
      target_calories: Number(row.target_calories),
    });
  } catch (error) {
    console.error('[Sleep Activity Save Error]', error);
    return res.status(500).json({ error: 'SLEEP_ACTIVITY_SAVE_FAILED', message: 'Failed to save sleep activity.' });
  }
};

export const estimateSleepActivity = async (req: AuthRequest, res: Response) => {
  try {
    const { sleep_hours } = req.body;
    const profile = await prisma.user_profiles.findUnique({
      where: { user_id: req.user!.user_id },
    });

    if (!profile?.age || !profile.height_cm || !profile.weight_kg) {
      return res.status(400).json({
        error: 'PROFILE_DETAILS_REQUIRED',
        message: 'Add your age, height, and weight to your profile before estimating sleep calories.',
      });
    }

    const estimated_calories = estimateSleepCalories({
      age: profile.age,
      heightCm: Number(profile.height_cm),
      weightKg: Number(profile.weight_kg),
    }, sleep_hours);

    if (!Number.isFinite(estimated_calories) || estimated_calories < 0) {
      return res.status(400).json({
        error: 'PROFILE_DETAILS_INVALID',
        message: 'Your profile details cannot produce a valid sleep-calorie estimate.',
      });
    }

    return res.status(200).json({ sleep_hours, estimated_calories });
  } catch (error) {
    console.error('[Sleep Activity Estimate Error]', error);
    return res.status(500).json({ error: 'SLEEP_ACTIVITY_ESTIMATE_FAILED', message: 'Failed to estimate sleep calories.' });
  }
};

export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user!.user_id;
    let log_date = req.query.date as string | undefined;
    if (!log_date) {
      log_date = new Date().toISOString().split('T')[0];
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
        has_activity_log: false,
        target_calories: target,
        total_calories: mealCalories,
        calories_burned: 0,
        activity_types: [],
        sleep_hours: null,
        sleep_calories: 0,
        sleep_calories_confirmed: false,
        activity_logged_at: null,
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
      has_activity_log: true,
      target_calories: Number(dailyLog.target_calories),
      total_calories: Number(dailyLog.total_calories),
      calories_burned: Number(dailyLog.calories_burned),
      activity_types: dailyLog.activity_types ?? [],
      sleep_hours: toNullableNumber(dailyLog.sleep_hours),
      sleep_calories: Number(dailyLog.sleep_calories ?? 0),
      sleep_calories_confirmed: dailyLog.sleep_calories_confirmed ?? false,
      activity_logged_at: dailyLog.activity_logged_at?.toISOString() ?? null,
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
