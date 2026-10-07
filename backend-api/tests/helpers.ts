import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export const cleanDatabase = async () => {
  // Delete all transactional data, but keep reference data (foods, nutrients, etc.)
  await prisma.$transaction([
    prisma.ai_match_log.deleteMany(),
    prisma.meal_items.deleteMany(),
    prisma.meals.deleteMany(),
    prisma.daily_logs.deleteMany(),
    prisma.user_profiles.deleteMany(),
    prisma.users.deleteMany(),
  ]);
};

export const disconnectDatabase = async () => {
  await prisma.$disconnect();
};
