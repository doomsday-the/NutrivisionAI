import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import * as dotenv from 'dotenv';
// TODO: import routes

dotenv.config();

const app: Application = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/profile', profileRoutes);
// app.use('/api/meals', mealRoutes);
// app.use('/api/activity', activityRoutes);

// Global Error Handler (F-002, F-008, F-010 covered here)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Global Error]', err);
  
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: err.errors });
  }

  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred.',
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
