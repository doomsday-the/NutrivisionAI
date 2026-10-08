import { Router } from 'express';
import { syncActivity, getDashboard, getWeeklyActivity } from '../controllers/activityController';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { activitySyncSchema } from '../schemas';

const router = Router();

router.use(authenticate);
router.post('/sync', validate(activitySyncSchema), syncActivity);
router.get('/dashboard', getDashboard);
router.get('/weekly', getWeeklyActivity);

export default router;
