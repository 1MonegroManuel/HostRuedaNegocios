import { Request, Response } from 'express';
import { z } from 'zod';
import ArchivoEvento from '../models/archivoEvento.model';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'ObjectId inválido');

const createSchema = z.object({
  eventoId: objectId,
  tipo: z.enum(['MAPA','CRONOGRAMA','OTRO']),
  url: z.string().url('URL inválida'),
  nombre_archivo: z.string().min(1),
  mime: z.string().min(1)
});

const updateSchema = createSchema.partial();

function handleError(err: any, res: Response) {
  if (err.name === 'ZodError') {
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

// Crear archivo (recibe URL directa)
export async function crearArchivoCtrl(req: Request, res: Response) {
  try {
    const data = createSchema.parse(req.body);
    const nuevoArchivo = await ArchivoEvento.create(data);
    res.status(201).json(nuevoArchivo);
  } catch (err: any) {
    handleError(err, res);
  }
}

// Listar (paginado)
export async function listarArchivosCtrl(req: Request, res: Response) {
  try {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit ?? 20), 1), 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      ArchivoEvento.find().sort({ creado_en: -1 }).skip(skip).limit(limit).lean(),
      ArchivoEvento.countDocuments()
    ]);
    res.json({ data: items, total, page, limit });
  } catch (err: any) {
    handleError(err, res);
  }
}

// Listar por evento (paginado)
export async function listarArchivosPorEventoCtrl(req: Request, res: Response) {
  try {
    const { eventoId } = z.object({ eventoId: objectId }).parse(req.params);
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit ?? 20), 1), 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      ArchivoEvento.find({ eventoId }).sort({ creado_en: -1 }).skip(skip).limit(limit).lean(),
      ArchivoEvento.countDocuments({ eventoId })
    ]);
    res.json({ data: items, total, page, limit });
  } catch (err: any) {
    handleError(err, res);
  }
}

// Obtener uno
export async function obtenerArchivoCtrl(req: Request, res: Response) {
  try {
    const { id } = z.object({ id: objectId }).parse(req.params);
    const doc = await ArchivoEvento.findById(id).lean();
    if (!doc) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(doc);
  } catch (err: any) {
    handleError(err, res);
  }
}

// Actualizar
export async function actualizarArchivoCtrl(req: Request, res: Response) {
  try {
    const { id } = z.object({ id: objectId }).parse(req.params);
    const data = updateSchema.parse(req.body);
    const doc = await ArchivoEvento.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(doc);
  } catch (err: any) {
    handleError(err, res);
  }
}

// Eliminar
export async function eliminarArchivoCtrl(req: Request, res: Response) {
  try {
    const { id } = z.object({ id: objectId }).parse(req.params);
    const doc = await ArchivoEvento.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json({ ok: true });
  } catch (err: any) {
    handleError(err, res);
  }
}
