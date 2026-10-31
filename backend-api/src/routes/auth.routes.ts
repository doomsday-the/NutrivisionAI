import { Router } from 'express';
import { googleAuth, devLogin, companionLogin } from '../controllers/authController';
import { validate } from '../middlewares/validate';
import { googleAuthSchema } from '../schemas';

const router = Router();

router.post('/google', validate(googleAuthSchema), googleAuth);
router.post('/dev-login', devLogin);
router.post('/companion-login', companionLogin);

export default router;
