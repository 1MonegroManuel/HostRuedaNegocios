import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Usuario from '../models/usuario.model';

async function debugLogin() {
  console.log('🔍 Debugging login...');
  
  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/rueda';
  console.log(`📡 Conectando a: ${uri}`);
  
  await mongoose.connect(uri);
  console.log('✅ Conectado a MongoDB');

  // Buscar usuario
  const user = await Usuario.findOne({
    $or: [{ email: 'test@example.com' }, { username: 'testuser' }]
  });
  
  if (!user) {
    console.log('❌ Usuario no encontrado');
    return;
  }
  
  console.log('👤 Usuario encontrado:');
  console.log(`   Email: ${user.email}`);
  console.log(`   Username: ${user.username}`);
  console.log(`   PasswordHash: ${user.passwordHash}`);
  console.log(`   TipoUsuario: ${user.tipoUsuario}`);
  
  // Probar comparación de contraseña
  const password = 'password123';
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  console.log(`🔑 Password '${password}' matches: ${isMatch}`);
  
  // Probar hash directo
  const directHash = await bcrypt.hash(password, 10);
  const directMatch = await bcrypt.compare(password, directHash);
  console.log(`🔑 Direct hash comparison: ${directMatch}`);
  
  // Probar con contraseña diferente
  const wrongPassword = 'wrongpassword';
  const wrongMatch = await bcrypt.compare(wrongPassword, user.passwordHash);
  console.log(`🔑 Wrong password '${wrongPassword}' matches: ${wrongMatch}`);

  await mongoose.disconnect();
  console.log('🔌 Desconectado de MongoDB');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  debugLogin().catch(err => { console.error(err); process.exit(1); });
}

export default debugLogin;
