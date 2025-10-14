import cors from 'cors';
import { env } from './env';

const envAllowed = env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean);
const defaultAllowed = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:5176',
  'https://hostruedanegocios.onrender.com',
  'https://tu-frontend-en-render.com',
  'file://'
];

function isAllowed(origin?: string) {
  if (!origin) return true;
  if (envAllowed.includes(origin)) return true;
  if (defaultAllowed.includes(origin)) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/i.test(origin)) return true;
  return false;
}

export const corsMiddleware = cors({
  origin: (origin, cb) => isAllowed(origin || undefined) ? cb(null, true) : cb(new Error('Not allowed by CORS')),
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Expires'],
  credentials: false,
  optionsSuccessStatus: 204
});
