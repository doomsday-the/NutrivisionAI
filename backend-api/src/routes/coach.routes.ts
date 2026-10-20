import { Router } from 'express';
import { explainPlate } from '../controllers/coachController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

/**
 * POST /api/coach/explain
 * Body: { date, total_calories, target_calories, total_protein_g, total_carbs_g, total_fat_g, meals[], user_question? }
 */
router.post('/explain', explainPlate);

export default router;
