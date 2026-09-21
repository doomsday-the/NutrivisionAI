import { Router } from 'express';
import { googleAuth } from '../controllers/authController';
import { validate } from '../middlewares/validate';
import { googleAuthSchema } from '../schemas';

const router = Router();

router.post('/google', validate(googleAuthSchema), googleAuth);

export default router;
