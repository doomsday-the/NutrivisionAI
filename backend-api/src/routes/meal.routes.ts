import { Router } from 'express';
import multer from 'multer';
import { analyzeMeal } from '../controllers/mealController';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { mealAnalyzeSchema } from '../schemas';

const router = Router();
const upload = multer({ 
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit (NFR-003)
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are allowed'));
    }
  }
});

router.use(authenticate);

// We run multer first, then validate the body via Zod, then controller
router.post(
  '/analyze', 
  upload.single('image'), 
  validate(mealAnalyzeSchema), 
  analyzeMeal
);

export default router;
