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
    log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'log_date must be YYYY-MM-DD').optional(),
    steps: z.number().int().min(0, 'steps must be non-negative'),
    calories_burned: z.number().min(0, 'calories_burned must be non-negative'),
    activity_types: z.array(z.enum([
      'gym',
      'running',
      'jogging',
      'swimming',
      'football',
      'cycling',
      'walking',
      'other',
    ])).max(8).optional(),
    activity_type: z.enum([
      'gym',
      'running',
      'jogging',
      'swimming',
      'football',
      'cycling',
      'walking',
      'other',
    ]).optional(),
    sleep_hours: z.number().min(0.25).max(24).nullable().optional(),
    include_sleep_calories: z.boolean().optional(),
  }).superRefine((body, ctx) => {
    if (body.sleep_hours !== undefined && body.sleep_hours !== null && body.include_sleep_calories !== true) {
      ctx.addIssue({
        code: 'custom',
        path: ['include_sleep_calories'],
        message: 'Explicit confirmation is required to include sleep calories.',
      });
    }

    if (body.include_sleep_calories === true && (body.sleep_hours === undefined || body.sleep_hours === null)) {
      ctx.addIssue({
        code: 'custom',
        path: ['sleep_hours'],
        message: 'Sleep hours are required to include sleep calories.',
      });
    }
  }),
});

export const sleepSyncSchema = z.object({
  body: z.object({
    sleep_hours: z.number().min(0.25).max(24),
    include_sleep_calories: z.literal(true),
  }),
});

export const sleepEstimateSchema = z.object({
  body: z.object({
    sleep_hours: z.number().min(0.25).max(24),
  }),
});

export const profileUpdateSchema = z.object({
  body: z.object({
    age: z.number().int().min(1, 'Age must be positive').max(120, 'Age must be 120 or younger').optional(),
    height_cm: z.number().min(50).max(300).optional(),
    weight_kg: z.number().min(20).max(500).optional(),
    activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
    goal: z.enum(['lose', 'maintain', 'gain']).optional(),
    daily_calorie_target_override: z.number().min(500).max(10000).nullable().optional(),
    daily_steps_target_override: z.number().int().min(1000).max(50000).nullable().optional(),
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
    start: z.string().optional(),
    end: z.string().optional(),
  }),
});

export const createMealSchema = z.object({
  body: z.object({
    meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack'], {
      message: 'meal_type must be breakfast, lunch, dinner, or snack',
    }),
    notes: z.string().trim().max(255, 'Meal description must be 255 characters or fewer').optional(),
    total_calories: z.number().min(0, 'Calories must be non-negative').optional(),
    total_protein_g: z.number().min(0, 'Protein must be non-negative').optional(),
    total_carbs_g: z.number().min(0, 'Carbohydrates must be non-negative').optional(),
    total_fat_g: z.number().min(0, 'Fat must be non-negative').optional(),
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
