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

  it('should delete a meal and update daily_logs accordingly', async () => {
    // 1. Create a meal with total_calories 250
    const today = new Date();
    const meal = await prisma.meals.create({
      data: {
        user_id: user.user_id,
        meal_type: 'lunch',
        total_calories: 250,
        logged_at: today
      }
    });

    await prisma.meal_items.create({
      data: {
        meal_id: meal.meal_id,
        food_id: 12,
        quantity_grams: 150,
        estimated_calories: 250
      }
    });

    // 2. The DB trigger automatically created daily_logs; update calories_burned to 100
    await prisma.daily_logs.updateMany({
      where: { user_id: user.user_id },
      data: {
        calories_burned: 100
      }
    });

    // 3. Delete the meal
    const res = await request(app)
      .delete(`/api/meals/${meal.meal_id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);

    // 4. Verify meal and items are gone
    const deletedMeal = await prisma.meals.findUnique({ where: { meal_id: meal.meal_id } });
    expect(deletedMeal).toBeNull();

    const items = await prisma.meal_items.findMany({ where: { meal_id: meal.meal_id } });
    expect(items).toHaveLength(0);

    // 5. Verify daily_logs was recalculated (total_calories = 0, remaining = 2500 - 0 + 100 = 2600)
    const dailyLog = await prisma.daily_logs.findFirst({
      where: { user_id: user.user_id }
    });
    expect(Number(dailyLog?.total_calories)).toBe(0);
    expect(Number(dailyLog?.remaining_calories)).toBe(2600);
  });

  it('should return 403 when trying to delete another user\'s meal', async () => {
    // Create another user
    const otherUser = await prisma.users.create({
      data: {
        google_id: 'other_google_id_test',
        email: 'other@example.com',
        display_name: 'Other User',
        password_hash: 'dummy_hash',
        last_login_at: new Date()
      }
    });

    const otherMeal = await prisma.meals.create({
      data: {
        user_id: otherUser.user_id,
        meal_type: 'breakfast',
        total_calories: 300
      }
    });

    const res = await request(app)
      .delete(`/api/meals/${otherMeal.meal_id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('FORBIDDEN');
  });

  it('should fetch paginated meal history', async () => {
    // Create 3 meals
    for (let i = 1; i <= 3; i++) {
      const m = await prisma.meals.create({
        data: {
          user_id: user.user_id,
          meal_type: 'snack',
          total_calories: 100 * i,
          logged_at: new Date(Date.now() - i * 60000)
        }
      });
      await prisma.meal_items.create({
        data: {
          meal_id: m.meal_id,
          food_id: 12,
          quantity_grams: 50,
          estimated_calories: 100 * i
        }
      });
    }

    // Page 1 with limit 2
    const res1 = await request(app)
      .get('/api/meals/history?page=1&limit=2')
      .set('Authorization', `Bearer ${token}`);

    expect(res1.status).toBe(200);
    expect(res1.body.meals).toHaveLength(2);
    expect(res1.body.pagination).toEqual({
      page: 1,
      limit: 2,
      total: 3,
      totalPages: 2
    });
    expect(res1.body.meals[0].items).toBeDefined();
    expect(res1.body.meals[0].items[0]).toHaveProperty('food_name');

    // Page 2 with limit 2
    const res2 = await request(app)
      .get('/api/meals/history?page=2&limit=2')
      .set('Authorization', `Bearer ${token}`);

    expect(res2.status).toBe(200);
    expect(res2.body.meals).toHaveLength(1);
  });

  it('should create a manual meal and add an item with recalculated totals', async () => {
    // 1. Create a manual meal
    const createRes = await request(app)
      .post('/api/meals')
      .set('Authorization', `Bearer ${token}`)
      .send({ meal_type: 'lunch' });

    expect(createRes.status).toBe(201);
    expect(createRes.body).toHaveProperty('meal_id');
    const mealId = createRes.body.meal_id;

    // 2. Add an item (food 12: Rice)
    const addItemRes = await request(app)
      .post(`/api/meals/${mealId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        food_id: 12,
        quantity_grams: 150
      });

    expect(addItemRes.status).toBe(201);
    expect(addItemRes.body.meal_id).toBe(mealId);
    expect(addItemRes.body.items).toHaveLength(1);
    expect(addItemRes.body.items[0].food_id).toBe(12);
    expect(addItemRes.body.items[0].quantity_grams).toBe(150);
    expect(Number(addItemRes.body.total_calories)).toBeGreaterThan(0);

    // 3. Verify daily_logs was created/updated
    const dailyLog = await prisma.daily_logs.findFirst({
      where: { user_id: user.user_id }
    });
    expect(dailyLog).not.toBeNull();
    expect(Number(dailyLog?.total_calories)).toBe(Number(addItemRes.body.total_calories));
  });

  it('should return 404 when attempting to delete a non-existent meal', async () => {
    const res = await request(app)
      .delete('/api/meals/999999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NOT_FOUND');
  });

  it('should filter meal history by date', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    // Create meal yesterday
    await prisma.meals.create({
      data: {
        user_id: user.user_id,
        meal_type: 'breakfast',
        total_calories: 200,
        logged_at: yesterday
      }
    });

    // Create meal today
    await prisma.meals.create({
      data: {
        user_id: user.user_id,
        meal_type: 'lunch',
        total_calories: 400,
        logged_at: new Date()
      }
    });

    // Query for yesterday only
    const res = await request(app)
      .get(`/api/meals/history?date=${yesterdayStr}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.meals).toHaveLength(1);
    expect(res.body.meals[0].meal_type).toBe('breakfast');

    // Query for today only
    const resToday = await request(app)
      .get(`/api/meals/history?date=${todayStr}`)
      .set('Authorization', `Bearer ${token}`);

    expect(resToday.status).toBe(200);
    expect(resToday.body.meals).toHaveLength(1);
    expect(resToday.body.meals[0].meal_type).toBe('lunch');

    // Query using start and end ISO strings (ADR-008)
    const startIso = new Date(yesterday.getTime() - 60000).toISOString();
    const endIso = new Date(yesterday.getTime() + 60000).toISOString();
    const resIso = await request(app)
      .get(`/api/meals/history?start=${startIso}&end=${endIso}`)
      .set('Authorization', `Bearer ${token}`);

    expect(resIso.status).toBe(200);
    expect(resIso.body.meals).toHaveLength(1);
    expect(resIso.body.meals[0].meal_type).toBe('breakfast');
  });

  it('should validate inputs when adding a meal item', async () => {
    const createRes = await request(app)
      .post('/api/meals')
      .set('Authorization', `Bearer ${token}`)
      .send({ meal_type: 'snack' });

    const mealId = createRes.body.meal_id;

    // Non-existent food item
    const resNonExistent = await request(app)
      .post(`/api/meals/${mealId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({ food_id: 999999, quantity_grams: 100 });

    expect(resNonExistent.status).toBe(404);

    // Invalid negative quantity
    const resInvalidQty = await request(app)
      .post(`/api/meals/${mealId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({ food_id: 12, quantity_grams: -50 });

    expect(resInvalidQty.status).toBe(400);
  });
});
