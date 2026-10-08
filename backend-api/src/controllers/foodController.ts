import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';

const prisma = new PrismaClient();

export const searchFoods = async (req: AuthRequest, res: Response) => {
  try {
    const q = req.query.q as string;
    
    if (!q || q.trim().length === 0) {
      return res.status(200).json([]);
    }

    const searchQuery = `%${q}%`;

    // Try a simple ILIKE search first for simplicity and exact partial matches,
    // and if we need TSVECTOR we can use it. Since `tsvector` is 'Unsupported' in Prisma schema, 
    // it's best to query via raw SQL.
    const foods: any[] = await prisma.$queryRaw`
      SELECT 
        f.food_id,
        f.name,
        f.brand,
        f.reference_unit,
        s.source_name as source
      FROM food_items f
      LEFT JOIN food_sources s ON f.source_id = s.source_id
      WHERE f.is_active = true 
        AND (
          f.search_vector @@ plainto_tsquery('english', ${q}) 
          OR f.name ILIKE ${searchQuery}
        )
      ORDER BY 
        ts_rank(f.search_vector, plainto_tsquery('english', ${q})) DESC,
        f.name ASC
      LIMIT 20
    `;

    // Wait, the frontend probably expects food_nutrients as well.
    // Let's get the nutrient data for these foods using findMany.
    const foodIds = foods.map(f => f.food_id);
    
    if (foodIds.length === 0) {
      return res.status(200).json([]);
    }

    const detailedFoods = await prisma.food_items.findMany({
      where: {
        food_id: { in: foodIds }
      },
      take: 20,
      include: {
        food_nutrients: {
          include: {
            nutrient: true
          }
        },
        serving_sizes: true,
        source: true
      }
    });

    // Keep the ordering from the raw query
    const orderedFoods = foods.map(f => detailedFoods.find(df => df.food_id === f.food_id)).filter(Boolean);

    res.status(200).json(orderedFoods);
  } catch (error) {
    console.error('[Food Search Error]', error);
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Failed to search foods' });
  }
};
