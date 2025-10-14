import { Request, Response } from 'express';
import { z } from 'zod';
import Evento from '../models/eventos.model';
import Mesa from '../models/mesa.model';
import { notificacionService } from '../services/notificacion.service';

const createEventoSchema = z.object({
  nombre: z.string().min(2),
  descripcion: z.string().min(5),
  inicio: z.coerce.date(),
  fin: z.coerce.date(),
  duracion_minutos_reunion: z.coerce.number().int().positive(),
  numero_mesas: z.coerce.number().int().positive(),
  modo_mesas: z.enum(['FIJA_POR_EMPRESA','POR_REUNION']),
  logo_url: z.string().url().nullable().optional(),
  estado: z.enum(['ACTIVO', 'FINALIZADO', 'CANCELADO', 'PROGRAMADO']).optional()
}).superRefine((val, ctx) => {
  if (val.fin <= val.inicio) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'fin debe ser > inicio', path: ['fin'] });
  }
});

const updateEventoSchema = createEventoSchema.partial();

export async function listEventosCtrl(req: Request, res: Response) {
  const page = Number(req.query.page ?? 1);
  const limit = Math.min(Number(req.query.limit ?? 20), 100);
  const skip = (page - 1) * limit;

  // Determinar el filtro basado en la URL
  let filter: any = {};
  const now = new Date();

  if (req.path.includes('/activos')) {
    filter = { estado: 'ACTIVO', fin: { $gte: now } };
  } else if (req.path.includes('/pasados')) {
    filter = { estado: 'FINALIZADO' };
  } else if (req.path.includes('/proximos')) {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    filter = { inicio: { $gte: now, $lte: thirtyDaysFromNow }, estado: { $ne: 'FINALIZADO' } };
  } else if (req.path.includes('/todos')) {
    // Todos los eventos excepto los finalizados
    filter = { estado: { $ne: 'FINALIZADO' } };
  }
  // Si no hay filtro específico, mostrar todos los eventos

  const [items, total] = await Promise.all([
    Evento.find(filter).sort({ inicio: -1 }).skip(skip).limit(limit).lean(),
    Evento.countDocuments(filter)
  ]);

  res.json({ data: items, total, page, limit });
}

export async function getEventoCtrl(req: Request, res: Response) {
  const ev = await Evento.findById(req.params.id).lean();
  if (!ev) return res.status(404).json({ error: 'NOT_FOUND' });
  res.json(ev);
}

export async function createEventoCtrl(req: Request, res: Response) {
  try {
    const data = createEventoSchema.parse(req.body);
    const created = await Evento.create(data);
    
    // Crear las mesas para el evento
    const mesas = [];
    for (let i = 1; i <= data.numero_mesas; i++) {
      mesas.push({
        eventoId: created._id,
        numero: i,
        nombre: `${data.nombre} - Mesa ${i}`,
        activa: true,
        ocupada: false
      });
    }
    
    try {
      await Mesa.insertMany(mesas);
      console.log(`✅ Created ${mesas.length} mesas for event ${created._id}`);
    } catch (mesaError: any) {
      console.error('Error creating mesas:', mesaError);
      // Si falla la creación de mesas, eliminar el evento creado
      await Evento.findByIdAndDelete(created._id);
      throw new Error(`Failed to create mesas: ${mesaError.message}`);
    }
    
    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
  }
}

export async function updateEventoCtrl(req: Request, res: Response) {
  const data = updateEventoSchema.parse(req.body);
  const updated = await Evento.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!updated) return res.status(404).json({ error: 'NOT_FOUND' });
  res.json(updated);
}

export async function deleteEventoCtrl(req: Request, res: Response) {
  const deleted = await Evento.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'NOT_FOUND' });
  res.json({ ok: true });
}

export async function cambiarEstadoEventoCtrl(req: Request, res: Response) {
  try {
    const { estado } = req.body;
    const validEstados = ['ACTIVO', 'FINALIZADO', 'CANCELADO', 'PROGRAMADO'];
    
    if (!validEstados.includes(estado)) {
      return res.status(400).json({ error: 'ESTADO_INVALIDO', message: 'Estado debe ser uno de: ACTIVO, FINALIZADO, CANCELADO, PROGRAMADO' });
    }

    // Obtener el evento actual para comparar el estado
    const eventoActual = await Evento.findById(req.params.id).lean();
    if (!eventoActual) return res.status(404).json({ error: 'NOT_FOUND' });

    const updated = await Evento.findByIdAndUpdate(
      req.params.id, 
      { estado }, 
      { new: true, runValidators: true }
    );
    
    if (!updated) return res.status(404).json({ error: 'NOT_FOUND' });
    
    // Si el evento se finaliza, deshabilitar todas sus mesas
    if (estado === 'FINALIZADO') {
      await Mesa.updateMany(
        { eventoId: req.params.id },
        { activa: false }
      );
    }

    // Notificar cambios de estado importantes
    if (eventoActual.estado !== estado) {
      try {
        if (estado === 'ACTIVO') {
          await notificacionService.notificarInicioEvento(updated);
        } else if (estado === 'FINALIZADO') {
          await notificacionService.notificarFinEvento(updated);
        }
      } catch (notificationError) {
        console.error('❌ Error enviando notificación de cambio de estado de evento:', notificationError);
        // No fallar la operación principal si falla la notificación
      }
    }
    
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating event status:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
  }
}

