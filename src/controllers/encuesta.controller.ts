import { Request, Response } from 'express';
import { z } from 'zod';
import EncuestaReunion from '../models/encuestaReunion.model';
import SolicitudReunion from '../models/solicitudReunion.model';
import Empresa from '../models/empresas.model';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'ObjectId inválido');

const createSchema = z.object({
  eventoId: objectId,
  solicitudReunionId: objectId, // Cambiado de reunionId a solicitudReunionId
  empresaId: objectId,
  calificacion_general: z.coerce.number().int().min(1).max(5),
  match_negocio: z.coerce.number().int().min(1).max(5).nullable().optional(),
  puntualidad: z.coerce.number().int().min(1).max(5).nullable().optional(),
  interes_contraparte: z.coerce.number().int().min(1).max(5).nullable().optional(),
  recomendar_nps: z.coerce.number().int().min(0).max(10).nullable().optional(),
  monto_acordado: z.coerce.number().min(0).nullable().optional(),
  comentarios: z.string().min(1).nullable().optional(),
});

const updateSchema = createSchema.partial();

function handleError(err: any, res: Response) {
  if (err?.name === 'ZodError') return res.status(400).json({ error: 'VALIDATION_ERROR', details: err.errors });
  if (err?.name === 'ValidationError') return res.status(400).json({ error: 'MONGOOSE_VALIDATION', details: err.errors });
  if (err?.name === 'CastError') return res.status(400).json({ error: 'CAST_ERROR', details: err.message });
  if (err?.code === 11000) return res.status(409).json({ error: 'DUPLICATE_KEY', details: err.keyValue });
  const status = err?.statusCode ?? 500;
  return res.status(status).json({ error: err?.message ?? 'INTERNAL_ERROR' });
}

/**
 * Valida:
 * - La solicitud de reunión existe y está ACEPTADA.
 * - La empresa pertenece al mismo evento y es una de las empresas de la solicitud.
 * - El eventoId coincide con el de la solicitud.
 */
async function validarCoherenciaEncuesta({ eventoId, solicitudReunionId, empresaId }: {
  eventoId: string; solicitudReunionId: string; empresaId: string;
}) {
  const solicitudReunion = await SolicitudReunion.findById(solicitudReunionId).lean();
  if (!solicitudReunion) { const e = new Error('Solicitud de reunión no encontrada'); (e as any).statusCode = 404; throw e; }
  if (String(solicitudReunion.eventoId) !== String(eventoId)) {
    const e = new Error('La solicitud no pertenece al evento indicado'); (e as any).statusCode = 409; throw e;
  }
  if (solicitudReunion.estado !== 'aceptada') {
    const e = new Error('Solo se puede registrar encuesta cuando la solicitud está aceptada'); (e as any).statusCode = 409; throw e;
  }

  const empresa = await Empresa.findById(empresaId).lean();
  if (!empresa) { const e = new Error('Empresa no encontrada'); (e as any).statusCode = 404; throw e; }
  if (String(empresa.eventoId) !== String(eventoId)) {
    const e = new Error('La empresa no pertenece al evento indicado'); (e as any).statusCode = 409; throw e;
  }

  const esParte = [String(solicitudReunion.empresaSolicitaId), String(solicitudReunion.empresaObjetivoId)].includes(String(empresaId));
  if (!esParte) {
    const e = new Error('La empresa no participó en esta solicitud de reunión'); (e as any).statusCode = 409; throw e;
  }
}

// Crear encuesta
export async function crearEncuestaCtrl(req: Request, res: Response) {
  try {
    const data = createSchema.parse(req.body);
    await validarCoherenciaEncuesta(data);

    const created = await EncuestaReunion.create({
      ...data,
      comentarios: data.comentarios ?? null,
      match_negocio: data.match_negocio ?? null,
      puntualidad: data.puntualidad ?? null,
      interes_contraparte: data.interes_contraparte ?? null,
      recomendar_nps: data.recomendar_nps ?? null,
      monto_acordado: data.monto_acordado ?? null,
    });

    res.status(201).json(created);
  } catch (err: any) { handleError(err, res); }
}

// Listar encuestas (filtros + paginación)
export async function listarEncuestasCtrl(req: Request, res: Response) {
  try {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit ?? 20), 1), 100);
    const skip = (page - 1) * limit;

    const filtro: any = {};
    if (req.query.eventoId) filtro.eventoId = objectId.parse(String(req.query.eventoId));
    if (req.query.solicitudReunionId) filtro.solicitudReunionId = objectId.parse(String(req.query.solicitudReunionId));
    if (req.query.empresaId) filtro.empresaId = objectId.parse(String(req.query.empresaId));

    const [items, total] = await Promise.all([
      EncuestaReunion.find(filtro).sort({ creada_en: -1 }).skip(skip).limit(limit)
        .populate('empresaId', 'nombre')
        .populate('solicitudReunionId', 'inicioPropuesto finPropuesto')
        .lean(),
      EncuestaReunion.countDocuments(filtro),
    ]);

    res.json({ data: items, total, page, limit });
  } catch (err: any) { handleError(err, res); }
}

// Obtener una encuesta
export async function obtenerEncuestaCtrl(req: Request, res: Response) {
  try {
    const { id } = z.object({ id: objectId }).parse(req.params);
    const doc = await EncuestaReunion.findById(id)
      .populate('empresaId', 'nombre')
      .populate('solicitudReunionId', 'inicioPropuesto finPropuesto')
      .lean();
    if (!doc) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(doc);
  } catch (err: any) { handleError(err, res); }
}

// Actualizar encuesta (permitimos editar campos; si quieres, restrínge a comentarios)
export async function actualizarEncuestaCtrl(req: Request, res: Response) {
  try {
    const { id } = z.object({ id: objectId }).parse(req.params);
    const data = updateSchema.parse(req.body);

    if (Object.keys(data).length === 0) return res.status(400).json({ error: 'Sin cambios' });

    // Si cambia vínculo, revalidar coherencia
    if (data.eventoId || data.solicitudReunionId || data.empresaId) {
      const actual = await EncuestaReunion.findById(id).lean();
      if (!actual) return res.status(404).json({ error: 'NOT_FOUND' });
      await validarCoherenciaEncuesta({
        eventoId: String(data.eventoId ?? actual.eventoId),
        solicitudReunionId: String(data.solicitudReunionId ?? actual.solicitudReunionId),
        empresaId: String(data.empresaId ?? actual.empresaId),
      });
    }

    const updated = await EncuestaReunion.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(updated);
  } catch (err: any) { handleError(err, res); }
}

// Eliminar encuesta
export async function eliminarEncuestaCtrl(req: Request, res: Response) {
  try {
    const { id } = z.object({ id: objectId }).parse(req.params);
    const deleted = await EncuestaReunion.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json({ ok: true });
  } catch (err: any) { handleError(err, res); }
}

/**
 * Verificar encuestas pendientes para una empresa
 * Retorna las reuniones finalizadas que requieren encuesta
 */
export async function verificarEncuestasPendientesCtrl(req: Request, res: Response) {
  try {
    const { empresaId } = z.object({ empresaId: objectId }).parse(req.params);

    console.log(`🔍 Verificando encuestas pendientes para empresa: ${empresaId}`);

    // Obtener todas las solicitudes de reunión aceptadas donde participa la empresa
    const solicitudes = await SolicitudReunion.find({
      $or: [
        { empresaSolicitaId: empresaId },
        { empresaObjetivoId: empresaId }
      ],
      estado: 'aceptada'
    })
      .populate('empresaSolicitaId', 'nombre')
      .populate('empresaObjetivoId', 'nombre')
      .lean();

    console.log(`📋 Solicitudes encontradas: ${solicitudes.length}`);

    const encuestasPendientes = [];

    for (const solicitud of solicitudes) {
      // Verificar si la reunión ya finalizó (fecha de fin pasada)
      const fechaFin = solicitud.finPropuesto;
      const fechaInicio = solicitud.inicioPropuesto;

      if (!fechaInicio || !fechaFin) {
        continue; // No hay fechas definidas
      }

      const now = new Date();
      const startTime = new Date(fechaInicio);
      const endTime = new Date(fechaFin);

      // Solo considerar reuniones que ya finalizaron (estado "completed")
      const reunionFinalizada = now > endTime;
      console.log(`📅 Solicitud ${solicitud._id}: Inicio: ${startTime.toISOString()}, Fin: ${endTime.toISOString()}, Finalizada: ${reunionFinalizada}`);

      if (!reunionFinalizada) {
        continue; // La reunión aún no ha finalizado
      }

      // Verificar si ya existe encuesta de esta empresa para esta solicitud
      const encuestaExistente = await EncuestaReunion.findOne({
        solicitudReunionId: solicitud._id,
        empresaId: empresaId
      }).lean();

      console.log(`📝 Encuesta existente para ${solicitud._id}: ${encuestaExistente ? 'SÍ' : 'NO'}`);

      if (!encuestaExistente) {
        // Determinar el ID de la empresa contraparte
        const empresaContraparteId = String(solicitud.empresaSolicitaId) === String(empresaId)
          ? solicitud.empresaObjetivoId
          : solicitud.empresaSolicitaId;

        // Obtener información completa de la empresa contraparte
        const empresaContraparte = await Empresa.findById(empresaContraparteId).lean();

        if (empresaContraparte) {
          encuestasPendientes.push({
            solicitudReunionId: solicitud._id,
            eventoId: solicitud.eventoId,
            empresaContraparte: {
              _id: empresaContraparte._id,
              nombre: empresaContraparte.nombre
            },
            fechaReunion: solicitud.inicioPropuesto,
            fechaFin: solicitud.finPropuesto,
            tipoReunion: solicitud.tipoReunion,
            mensaje: solicitud.mensaje
          });

          console.log(`✅ Encuesta pendiente agregada para reunión con: ${empresaContraparte.nombre}`);
        }
      }
    }

    console.log(`📊 Total encuestas pendientes: ${encuestasPendientes.length}`);

    res.json({
      pendientes: encuestasPendientes,
      total: encuestasPendientes.length
    });
  } catch (err: any) {
    handleError(err, res);
  }
}

/**
 * Verificar si ambas empresas completaron la encuesta para una solicitud
 */
export async function verificarEncuestaCompletaCtrl(req: Request, res: Response) {
  try {
    const { solicitudReunionId } = z.object({ solicitudReunionId: objectId }).parse(req.params);

    // Obtener la solicitud de reunión
    const solicitud = await SolicitudReunion.findById(solicitudReunionId)
      .populate('empresaSolicitaId', 'nombre')
      .populate('empresaObjetivoId', 'nombre')
      .lean();

    if (!solicitud) {
      return res.status(404).json({ error: 'NOT_FOUND' });
    }

    // Verificar si ambas empresas completaron la encuesta
    const encuestas = await EncuestaReunion.find({
      solicitudReunionId: solicitudReunionId
    }).lean();

    const empresasConEncuesta = encuestas.map(e => String(e.empresaId));
    const empresaSolicitanteId = String(solicitud.empresaSolicitaId);
    const empresaObjetivoId = String(solicitud.empresaObjetivoId);

    const ambasCompletaron = empresasConEncuesta.includes(empresaSolicitanteId) &&
      empresasConEncuesta.includes(empresaObjetivoId);

    res.json({
      solicitudReunionId,
      ambasCompletaron,
      empresasConEncuesta: {
        solicitante: empresasConEncuesta.includes(empresaSolicitanteId),
        objetivo: empresasConEncuesta.includes(empresaObjetivoId)
      },
      totalEncuestas: encuestas.length,
      fechaReunion: solicitud.inicioPropuesto,
      fechaFin: solicitud.finPropuesto,
      reunionFinalizada: (() => {
        if (!solicitud.inicioPropuesto || !solicitud.finPropuesto) return false;
        const now = new Date();
        const endTime = new Date(solicitud.finPropuesto);
        return now > endTime;
      })()
    });
  } catch (err: any) {
    handleError(err, res);
  }
}

/**
 * Métricas agregadas
 * - Promedios de 1..5
 * - NPS: %promotores (9–10) − %detractores (0–6)
 */
export async function metricasEncuestasCtrl(req: Request, res: Response) {
  try {
    const where: any = {};
    if (req.query.eventoId) where.eventoId = objectId.parse(String(req.query.eventoId));
    if (req.query.solicitudReunionId) where.solicitudReunionId = objectId.parse(String(req.query.solicitudReunionId));

    const pipeline: any[] = [{ $match: where }, {
      $group: {
        _id: null,
        count: { $sum: 1 },
        avg_general: { $avg: '$calificacion_general' },
        avg_match: { $avg: '$match_negocio' },
        avg_puntualidad: { $avg: '$puntualidad' },
        avg_interes: { $avg: '$interes_contraparte' },
        nps_promotores: {
          $sum: { $cond: [{ $gte: ['$recomendar_nps', 9] }, 1, 0] }
        },
        nps_detractores: {
          $sum: { $cond: [{ $lte: ['$recomendar_nps', 6] }, 1, 0] }
        }
      }
    }];

    const [agg] = await EncuestaReunion.aggregate(pipeline);
    if (!agg) return res.json({ count: 0 });

    const npsTotal = agg.nps_promotores + agg.nps_detractores;
    const nps = npsTotal > 0
      ? Math.round(((agg.nps_promotores / agg.count) * 100) - ((agg.nps_detractores / agg.count) * 100))
      : null;

    res.json({
      count: agg.count,
      avg: {
        general: Number(agg.avg_general?.toFixed(2) ?? null),
        match_negocio: Number(agg.avg_match?.toFixed(2) ?? null),
        puntualidad: Number(agg.avg_puntualidad?.toFixed(2) ?? null),
        interes_contraparte: Number(agg.avg_interes?.toFixed(2) ?? null),
      },
      nps
    });
  } catch (err: any) { handleError(err, res); }
}
