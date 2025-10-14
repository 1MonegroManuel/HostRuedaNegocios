import mongoose from 'mongoose';
import { env } from './env';

export async function connectDB() {
  // 👉 imprime cada operación de Mongo en consola (solo en dev)
  if (env.NODE_ENV !== 'production') {
    mongoose.set('debug', { color: true });
  }

  // 👉 listeners de la conexión (estado + errores)
  mongoose.connection.on('connected', () => {
    console.log('🟢 [Mongo] connected');
  });
  mongoose.connection.on('reconnected', () => {
    console.log('🟡 [Mongo] reconnected');
  });
  mongoose.connection.on('disconnected', () => {
    console.log('🔴 [Mongo] disconnected');
  });
  mongoose.connection.on('error', (err) => {
    console.error('❌ [Mongo] connection error:', err.message);
  });

  await mongoose.connect(env.MONGODB_URI, { dbName: env.DB_NAME });
  console.log('✅ MongoDB Atlas conectado');
}
