import request from 'supertest';
import app from '../../src/server'; // Need to make sure server.ts exports the app, not just starts listening
import { cleanDatabase, prisma } from '../helpers';

describe('Auth API', () => {
  beforeEach(async () => {
    await cleanDatabase();
    
    // Seed dev user manually if needed, but devLogin handles it if NODE_ENV=development
  });

  it('should authenticate dev user', async () => {
    const res = await request(app)
      .post('/api/auth/dev-login')
      .send();

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', 'dev@test.com');
  });

  it('should handle repeated dev logins gracefully without constraint violations', async () => {
    const res1 = await request(app)
      .post('/api/auth/dev-login')
      .send();
    expect(res1.status).toBe(200);

    const res2 = await request(app)
      .post('/api/auth/dev-login')
      .send();
    expect(res2.status).toBe(200);
    expect(res2.body.user.user_id).toBe(res1.body.user.user_id);
    expect(res2.body.user.email).toBe('dev@test.com');
  });
});
