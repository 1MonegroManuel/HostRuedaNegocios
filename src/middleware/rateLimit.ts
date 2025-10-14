import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => ['/health','/metrics','/api/health','/api'].some(p => req.path.startsWith(p)),
  message: { success: false, error: 'Demasiadas solicitudes, intenta de nuevo más tarde.' }
});
