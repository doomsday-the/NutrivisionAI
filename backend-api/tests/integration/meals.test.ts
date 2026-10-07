import request from 'supertest';
import app from '../../src/server';
import { cleanDatabase, prisma } from '../helpers';

describe('Meals API', () => {
  let token: string;
  let user: any;

  beforeEach(async () => {
    await cleanDatabase();

    // Get dev user token
    const res = await request(app)
      .post('/api/auth/dev-login')
      .send();
    token = res.body.token;
    user = res.body.user;
    
    // Set a profile target
    await prisma.user_profiles.upsert({
      where: { user_id: user.user_id },
      create: {
        user_id: user.user_id,
        height_cm: 180,
        weight_kg: 80,
        activity_level: 'active',
        goal: 'maintain',
        daily_calorie_target: 2500
      },
      update: {
        height_cm: 180,
        weight_kg: 80,
        activity_level: 'active',
        goal: 'maintain',
        daily_calorie_target: 2500
      }
    });
  });

  it('should correct a meal item', async () => {
    // 1. Create a meal
    const meal = await prisma.meals.create({
      data: {
        user_id: user.user_id,
        meal_type: 'lunch',
        total_calories: 100
      }
    });

    // 2. Create a meal item
    const item = await prisma.meal_items.create({
      data: {
        meal_id: meal.meal_id,
        food_id: 12, // Rice
        quantity_grams: 100,
        estimated_calories: 100,
        user_corrected: false
      }
    });

    // 3. Call correction API to update to food 34 (Dal) with 200g
    const res = await request(app)
      .put(`/api/meals/${meal.meal_id}/items/${item.item_id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        new_food_id: 34,
        quantity_grams: 200
      });
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('meal_id', meal.meal_id);
    expect(res.body.items[0]).toHaveProperty('food_id', 34);
    expect(res.body.items[0]).toHaveProperty('quantity_grams', 200);
    expect(res.body.items[0]).toHaveProperty('user_corrected', true);
  });
});
