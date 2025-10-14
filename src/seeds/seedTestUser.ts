import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Usuario from '../models/usuario.model';

async function createTestUser() {
  console.log('🌱 Creando usuario de prueba...');
  
  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/rueda';
  console.log(`📡 Conectando a: ${uri}`);
  
  await mongoose.connect(uri);
  console.log('✅ Conectado a MongoDB');

  // Eliminar usuario existente si existe
  await Usuario.deleteOne({ username: 'testuser' });
  console.log('🗑️ Usuario anterior eliminado');

  // Crear nuevo usuario
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const user = await Usuario.create({
    nombre: 'Test',
    apellido: 'User',
    email: 'test@example.com',
    username: 'testuser',
    passwordHash,
    telefono: '12345678',
    tipoUsuario: 'admin'
  });

  console.log(`✅ Usuario creado: ${user.email} (${user.tipoUsuario})`);
  console.log(`📧 Email: ${user.email}`);
  console.log(`👤 Username: ${user.username}`);
  console.log(`🔑 Password: password123`);

  await mongoose.disconnect();
  console.log('🔌 Desconectado de MongoDB');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createTestUser().catch(err => { console.error(err); process.exit(1); });
}

export default createTestUser;
