import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import FormData from 'form-data';
import { AuthRequest } from '../middlewares/auth';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export const analyzeMeal = async (req: AuthRequest, res: Response) => {
  const file = req.file;
  const { meal_type } = req.body;
  const user_id = req.user!.user_id;

  if (!file) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Image file is required' });
  }

  const session_id = uuidv4();
  
  try {
    // 1. Call AI Service (TC-001) — forward image as multipart
    const formData = new FormData();
    formData.append('image', file.buffer, { filename: file.originalname, contentType: file.mimetype });
    formData.append('session_id', session_id);

    const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/predict`, formData, {
      headers: { 
        ...formData.getHeaders(),
        'X-Internal-Token': process.env.X_INTERNAL_TOKEN 
      },
      timeout: 30000 
    });

    const { detections } = aiResponse.data;

    // 2. Call Stored Procedure for atomic transaction
    // sp_log_meal(p_user_id INT, p_meal_type VARCHAR, p_image_url TEXT, p_detections JSONB, p_session_id VARCHAR)
    const result: any = await prisma.$queryRaw`
      CALL public.sp_log_meal(
        ${user_id}::INT, 
        ${meal_type}::VARCHAR, 
        ${'http://mock-image-url.com/img.jpg'}::TEXT, 
        ${JSON.stringify(detections)}::JSONB,
        ${session_id}::VARCHAR,
        null
      )
    `;

    // Wait, PostgreSQL procedures called via Prisma return void or require specific handling for OUT params.
    // To keep it simple and robust, we fetch the latest meal for this user.
    const meal = await prisma.meals.findFirst({
      where: { user_id },
      orderBy: { logged_at: 'desc' },
      include: {
        meal_items: {
          include: { food: true }
        }
      }
    });

    return res.status(201).json(meal);

  } catch (error: any) {
    console.error('[Meal Analyze Error]', error);
    
    // F-001: AI Service Timeout or 5xx
    if (error.code === 'ECONNABORTED' || (error.response && error.response.status >= 500)) {
      return res.status(503).json({ 
        error: 'AI_SERVICE_UNAVAILABLE', 
        message: 'Food detection is temporarily unavailable. Please try again.' 
      });
    }

    // F-002: Database Transaction Failure
    return res.status(500).json({ 
      error: 'MEAL_SAVE_FAILED', 
      message: 'We could not save your meal. Please try again.' 
    });
  }
};
