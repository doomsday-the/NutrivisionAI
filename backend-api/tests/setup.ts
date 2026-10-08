import { cleanDatabase, disconnectDatabase } from './helpers';

beforeAll(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
});
