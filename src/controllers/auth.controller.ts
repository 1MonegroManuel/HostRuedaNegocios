import { Request, Response } from 'express';
import { z } from 'zod';
import { login, register, refresh, requestPasswordReset, resetPassword, createEmployee } from '../services/auth.service';
import { emailService } from '../services/email.service';
import Usuario from '../models/usuario.model';

const registerSchema = z.object({
  nombre: z.string().min(2),
  apellido: z.string().min(2),
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(6),
  telefono: z.string().optional().nullable(),
  tipoUsuario: z.enum(['personal','encargado','admin']).optional()
});

const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(6)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10)
});

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

const resetPasswordSchema = z.object({
  token: z.string().min(6),
  newPassword: z.string().min(6)
});

const createEmployeeSchema = z.object({
  nombre: z.string().min(2),
  apellido: z.string().min(2),
  email: z.string().email(),
  telefono: z.string().optional().nullable(),
  empresaId: z.string().optional(),
  empresaNombre: z.string().optional()
});

const getUsersByIdsSchema = z.object({
  ids: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'ObjectId inválido'))
});

export async function registerCtrl(req: Request, res: Response) {
  try {
    const data = registerSchema.parse(req.body);
    const out = await register(data);
    res.status(201).json({ success: true, ...out });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: error.errors });
    }
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, error: 'DUPLICATE_KEY', details: error.keyValue });
    }
    res.status(400).json({ success: false, error: error.message ?? 'INTERNAL_ERROR' });
  }
}

export async function loginCtrl(req: Request, res: Response) {
  try {
    console.log('🔍 Login attempt:', { identifier: req.body.identifier, password: req.body.password ? '***' : 'missing' });
    const { identifier, password } = loginSchema.parse(req.body);
    console.log('✅ Validation passed, calling login service');
    const data = await login(identifier, password);
    console.log('✅ Login successful');
    res.json({ success: true, ...data });
  } catch (error: any) {
    console.log('❌ Login error:', error.message);
    if (error?.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: error.errors });
    }
    res.status(401).json({ success: false, error: error.message ?? 'Credenciales inválidas' });
  }
}

export async function refreshCtrl(req: Request, res: Response) {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const data = await refresh(refreshToken);
    res.json({ success: true, ...data });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: error.errors });
    }
    res.status(401).json({ success: false, error: error.message ?? 'Token inválido' });
  }
}

export async function meCtrl(req: Request, res: Response) {
  try {
    res.json({ success: true, user: (req as any).user ?? null });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message ?? 'INTERNAL_ERROR' });
  }
}

export async function forgotPasswordCtrl(req: Request, res: Response) {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const result = await requestPasswordReset(email);
    res.json({ success: true, message: result.message });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: error.errors });
    }
    res.status(400).json({ success: false, error: error.message ?? 'INTERNAL_ERROR' });
  }
}

export async function resetPasswordCtrl(req: Request, res: Response) {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);
    const result = await resetPassword(token, newPassword);
    res.json({ success: true, message: result.message });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: error.errors });
    }
    res.status(400).json({ success: false, error: error.message ?? 'INTERNAL_ERROR' });
  }
}

export async function logoutCtrl(req: Request, res: Response) {
  try {
    // En un sistema JWT, el logout es principalmente del lado del cliente
    // Aquí podrías implementar una blacklist de tokens si es necesario
    res.json({ success: true, message: 'Sesión cerrada exitosamente' });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      message: error?.message || 'Error al cerrar sesión' 
    });
  }
}

export async function createEmployeeCtrl(req: Request, res: Response) {
  try {
    console.log('🔍 Creating employee with data:', req.body);
    const data = createEmployeeSchema.parse(req.body);
    const result = await createEmployee(data);
    console.log('✅ Employee created successfully:', result.user._id);
    res.status(201).json({ success: true, user: result.user, credentials: result.credentials });
  } catch (error: any) {
    console.log('❌ Error creating employee:', error.message);
    if (error?.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: error.errors });
    }
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, error: 'DUPLICATE_KEY', details: error.keyValue });
    }
    res.status(400).json({ success: false, error: error.message ?? 'INTERNAL_ERROR' });
  }
}

export async function getUsersByIdsCtrl(req: Request, res: Response) {
  try {
    const { ids } = getUsersByIdsSchema.parse(req.body);
    const users = await Usuario.find({ _id: { $in: ids } }).select('-passwordHash').lean();
    res.json({ success: true, users });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: error.errors });
    }
    res.status(400).json({ success: false, error: error.message ?? 'INTERNAL_ERROR' });
  }
}

export async function testEmailCtrl(req: Request, res: Response) {
  try {
    console.log('🧪 Probando envío de email...');
    const result = await emailService.sendPasswordResetEmail('ruedanegociosbeni@gmail.com', '123456');
    console.log('✅ Resultado del envío:', result);
    res.json({ success: true, message: 'Email de prueba enviado', result });
  } catch (error: any) {
    console.error('❌ Error en test email:', error);
    res.status(500).json({ success: false, error: error.message ?? 'INTERNAL_ERROR' });
  }
}
