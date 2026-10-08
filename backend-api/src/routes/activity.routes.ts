import { Router } from 'express';
import {
  syncActivity,
  saveSleepActivity,
  estimateSleepActivity,
  getDashboard,
  getWeeklyActivity,
} from '../controllers/activityController';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { activitySyncSchema, sleepSyncSchema, sleepEstimateSchema } from '../schemas';

const router = Router();

router.use(authenticate);
router.post('/sync', validate(activitySyncSchema), syncActivity);
router.post('/sleep', validate(sleepSyncSchema), saveSleepActivity);
router.post('/sleep/estimate', validate(sleepEstimateSchema), estimateSleepActivity);
router.get('/dashboard', getDashboard);
router.get('/weekly', getWeeklyActivity);

export default router;
