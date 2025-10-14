import 'dotenv/config';
import app from './src/app';
import { connectDB } from './src/config/db';
import { env } from './src/config/env';
import { verifyCloudinary } from './src/config/cloudinary';

async function main() {
  await connectDB();
  await verifyCloudinary();
  
  app.set('trust proxy', 1);
  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`🚀 API:     http://localhost:${env.PORT}/api`);
    console.log(`🏥 Health:  http://localhost:${env.PORT}/health`);
    console.log(`📊 Metrics: http://localhost:${env.PORT}/metrics`);
  });
}

main().catch((err) => {
  console.error('❌ Fatal bootstrap error:', err?.message);
  console.error(err?.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('🔥 Unhandled Promise Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('🔥 Uncaught Exception:', err);
});
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recibido. Cerrando...');
  process.exit(0);
});
process.on('SIGINT', () => {
  console.log('🛑 SIGINT (Ctrl+C). Cerrando...');
  process.exit(0);
});
