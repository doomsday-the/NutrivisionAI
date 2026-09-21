import { Router } from 'express';
import { googleAuth, devLogin } from '../controllers/authController';
import { validate } from '../middlewares/validate';
import { googleAuthSchema } from '../schemas';

const router = Router();

router.post('/google', validate(googleAuthSchema), googleAuth);
router.post('/dev-login', devLogin);

export default router;
