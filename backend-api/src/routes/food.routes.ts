import { Router } from 'express';
import { searchFoods } from '../controllers/foodController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/search', searchFoods);

export default router;
