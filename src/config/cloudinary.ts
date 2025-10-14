import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

// Only configure Cloudinary if we have the required credentials
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

export async function verifyCloudinary() {
  // Skip Cloudinary verification in test environment or if credentials are missing
  if (env.NODE_ENV === 'test' || !env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    console.log('⏭️  Cloudinary verification skipped (test mode or missing credentials)');
    return;
  }

  const cloud = env.CLOUDINARY_CLOUD_NAME;
  try {
    const r = await cloudinary.api.ping(); // Admin API
    console.log(`☁️  Cloudinary conectado: cloud=${cloud} status=${r.status}`);
  } catch (err: any) {
    console.error('❌ Cloudinary no disponible:', err?.message || err);
  }
}

export { cloudinary };
