import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';

const prisma = new PrismaClient();

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.users.findUnique({
      where: { user_id: req.user!.user_id },
      include: { profile: true }
    });

    if (!user) return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });

    res.status(200).json({
      user_id: user.user_id,
      email: user.email,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      profile: user.profile ? {
        age: user.profile.age,
        height_cm: Number(user.profile.height_cm),
        weight_kg: Number(user.profile.weight_kg),
        activity_level: user.profile.activity_level,
        goal: user.profile.goal,
        daily_calorie_target: Number(user.profile.daily_calorie_target)
      } : null
    });
  } catch (error) {
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch profile' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { age, height_cm, weight_kg, activity_level, goal } = req.body;
    
    // TDEE Calculation
    let target_calories = 2000; // default fallback
    if (age && height_cm && weight_kg && activity_level && goal) {
      // Mifflin-St Jeor (Male default per NFRs)
      let bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5;
      
      const multipliers: Record<string, number> = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9
      };
      
      let tdee = bmr * (multipliers[activity_level] || 1.2);
      
      if (goal === 'lose') target_calories = tdee - 300;
      else if (goal === 'gain') target_calories = tdee + 300;
      else target_calories = tdee;
    }

    const updated = await prisma.user_profiles.upsert({
      where: { user_id: req.user!.user_id },
      update: { age, height_cm, weight_kg, activity_level, goal, daily_calorie_target: target_calories },
      create: { user_id: req.user!.user_id, age, height_cm, weight_kg, activity_level, goal, daily_calorie_target: target_calories }
    });

    res.status(200).json({
      age: updated.age,
      height_cm: Number(updated.height_cm),
      weight_kg: Number(updated.weight_kg),
      activity_level: updated.activity_level,
      goal: updated.goal,
      daily_calorie_target: Number(updated.daily_calorie_target)
    });
  } catch (error) {
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to update profile' });
  }
};
