import { z } from 'zod';

// Solo lo realmente crítico obligatorio:
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),

  // App/JWT
  JWT_SECRET: z.string().min(16, 'JWT_SECRET debe tener al menos 16 caracteres').default(
    process.env.NODE_ENV === 'production'
      ? 'mi_jwt_secret_super_seguro_para_rueda_negocios_2024_minimo_32_caracteres'
      : 'default-jwt-secret-for-development-only'
  ),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // DB: en test no conectaremos a esto, pero tu schema puede exigir string; da default dummy
  MONGODB_URI: z.string().min(1).default(
    process.env.NODE_ENV === 'production'
      ? 'mongodb+srv://jg012119:cEfOpibMb2iFfrCs@cluster0.oyerk.mongodb.net/?retryWrites=true&w=majority'
      : 'mongodb://dummy/fake-tests'
  ),
  DB_NAME: z.string().default('rueda_negocios'),

  // CORS / límites
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000,https://hostruedanegocios.onrender.com,https://tu-frontend-en-render.com'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),

  // Cloudinary (opcionales si no los usas en todos lados)
  CLOUDINARY_CLOUD_NAME: z.string().default(''),
  CLOUDINARY_API_KEY: z.string().default(''),
  CLOUDINARY_API_SECRET: z.string().default(''),
  CLOUDINARY_FOLDER: z.string().default(''),
  UPLOAD_MAX_FILE_MB: z.coerce.number().default(10),

  // Email/Resend (opcionales)
  RESEND_API_KEY: z.string().default(''),
  GMAIL_USER: z.string().default(''),
  GMAIL_APP_PASSWORD: z.string().default(''),
});

export const env = schema.parse(process.env);
