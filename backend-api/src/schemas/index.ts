import { z } from 'zod';

export const googleAuthSchema = z.object({
  body: z.object({
    id_token: z.string({ required_error: 'id_token is required' }),
  }),
});

export const mealAnalyzeSchema = z.object({
  body: z.object({
    meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack'], {
      required_error: 'meal_type is required',
      invalid_type_error: 'meal_type must be breakfast, lunch, dinner, or snack',
    }),
  }),
});

export const activitySyncSchema = z.object({
  body: z.object({
    log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'log_date must be YYYY-MM-DD'),
    steps: z.number().int().min(0, 'steps must be non-negative'),
    calories_burned: z.number().min(0, 'calories_burned must be non-negative'),
  }),
});

export const profileUpdateSchema = z.object({
  body: z.object({
    age: z.number().int().min(1, 'Age must be positive').optional(),
    height_cm: z.number().min(50).max(300).optional(),
    weight_kg: z.number().min(20).max(500).optional(),
    activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
    goal: z.enum(['lose', 'maintain', 'gain']).optional(),
  }),
});
