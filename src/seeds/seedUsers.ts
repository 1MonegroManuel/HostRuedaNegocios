import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Usuario from '../models/usuario.model';

type Rol = 'personal' | 'dueño' | 'admin';

async function upsertUser({
  nombre, apellido, email, username, password, telefono, tipoUsuario,
}: { 
  nombre: string; 
  apellido: string; 
  email: string; 
  username: string; 
  password: string; 
  telefono?: string;
  tipoUsuario: Rol; 
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
  console.log('🌱 Iniciando seed de usuarios...');
  
  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/rueda';
  console.log(`📡 Conectando a: ${uri}`);
  
  await mongoose.connect(uri);
  console.log('✅ Conectado a MongoDB');

  const created = [];
  
  // Crear usuarios admin (igual que en el test)
  created.push(await upsertUser({ 
    nombre: 'Jairo', 
    apellido: 'Test', 
    email: 'jairo@example.com', 
    username: 'jairo', 
    password: 'secret123', 
    telefono: '11111111',
    tipoUsuario: 'admin' 
  }));
  
  created.push(await upsertUser({ 
    nombre: 'Fabri', 
    apellido: 'Test', 
    email: 'fabri@example.com', 
    username: 'fabri', 
    password: 'secret123', 
    telefono: '11111111',
    tipoUsuario: 'admin' 
  }));
  
  created.push(await upsertUser({ 
    nombre: 'Jhosua', 
    apellido: 'Test', 
    email: 'jhosua@example.com', 
    username: 'jhosua', 
    password: 'secret123', 
    telefono: '11111111',
    tipoUsuario: 'admin' 
  }));

  // Crear usuario de prueba (igual que en el test)
  const pruebaUser = await upsertUser({
    nombre: 'Prueba',
    apellido: 'Uno',
    email: 'prueba1@example.com',
    username: 'prueba1',
    password: 'secret123',
    telefono: '70000000',
    tipoUsuario: 'personal',
  });
  created.push(pruebaUser);

  console.log('\n🔄 Iniciando flujo CRUD + cambio de roles...');
  
  // Flujo CRUD + cambio de roles (igual que en el test)
  if (pruebaUser) {
    console.log(`📖 1. Leer usuario: ${pruebaUser.email}`);
    const userRead = await Usuario.findById(pruebaUser._id);
    console.log(`   ✅ Usuario encontrado: ${userRead?.nombre} ${userRead?.apellido} (${userRead?.tipoUsuario})`);

    console.log(`✏️  2. Actualizar usuario (cambio de password y datos básicos)`);
    const updateData = {
      nombre: 'Prueba',
      apellido: 'Actualizada',
      telefono: '75555555',
      password: 'nuevaClave456',
      tipoUsuario: 'dueño' as Rol,
    };
    
    const passwordHash = await bcrypt.hash(updateData.password, 10);
    const userUpdated = await Usuario.findByIdAndUpdate(
      pruebaUser._id,
      {
        nombre: updateData.nombre.trim(),
        apellido: updateData.apellido.trim(),
        telefono: updateData.telefono,
        passwordHash,
        tipoUsuario: updateData.tipoUsuario,
      },
      { new: true, runValidators: true }
    );
    console.log(`   ✅ Usuario actualizado: ${userUpdated?.nombre} ${userUpdated?.apellido} (${userUpdated?.tipoUsuario})`);

    console.log(`📖 3. Leer nuevamente y verificar cambios`);
    const userReadAgain = await Usuario.findById(pruebaUser._id);
    console.log(`   ✅ Verificación: ${userReadAgain?.tipoUsuario} (debería ser 'dueño')`);

    console.log(`🔄 4. Cambiar a todos sus "estados" (roles): personal → dueño → admin`);
    
    // Cambiar a personal
    let userRoleChanged = await Usuario.findByIdAndUpdate(
      pruebaUser._id,
      { tipoUsuario: 'personal' },
      { new: true, runValidators: true }
    );
    console.log(`   ✅ Cambio a personal: ${userRoleChanged?.tipoUsuario}`);

    // Cambiar a dueño
    userRoleChanged = await Usuario.findByIdAndUpdate(
      pruebaUser._id,
      { tipoUsuario: 'dueño' },
      { new: true, runValidators: true }
    );
    console.log(`   ✅ Cambio a dueño: ${userRoleChanged?.tipoUsuario}`);

    // Cambiar a admin
    userRoleChanged = await Usuario.findByIdAndUpdate(
      pruebaUser._id,
      { tipoUsuario: 'admin' },
      { new: true, runValidators: true }
    );
    console.log(`   ✅ Cambio a admin: ${userRoleChanged?.tipoUsuario}`);

    // Verificación final
    const finalUser = await Usuario.findById(pruebaUser._id);
    console.log(`   ✅ Estado final: ${finalUser?.nombre} ${finalUser?.apellido} (${finalUser?.tipoUsuario})`);
  }

  console.log('\n📊 Resumen de usuarios:');
  created.forEach((user, index) => {
    console.log(`${index + 1}. ${user.nombre} ${user.apellido} (${user.email}) - ${user.tipoUsuario}`);
  });

  console.log(`\n🎉 Seed completado! ${created.length} usuarios procesados + flujo CRUD completo.`);
  await mongoose.disconnect();
  console.log('🔌 Desconectado de MongoDB');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(err => { console.error(err); process.exit(1); });
}

export default main;
