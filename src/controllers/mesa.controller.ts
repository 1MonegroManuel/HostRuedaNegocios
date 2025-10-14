import { Request, Response } from 'express';
import { z } from 'zod';
import Mesa from '../models/mesa.model';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'ObjectId inválido');

const createMesaSchema = z.object({
  eventoId: objectId,
  numero: z.coerce.number().int().positive(),
  nombre: z.string().trim().min(1).nullable().optional(),
  capacidad: z.coerce.number().int().positive().nullable().optional(),
  activa: z.coerce.boolean().optional(),
});

const updateMesaSchema = createMesaSchema.partial();

function handleError(err: any, res: Response) {
  if (err?.name === 'ZodError') {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: err.errors });
  }
  if (err?.name === 'ValidationError') {
    return res.status(400).json({ error: 'MONGOOSE_VALIDATION', details: err.errors });
  }
  if (err?.name === 'CastError') {
    return res.status(400).json({ error: 'CAST_ERROR', details: err.message });
  }
  if (err?.code === 11000) {
    return res.status(409).json({ error: 'DUPLICATE_KEY', details: err.keyValue });
  }
  return res.status(500).json({ error: 'INTERNAL_ERROR', details: err?.message ?? String(err) });
}

// Crear mesa
export async function crearMesaCtrl(req: Request, res: Response) {
  try {
    const data = createMesaSchema.parse(req.body);
    const doc = await Mesa.create(data);
    res.status(201).json(doc);
  } catch (err: any) {
    handleError(err, res);
  }
}

// Listar mesas (paginado, opcionalmente por evento via query ?eventoId=...)
export async function listarMesasCtrl(req: Request, res: Response) {
  try {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit ?? 20), 1), 100);
    const skip = (page - 1) * limit;

    const filtro: any = {};
    if (req.query.eventoId) {
      const { eventoId } = z.object({ eventoId: objectId }).parse({ eventoId: String(req.query.eventoId) });
      filtro.eventoId = eventoId;
    }
    if (typeof req.query.activa !== 'undefined') {
      filtro.activa = String(req.query.activa) === 'true';
    }

    const [items, total] = await Promise.all([
      Mesa.find(filtro).sort({ numero: 1 }).skip(skip).limit(limit).lean(),
      Mesa.countDocuments(filtro),
    ]);

    res.json({ data: items, total, page, limit });
  } catch (err: any) {
    handleError(err, res);
  }
}

// Listar por evento (paginado) usando ruta semántica
export async function listarMesasPorEventoCtrl(req: Request, res: Response) {
  try {
    const { eventoId } = z.object({ eventoId: objectId }).parse(req.params);
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit ?? 20), 1), 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Mesa.find({ eventoId }).sort({ numero: 1 }).skip(skip).limit(limit).lean(),
      Mesa.countDocuments({ eventoId }),
    ]);

    res.json({ data: items, total, page, limit });
  } catch (err: any) {
    handleError(err, res);
  }
}

// Obtener una mesa
export async function obtenerMesaCtrl(req: Request, res: Response) {
  try {
    const { id } = z.object({ id: objectId }).parse(req.params);
    const doc = await Mesa.findById(id).lean();
    if (!doc) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(doc);
  } catch (err: any) {
    handleError(err, res);
  }
}

// Actualizar mesa (parcial)
export async function actualizarMesaCtrl(req: Request, res: Response) {
  try {
    const { id } = z.object({ id: objectId }).parse(req.params);
    const data = updateMesaSchema.parse(req.body);

    // Si llega nombre vacío como "", normaliza a null
    if (data && 'nombre' in data && (data as any).nombre === '') (data as any).nombre = null;

    const doc = await Mesa.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(doc);
  } catch (err: any) {
    handleError(err, res);
  }
}

// Eliminar mesa
export async function eliminarMesaCtrl(req: Request, res: Response) {
  try {
    const { id } = z.object({ id: objectId }).parse(req.params);
    const doc = await Mesa.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json({ ok: true });
  } catch (err: any) {
    handleError(err, res);
  }
}

// Obtener mesas disponibles por evento
export async function getMesasDisponiblesCtrl(req: Request, res: Response) {
  try {
    const { eventoId } = z.object({ eventoId: objectId }).parse(req.params);
    
    const mesasDisponibles = await Mesa.find({
      eventoId,
      activa: true,
      ocupada: false
    }).sort({ numero: 1 }).lean();
    
    res.json({ data: mesasDisponibles });
  } catch (err: any) {
    handleError(err, res);
  }
}