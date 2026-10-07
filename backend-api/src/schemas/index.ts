import { z } from 'zod';

export const googleAuthSchema = z.object({
  body: z.object({
    id_token: z.string({ message: 'id_token is required' }),
  }),
});

export const mealAnalyzeSchema = z.object({
  body: z.object({
    meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack'], {
      message: 'meal_type must be breakfast, lunch, dinner, or snack',
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

export const deleteMealSchema = z.object({
  params: z.object({
    mealId: z.string().regex(/^\d+$/, 'mealId must be a positive integer'),
  }),
});

export const mealHistorySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/, 'page must be a positive integer').optional(),
    limit: z.string().regex(/^\d+$/, 'limit must be a positive integer').optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD').optional(),
  }),
});

export const createMealSchema = z.object({
  body: z.object({
    meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack'], {
      message: 'meal_type must be breakfast, lunch, dinner, or snack',
    }),
  }),
});

export const addMealItemSchema = z.object({
  params: z.object({
    mealId: z.string().regex(/^\d+$/, 'mealId must be a positive integer'),
  }),
  body: z.object({
    food_id: z.coerce.number().int().positive('food_id must be a positive integer'),
    quantity_grams: z.coerce.number().positive('quantity_grams must be greater than 0'),
  }),
});
