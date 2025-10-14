import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Usuario from '../models/usuario.model';

async function createUser({
  nombre, apellido, email, username, password, telefono, tipoUsuario,
}: { 
  nombre: string; 
  apellido: string; 
  email: string; 
  username: string; 
  password: string; 
  telefono?: string;
  tipoUsuario: 'personal' | 'dueño' | 'admin'; 
}) {
  // Check if user already exists
  const exists = await Usuario.findOne({
    $or: [{ email: email.toLowerCase() }, { username: username }]
  });
  
  if (exists) {
    console.log(`⚠️  Usuario ya existe: ${email} o ${username}`);
    return exists;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);
  
  // Create user
  const user = await Usuario.create({
    nombre: nombre.trim(),
    apellido: apellido.trim(),
    email: email.toLowerCase(),
    username: username.trim(),
    passwordHash,
    telefono: telefono ?? null,
    tipoUsuario: tipoUsuario ?? 'personal'
  });

  console.log(`✅ Usuario creado: ${user.email} (${user.tipoUsuario})`);
  return user;
}

async function main() {
  console.log('🌱 Creando usuarios simples...');
  
  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/rueda';
  console.log(`📡 Conectando a: ${uri}`);
  
  await mongoose.connect(uri);
  console.log('✅ Conectado a MongoDB');

  const created = [];
  
  // Crear solo los 3 usuarios que necesitas
  created.push(await createUser({ 
    nombre: 'Jairo', 
    apellido: 'Gonzalez', 
    email: 'jairo@example.com', 
    username: 'jairo', 
    password: 'secret123', 
    telefono: '11111111',
    tipoUsuario: 'admin' 
  }));
  
  created.push(await createUser({ 
    nombre: 'Fabri', 
    apellido: 'Martinez', 
    email: 'fabri@example.com', 
    username: 'fabri', 
    password: 'secret123', 
    telefono: '22222222',
    tipoUsuario: 'admin' 
  }));
  
  created.push(await createUser({ 
    nombre: 'Jhosua', 
    apellido: 'Lopez', 
    email: 'jhosua@example.com', 
    username: 'jhosua', 
    password: 'secret123', 
    telefono: '33333333',
    tipoUsuario: 'admin' 
  }));

  console.log('\n📊 Usuarios creados:');
  created.forEach((user, index) => {
    console.log(`${index + 1}. ${user.nombre} ${user.apellido} (${user.email}) - ${user.tipoUsuario}`);
  });

  console.log(`\n🎉 Semilla completada! ${created.length} usuarios creados.`);
  await mongoose.disconnect();
  console.log('🔌 Desconectado de MongoDB');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(err => { console.error(err); process.exit(1); });
}

export default main;
