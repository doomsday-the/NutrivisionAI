import { Response } from 'express';
import { PrismaClient, user_profiles } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';
import {
  calculateMifflinStJeorBmr,
  calculateRecommendedCalorieTarget,
  calculateRecommendedSteps,
} from '../utils/calorieEstimates';

const prisma = new PrismaClient();

const toNullableNumber = (value: unknown): number | null => (
  value == null ? null : Number(value)
);

const serializeProfile = (profile: user_profiles) => {
  const age = profile.age;
  const heightCm = toNullableNumber(profile.height_cm);
  const weightKg = toNullableNumber(profile.weight_kg);
  const recommendedCalories = age !== null && heightCm !== null && weightKg !== null
    ? calculateRecommendedCalorieTarget({
      age,
      heightCm,
      weightKg,
      activityLevel: profile.activity_level,
      goal: profile.goal,
    })
    : null;
  const recommendedSteps = calculateRecommendedSteps(age, profile.activity_level);
  const calorieOverride = toNullableNumber(profile.daily_calorie_target_override);
  const stepsOverride = profile.daily_steps_target_override;

  return {
    age,
    height_cm: heightCm,
    weight_kg: weightKg,
    activity_level: profile.activity_level,
    goal: profile.goal,
    recommended_daily_calorie_target: recommendedCalories,
    daily_calorie_target: calorieOverride
      ?? toNullableNumber(profile.daily_calorie_target)
      ?? recommendedCalories
      ?? 2000,
    daily_calorie_target_override: calorieOverride,
    recommended_daily_steps_target: recommendedSteps,
    daily_steps_target: stepsOverride ?? recommendedSteps ?? 10000,
    daily_steps_target_override: stepsOverride,
  };
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.users.findUnique({
      where: { user_id: req.user!.user_id },
      include: { profile: true },
    });

    if (!user) return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });

    return res.status(200).json({
      user_id: user.user_id,
      email: user.email,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      role: user.role,
      profile: user.profile ? serializeProfile(user.profile) : null,
    });
  } catch (error) {
    console.error('[Profile Load Error]', error);
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch profile' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const {
      age,
      height_cm,
      weight_kg,
      activity_level,
      goal,
      daily_calorie_target_override,
      daily_steps_target_override,
    } = req.body;
    const user_id = req.user!.user_id;
    const existing = await prisma.user_profiles.findUnique({ where: { user_id } });

    const profileAge = age ?? existing?.age ?? null;
    const profileHeightCm = height_cm ?? toNullableNumber(existing?.height_cm);
    const profileWeightKg = weight_kg ?? toNullableNumber(existing?.weight_kg);
    const profileActivityLevel = activity_level ?? existing?.activity_level ?? null;
    const profileGoal = goal ?? existing?.goal ?? null;
    const calorieOverride = daily_calorie_target_override === undefined
      ? toNullableNumber(existing?.daily_calorie_target_override)
      : daily_calorie_target_override;
    const stepsOverride = daily_steps_target_override === undefined
      ? existing?.daily_steps_target_override ?? null
      : daily_steps_target_override;
    const recommendedCalories = profileAge !== null
      && profileHeightCm !== null
      && profileWeightKg !== null
      ? calculateRecommendedCalorieTarget({
        age: profileAge,
        heightCm: profileHeightCm,
        weightKg: profileWeightKg,
        activityLevel: profileActivityLevel,
        goal: profileGoal,
      })
      : null;
    const targetCalories = calorieOverride
      ?? recommendedCalories
      ?? toNullableNumber(existing?.daily_calorie_target)
      ?? 2000;

    const updated = await prisma.user_profiles.upsert({
      where: { user_id },
      update: {
        age: profileAge,
        height_cm: profileHeightCm,
        weight_kg: profileWeightKg,
        activity_level: profileActivityLevel,
        goal: profileGoal,
        daily_calorie_target: targetCalories,
        daily_calorie_target_override: calorieOverride,
        daily_steps_target_override: stepsOverride,
      },
      create: {
        user_id,
        age: profileAge,
        height_cm: profileHeightCm,
        weight_kg: profileWeightKg,
        activity_level: profileActivityLevel,
        goal: profileGoal,
        daily_calorie_target: targetCalories,
        daily_calorie_target_override: calorieOverride,
        daily_steps_target_override: stepsOverride,
      },
    });

    const user = await prisma.users.findUnique({ where: { user_id } });
    if (!user) return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });

    return res.status(200).json({
      user_id: user.user_id,
      email: user.email,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      role: user.role,
      profile: serializeProfile(updated),
    });
  } catch (error) {
    console.error('[Profile Update Error]', error);
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to update profile' });
  }
};
