import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/profileController';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { profileUpdateSchema } from '../schemas';

const router = Router();

router.use(authenticate);
router.get('/', getProfile);
router.put('/', validate(profileUpdateSchema), updateProfile);

export default router;
