import { Router } from 'express';
import multer from 'multer';
import {
  analyzeMeal,
  correctMealItem,
  deleteMeal,
  getMealHistory,
  createMeal,
  addMealItem
} from '../controllers/mealController';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  mealAnalyzeSchema,
  mealHistorySchema,
  createMealSchema,
  addMealItemSchema,
  deleteMealSchema
} from '../schemas';

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

// Meal history (GET /api/meals/history)
router.get('/history', validate(mealHistorySchema), getMealHistory);

// Create manual meal (POST /api/meals)
router.post('/', validate(createMealSchema), createMeal);

// We run multer first, then validate the body via Zod, then controller
router.post(
  '/analyze',
  upload.single('image'),
  validate(mealAnalyzeSchema),
  analyzeMeal
);

// Add item to meal (POST /api/meals/:mealId/items)
router.post('/:mealId/items', validate(addMealItemSchema), addMealItem);

// Manual item correction (PUT /api/meals/:mealId/items/:itemId)
router.put('/:mealId/items/:itemId', correctMealItem);

// Delete meal (DELETE /api/meals/:mealId)
router.delete('/:mealId', validate(deleteMealSchema), deleteMeal);

export default router;
