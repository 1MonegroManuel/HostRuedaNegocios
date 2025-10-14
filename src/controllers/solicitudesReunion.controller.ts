import { Request, Response } from 'express';
import { z } from 'zod';
import SolicitudReunion from '../models/solicitudReunion.model';
import Evento from '../models/eventos.model';
import Empresa from '../models/empresas.model';
import Mesa from '../models/mesa.model';
import { notificacionService } from '../services/notificacion.service';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'ObjectId inválido');

const createSchema = z.object({
  eventoId: objectId,
  empresaSolicitaId: objectId,
  empresaObjetivoId: objectId,
  usuarioSolicitaId: objectId,
  mesaPreferidaId: objectId.nullable().optional(),
  inicioPropuesto: z.coerce.date().nullable().optional(),
  finPropuesto: z.coerce.date().nullable().optional(),
  tipoReunion: z.enum(['virtual', 'presencial']).optional(),
  mensaje: z.string().min(1).nullable().optional(),
});
const updateSchema = createSchema.partial();

const estadoSchema = z.object({
  estado: z.enum(['pendiente','aceptada','rechazada','cancelada'])
});

function handleError(err: any, res: Response) {
  if (err?.name === 'ZodError') return res.status(400).json({ error: 'VALIDATION_ERROR', details: err.errors });
  if (err?.name === 'ValidationError') return res.status(400).json({ error: 'MONGOOSE_VALIDATION', details: err.errors });
  if (err?.name === 'CastError') return res.status(400).json({ error: 'CAST_ERROR', details: err.message });
  if (err?.code === 11000) return res.status(409).json({ error: 'DUPLICATE_KEY', details: err.keyValue });
  const status = err?.statusCode ?? 500;
  return res.status(status).json({ error: err?.message ?? 'INTERNAL_ERROR' });
}

async function validarCoherenciaBase({
  eventoId, empresaSolicitaId, empresaObjetivoId, mesaPreferidaId, inicioPropuesto, finPropuesto
}: {
  eventoId: string; empresaSolicitaId: string; empresaObjetivoId: string;
  mesaPreferidaId?: string | null; inicioPropuesto?: Date | null; finPropuesto?: Date | null;
}) {
  if (empresaSolicitaId === empresaObjetivoId) {
    const e = new Error('La empresa solicitante y objetivo deben ser distintas'); (e as any).statusCode = 400; throw e;
  }
  const evento = await Evento.findById(eventoId).lean();
  if (!evento) { const e = new Error('Evento no encontrado'); (e as any).statusCode = 404; throw e; }

  const [a, b] = await Promise.all([
    Empresa.findById(empresaSolicitaId).lean(),
    Empresa.findById(empresaObjetivoId).lean(),
  ]);
  if (!a) { const e = new Error('Empresa solicitante no encontrada'); (e as any).statusCode = 404; throw e; }
  if (!b) { const e = new Error('Empresa objetivo no encontrada'); (e as any).statusCode = 404; throw e; }
  if (String(a.eventoId) !== String(eventoId) || String(b.eventoId) !== String(eventoId)) {
    const e = new Error('Ambas empresas deben pertenecer al mismo evento'); (e as any).statusCode = 409; throw e;
  }

  if (mesaPreferidaId) {
    const mesa = await Mesa.findById(mesaPreferidaId).lean();
    if (!mesa) { const e = new Error('Mesa preferida no encontrada'); (e as any).statusCode = 404; throw e; }
    if (String(mesa.eventoId) !== String(eventoId)) {
      const e = new Error('La mesa preferida no pertenece al evento'); (e as any).statusCode = 409; throw e;
    }
  }

  if (inicioPropuesto && finPropuesto) {
    if (!(finPropuesto > inicioPropuesto)) {
      const e = new Error('finPropuesto debe ser mayor a inicioPropuesto'); (e as any).statusCode = 400; throw e;
    }
    if (!(inicioPropuesto >= new Date(evento.inicio) && finPropuesto <= new Date(evento.fin))) {
      const e = new Error('El rango propuesto debe estar dentro del evento'); (e as any).statusCode = 409; throw e;
    }
  }
}

// Crear
export async function crearSolicitudCtrl(req: Request, res: Response) {
  try {
    const data = createSchema.parse(req.body);
    await validarCoherenciaBase(data);
    const doc = await SolicitudReunion.create({ ...data, estado: 'pendiente' });
    
    // Notificar nueva solicitud
    try {
      await notificacionService.notificarNuevaSolicitud(doc);
    } catch (notificationError) {
      console.error('❌ Error enviando notificación de nueva solicitud:', notificationError);
      // No fallar la operación principal si falla la notificación
    }
    
    res.status(201).json(doc);
  } catch (err: any) { handleError(err, res); }
}

// Listar (filtros + paginación)
export async function listarSolicitudesCtrl(req: Request, res: Response) {
  try {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit ?? 20), 1), 100);
    const skip = (page - 1) * limit;

    const filtro: any = {};
    if (req.query.eventoId) filtro.eventoId = objectId.parse(String(req.query.eventoId));
    if (req.query.empresaId) {
      const id = objectId.parse(String(req.query.empresaId));
      filtro.$or = [{ empresaSolicitaId: id }, { empresaObjetivoId: id }];
    }
    if (req.query.empresaSolicitaId) filtro.empresaSolicitaId = objectId.parse(String(req.query.empresaSolicitaId));
    if (req.query.empresaObjetivoId) filtro.empresaObjetivoId = objectId.parse(String(req.query.empresaObjetivoId));
    if (req.query.estado) filtro.estado = z.enum(['pendiente','aceptada','rechazada','cancelada']).parse(String(req.query.estado));

    const [items, total] = await Promise.all([
      SolicitudReunion.find(filtro).sort({ creada_en: -1 }).skip(skip).limit(limit)
        .populate('empresaSolicitaId', 'nombre representante email logo_url sitio_web')
        .populate('empresaObjetivoId', 'nombre representante email logo_url sitio_web')
        .populate('mesaPreferidaId', 'numero nombre')
        .lean(),
      SolicitudReunion.countDocuments(filtro),
    ]);

    res.json({ data: items, total, page, limit });
  } catch (err: any) { handleError(err, res); }
}

// Obtener
export async function obtenerSolicitudCtrl(req: Request, res: Response) {
  try {
    const { id } = z.object({ id: objectId }).parse(req.params);
    const doc = await SolicitudReunion.findById(id)
      .populate('empresaSolicitaId', 'nombre representante email logo_url sitio_web')
      .populate('empresaObjetivoId', 'nombre representante email logo_url sitio_web')
      .populate('mesaPreferidaId', 'numero nombre')
      .lean();
    if (!doc) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(doc);
  } catch (err: any) { handleError(err, res); }
}

// Actualizar (mensaje, preferencias, etc.)
export async function actualizarSolicitudCtrl(req: Request, res: Response) {
  try {
    const { id } = z.object({ id: objectId }).parse(req.params);
    const data = updateSchema.parse(req.body);

    // Carga el doc actual para completar coherencia
    const actual = await SolicitudReunion.findById(id).lean();
    if (!actual) return res.status(404).json({ error: 'NOT_FOUND' });

    await validarCoherenciaBase({
      eventoId: String(data.eventoId ?? actual.eventoId),
      empresaSolicitaId: String(data.empresaSolicitaId ?? actual.empresaSolicitaId),
      empresaObjetivoId: String(data.empresaObjetivoId ?? actual.empresaObjetivoId),
      mesaPreferidaId: (data as any).mesaPreferidaId ?? actual.mesaPreferidaId ?? null,
      inicioPropuesto: (data as any).inicioPropuesto ?? actual.inicioPropuesto ?? null,
      finPropuesto: (data as any).finPropuesto ?? actual.finPropuesto ?? null,
    });

    const updated = await SolicitudReunion.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(updated);
  } catch (err: any) { handleError(err, res); }
}

// Eliminar
export async function eliminarSolicitudCtrl(req: Request, res: Response) {
  try {
    const { id } = z.object({ id: objectId }).parse(req.params);
    const deleted = await SolicitudReunion.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json({ ok: true });
  } catch (err: any) { handleError(err, res); }
}

// CRUD+ — cambio de estado
export async function setEstadoSolicitudCtrl(req: Request, res: Response) {
  try {
    const { id } = z.object({ id: objectId }).parse(req.params);
    const { estado } = estadoSchema.parse(req.body);

    const doc = await SolicitudReunion.findById(id);
    if (!doc) return res.status(404).json({ error: 'NOT_FOUND' });

    // Reglas simples:
    // - No volver a 'pendiente' desde otros estados
    if (doc.estado !== 'pendiente' && estado === 'pendiente') {
      const e = new Error('Transición inválida a pendiente'); (e as any).statusCode = 409; throw e;
    }
    // - No aceptar si empresas no pertenecen al mismo evento (ya validado al crear, pero por si actualizaciones)
    await validarCoherenciaBase({
      eventoId: String(doc.eventoId),
      empresaSolicitaId: String(doc.empresaSolicitaId),
      empresaObjetivoId: String(doc.empresaObjetivoId),
      mesaPreferidaId: (doc as any).mesaPreferidaId ?? null,
      inicioPropuesto: (doc as any).inicioPropuesto ?? null,
      finPropuesto: (doc as any).finPropuesto ?? null,
    });

    const estadoAnterior = doc.estado;
    doc.estado = estado;
    await doc.save();

    // Crear notificaciones según el cambio de estado
    if (estadoAnterior === 'pendiente') {
      if (estado === 'aceptada') {
        await notificacionService.notificarSolicitudAceptada(doc, String(doc.empresaObjetivoId));
      } else if (estado === 'rechazada') {
        await notificacionService.notificarSolicitudRechazada(doc, String(doc.empresaObjetivoId));
      }
    }

    res.json(doc);
  } catch (err: any) { handleError(err, res); }
}

// Verificar si existe solicitud pendiente entre dos empresas
export async function verificarSolicitudExistenteCtrl(req: Request, res: Response) {
  try {
    const { eventoId, empresaSolicitaId, empresaObjetivoId } = z.object({
      eventoId: objectId,
      empresaSolicitaId: objectId,
      empresaObjetivoId: objectId,
    }).parse(req.query);

    const solicitud = await SolicitudReunion.findOne({
      eventoId,
      $or: [
        { empresaSolicitaId, empresaObjetivoId, estado: 'pendiente' },
        { empresaSolicitaId: empresaObjetivoId, empresaObjetivoId: empresaSolicitaId, estado: 'pendiente' }
      ]
    })
    .populate('empresaSolicitaId', 'nombre representante email logo_url sitio_web')
    .populate('empresaObjetivoId', 'nombre representante email logo_url sitio_web')
    .populate('mesaPreferidaId', 'numero nombre')
    .lean();

    res.json({
      exists: !!solicitud,
      solicitud: solicitud || undefined
    });
  } catch (err: any) { handleError(err, res); }
}

