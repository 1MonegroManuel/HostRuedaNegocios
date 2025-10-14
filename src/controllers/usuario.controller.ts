import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import Usuario from '../models/usuario.model';

// Schemas
const createUsuarioSchema = z.object({
  nombre: z.string().min(2),
  apellido: z.string().min(2),
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(6),
  telefono: z.string().optional().nullable(),
  tipoUsuario: z.enum(['personal','dueño','admin']).optional()
});

const updateUsuarioSchema = z.object({
  nombre: z.string().min(2).optional(),
  apellido: z.string().min(2).optional(),
  email: z.string().email().optional(),
  username: z.string().min(3).optional(),
  password: z.string().min(6).optional(),
  telefono: z.string().nullable().optional(),
  tipoUsuario: z.enum(['personal','dueño','admin']).optional()
});

function sanitize(u: any) {
  const { passwordHash, __v, ...rest } = u;
  return rest;
}

// Crear usuario
export async function createUsuarioCtrl(req: Request, res: Response) {
  try {
    const body = createUsuarioSchema.parse(req.body);

    // Chequeo básico de duplicados (además del unique index)
    const exists = await Usuario.findOne({
      $or: [{ email: body.email.toLowerCase() }, { username: body.username }]
    }).lean();
    if (exists) return res.status(409).json({ error: 'Email o username ya registrados' });

    const passwordHash = await bcrypt.hash(body.password, 10);

    const usuario = await Usuario.create({
      nombre: body.nombre.trim(),
      apellido: body.apellido.trim(),
      email: body.email.toLowerCase(),
      username: body.username.trim(),
      passwordHash,
      telefono: body.telefono ?? null,
      tipoUsuario: body.tipoUsuario ?? 'personal'
    });

    res.status(201).json(sanitize(usuario.toObject()));
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'VALIDATION_ERROR', details: error.errors });
    }
    if (error?.code === 11000) {
      return res.status(409).json({ error: 'DUPLICATE_KEY', details: error.keyValue });
    }
    res.status(500).json({ error: error.message ?? 'INTERNAL_ERROR' });
  }
}

// Listar usuarios
export async function listUsuariosCtrl(_req: Request, res: Response) {
  try {
    const usuarios = await Usuario.find().sort({ creado_en: -1 }).lean();
    res.json(usuarios.map(sanitize));
  } catch (error: any) {
    res.status(500).json({ error: error.message ?? 'INTERNAL_ERROR' });
  }
}

// Obtener un usuario por ID
export async function getUsuarioCtrl(req: Request, res: Response) {
  try {
    const usuario = await Usuario.findById(req.params.id).lean();
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(sanitize(usuario));
  } catch (error: any) {
    if (error?.name === 'CastError') {
      return res.status(400).json({ error: 'CAST_ERROR', details: error.message });
    }
    res.status(500).json({ error: error.message ?? 'INTERNAL_ERROR' });
  }
}

// Actualizar usuario (parcial)
export async function updateUsuarioCtrl(req: Request, res: Response) {
  try {
    const body = updateUsuarioSchema.parse(req.body);

    const updateData: any = { ...body };
    if (body.email) updateData.email = body.email.toLowerCase();
    if (body.username) updateData.username = body.username.trim();
    if (body.password) {
      updateData.passwordHash = await bcrypt.hash(body.password, 10);
      delete updateData.password;
    }

    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(sanitize(usuario));
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'VALIDATION_ERROR', details: error.errors });
    }
    if (error?.name === 'CastError') {
      return res.status(400).json({ error: 'CAST_ERROR', details: error.message });
    }
    if (error?.code === 11000) {
      return res.status(409).json({ error: 'DUPLICATE_KEY', details: error.keyValue });
    }
    res.status(500).json({ error: error.message ?? 'INTERNAL_ERROR' });
  }
}

// Eliminar usuario
export async function deleteUsuarioCtrl(req: Request, res: Response) {
  try {
    const usuario = await Usuario.findByIdAndDelete(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ ok: true });
  } catch (error: any) {
    if (error?.name === 'CastError') {
      return res.status(400).json({ error: 'CAST_ERROR', details: error.message });
    }
    res.status(500).json({ error: error.message ?? 'INTERNAL_ERROR' });
  }
}
