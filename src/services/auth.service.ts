import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Usuario, { UsuarioDoc } from '../models/usuario.model';
import { env } from '../config/env';
import { emailService } from './email.service';
import { notificacionService } from './notificacion.service';

export type JwtUser = { sub: string; role: 'personal'|'encargado'|'admin'; username: string; email: string };

function signAccessToken(user: UsuarioDoc) {
  const payload: JwtUser = { sub: String(user._id), role: user.tipoUsuario, username: user.username, email: user.email };
  const opts: SignOptions = { expiresIn: env.JWT_EXPIRES_IN };
  return jwt.sign(payload, env.JWT_SECRET, opts);
}

function signRefreshToken(user: UsuarioDoc) {
  const payload: JwtUser = { sub: String(user._id), role: user.tipoUsuario, username: user.username, email: user.email };
  const opts: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRES_IN };
  return jwt.sign(payload, env.JWT_SECRET, opts);
}

function sanitize(u: UsuarioDoc) {
  return {
    _id: u._id,
    nombre: u.nombre,
    apellido: u.apellido,
    email: u.email,
    username: u.username,
    telefono: u.telefono,
    tipoUsuario: u.tipoUsuario,
    creado_en: (u as any).creado_en,
    actualizado_en: (u as any).actualizado_en
  };
}

export async function register(data: {
  nombre: string; apellido: string; email: string; username: string; password: string;
  telefono?: string | null; tipoUsuario?: 'personal'|'encargado'|'admin';
}) {
  const exists = await Usuario.findOne({
    $or: [{ email: data.email.toLowerCase() }, { username: data.username }]
  });
  if (exists) throw new Error('Email o username ya registrados');

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await Usuario.create({
    nombre: data.nombre.trim(),
    apellido: data.apellido.trim(),
    email: data.email.toLowerCase(),
    username: data.username.trim(),
    passwordHash,
    telefono: data.telefono ?? null,
    tipoUsuario: data.tipoUsuario ?? 'personal'
  });

  return { user: sanitize(user), accessToken: signAccessToken(user), refreshToken: signRefreshToken(user) };
}

export async function login(identifier: string, password: string) {
  console.log('🔍 [AUTH] Searching for user with identifier:', identifier);
  const user = await Usuario.findOne({
    $or: [{ email: identifier.toLowerCase() }, { username: identifier }]
  });
  
  if (!user) {
    console.log('❌ [AUTH] User not found with identifier:', identifier);
    throw new Error('Credenciales inválidas');
  }
  
  console.log('✅ [AUTH] User found:', {
    id: user._id,
    email: user.email,
    username: user.username,
    tipoUsuario: user.tipoUsuario
  });

  console.log('🔍 [AUTH] Comparing password...');
  const ok = await bcrypt.compare(password, user.passwordHash);
  console.log('🔍 [AUTH] Password comparison result:', ok);
  
  if (!ok) {
    console.log('❌ [AUTH] Password mismatch for user:', user._id);
    throw new Error('Credenciales inválidas');
  }

  console.log('✅ [AUTH] Login successful for user:', user._id);
  return { user: sanitize(user), accessToken: signAccessToken(user), refreshToken: signRefreshToken(user) };
}

export async function refresh(refreshToken: string) {
  const payload = jwt.verify(refreshToken, env.JWT_SECRET) as JwtUser;
  const user = await Usuario.findById(payload.sub);
  if (!user) throw new Error('Usuario no encontrado');
  return { accessToken: signAccessToken(user) };
}

// Solicitar reset de contraseña
export async function requestPasswordReset(email: string) {
  const user = await Usuario.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Por seguridad, no revelamos si el email existe o no
    return { message: 'Si el email existe, se ha enviado un código de recuperación' };
  }

  // Generar código de 6 dígitos
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Guardar código en el usuario (en producción, usar Redis con expiración)
  user.resetPasswordCode = resetCode;
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
  await user.save();

  // Enviar email con el código
  try {
    await emailService.sendPasswordResetEmail(email, resetCode);
    console.log(`✅ Email de recuperación enviado a ${email}`);
  } catch (error) {
    console.error(`❌ Error enviando email a ${email}:`, error);
    // No fallar la operación si el email falla, solo loguear el error
  }

  // También mostrar en consola para debugging
  console.log(`🔑 Código de reset para ${email}: ${resetCode}`);

  return { message: 'Si el email existe, se ha enviado un código de recuperación' };
}

// Resetear contraseña
export async function resetPassword(token: string, newPassword: string) {
  const user = await Usuario.findOne({
    resetPasswordCode: token,
    resetPasswordExpires: { $gt: new Date() }
  });

  if (!user) {
    throw new Error('Código inválido o expirado');
  }

  // Hash de la nueva contraseña
  const passwordHash = await bcrypt.hash(newPassword, 10);
  
  // Actualizar contraseña y limpiar código
  user.passwordHash = passwordHash;
  user.resetPasswordCode = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return { message: 'Contraseña restablecida exitosamente' };
}

// Generar credenciales automáticas para empleados
export function generateEmployeeCredentials(nombre: string, apellido: string, email: string) {
  // Generar username basado en nombre y apellido
  const usernameBase = `${nombre.toLowerCase().trim()}${apellido.toLowerCase().trim()}`.replace(/[^a-z]/g, '');
  const username = `${usernameBase}${Math.floor(Math.random() * 1000)}`;
  
  // Generar password aleatorio
  const password = Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 1000);
  
  return { username, password };
}

// Crear empleado con credenciales automáticas
export async function createEmployee(data: {
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string | null;
  empresaId?: string;
  empresaNombre?: string;
}) {
  const { username, password } = generateEmployeeCredentials(data.nombre, data.apellido, data.email);
  
  const exists = await Usuario.findOne({
    $or: [{ email: data.email.toLowerCase() }, { username }]
  });
  if (exists) throw new Error('Email o username ya registrados');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await Usuario.create({
    nombre: data.nombre.trim(),
    apellido: data.apellido.trim(),
    email: data.email.toLowerCase(),
    username,
    passwordHash,
    telefono: data.telefono ?? null,
    tipoUsuario: 'personal'
  });

  // Mostrar credenciales en consola (como reset password)
  console.log(`\n=== CREDENCIALES PARA EMPLEADO ===`);
  console.log(`Nombre: ${data.nombre} ${data.apellido}`);
  console.log(`Email: ${data.email}`);
  console.log(`Username: ${username}`);
  console.log(`Password: ${password}`);
  console.log(`=====================================\n`);

  // Enviar email con credenciales si se proporciona información de empresa
  if (data.empresaId && data.empresaNombre) {
    try {
      await notificacionService.notificarNuevoEmpleado(
        String(user._id),
        data.empresaId,
        username,
        password,
        data.empresaNombre
      );
      console.log(`✅ Email de credenciales enviado a ${data.email}`);
    } catch (error) {
      console.error(`❌ Error enviando email de credenciales a ${data.email}:`, error);
      // No fallar la operación si el email falla, solo loguear el error
    }
  }

  return { user: sanitize(user), credentials: { username, password } };
}
