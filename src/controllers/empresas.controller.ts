import { Request, Response } from 'express';
import { z } from 'zod';
import Empresa from '../models/empresas.model';
import Mesa from '../models/mesa.model';
import Evento from '../models/eventos.model';
import { notificacionService } from '../services/notificacion.service';

// Schemas
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'ObjectId inválido');

const createEmpresaSchema = z.object({
  eventoId: objectId,
  mesaId: objectId.nullable().optional(),

  nombre: z.string().min(2),
  nit: z.string().min(3).nullable().optional(),
  rubro: z.string().min(2).nullable().optional(),
  representante: z.string().min(2).nullable().optional(),
  telefono: z.string().min(5).nullable().optional(),
  email: z.string().email().nullable().optional(),
  sitio_web: z.string().url().nullable().optional(),
  logo_url: z.string().url().nullable().optional(),
  descripcion: z.string().min(3).nullable().optional(),
  comprobante_pago_url: z.string().url().nullable().optional(),

  // Nuevos campos
  estado: z.enum(['pendiente', 'aceptado', 'rechazado']).optional(),
  isVirtual: z.boolean().optional(),
  encargadoId: objectId.nullable().optional(),
  personalIds: z.array(objectId).optional(),
});

const updateEmpresaSchema = z.record(z.string(), z.any());

// Utilidades de error
function handleError(err: any, res: Response) {
  if (err?.name === 'ZodError') {
    console.error('❌ Error de validación:', err.errors);
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

// Verifica que la mesa pertenezca al mismo evento y que no esté ocupada
async function verificarMesaDisponible(mesaId: string, eventoId: string, empresaIdAExcluir?: string) {
  const mesa = await Mesa.findById(mesaId).lean();
  if (!mesa) throw new Error('Mesa no encontrada');
  if (String(mesa.eventoId) !== String(eventoId)) {
    const e = new Error('La mesa no pertenece al evento especificado');
    (e as any).statusCode = 409;
    throw e;
  }
  if (!mesa.activa) {
    const e = new Error('La mesa no está activa');
    (e as any).statusCode = 409;
    throw e;
  }
  if (mesa.ocupada) {
    const e = new Error('La mesa ya está ocupada');
    (e as any).statusCode = 409;
    throw e;
  }
}

// Crear mesas automáticamente si no existen para un evento
async function crearMesasParaEvento(eventoId: string) {
  console.log(`🔍 Verificando mesas para evento: ${eventoId}`);
  
  // Obtener información del evento
  const evento = await Evento.findById(eventoId).lean();
  if (!evento) {
    throw new Error('Evento no encontrado');
  }
  
  // Obtener el número máximo de mesa existente para este evento
  const ultimaMesa = await Mesa.findOne({ eventoId }).sort({ numero: -1 }).lean();
  const numeroMaximo = ultimaMesa ? ultimaMesa.numero : 0;
  
  console.log(`📊 Última mesa: ${numeroMaximo}, Mesas requeridas: ${evento.numero_mesas}`);
  
  if (numeroMaximo >= evento.numero_mesas) {
    console.log(`✅ Ya existen suficientes mesas para el evento`);
    return;
  }
  
  // Crear las mesas faltantes
  const mesasACrear = evento.numero_mesas - numeroMaximo;
  console.log(`🔨 Creando ${mesasACrear} mesas faltantes`);
  
  const mesasNuevas = [];
  for (let i = 1; i <= mesasACrear; i++) {
    const numeroMesa = numeroMaximo + i;
    const nombreMesa = `${evento.nombre} - Mesa ${numeroMesa}`;
    
    try {
      const mesa = await Mesa.create({
        eventoId,
        numero: numeroMesa,
        nombre: nombreMesa,
        capacidad: 5, // Capacidad por defecto de 5 asientos
        activa: true, // Disponible para asignación
        ocupada: false // No ocupada inicialmente
      });
      mesasNuevas.push(mesa);
      console.log(`✅ Mesa creada: ${mesa._id} (${nombreMesa}) - Capacidad: 5 asientos`);
    } catch (error) {
      console.error(`❌ Error creando mesa ${numeroMesa}:`, error);
      // Continuar con la siguiente mesa
    }
  }
  
  return mesasNuevas;
}

// Asignar mesa aleatoria disponible a una empresa
async function asignarMesaAleatoria(eventoId: string, empresaId: string) {
  console.log(`🎲 Asignando mesa aleatoria para empresa: ${empresaId} en evento: ${eventoId}`);
  
  // Obtener información del evento
  const evento = await Evento.findById(eventoId).lean();
  if (!evento) {
    throw new Error('Evento no encontrado');
  }
  
  // Obtener mesas disponibles (activa: true y ocupada: false)
  let mesasDisponibles = await Mesa.find({ 
    eventoId, 
    activa: true,
    ocupada: false
  }).lean();
  
  console.log(`📊 Mesas disponibles encontradas: ${mesasDisponibles.length}`);
  
  // Si no hay mesas disponibles, crear una nueva
  if (mesasDisponibles.length === 0) {
    console.log(`🔨 No hay mesas disponibles, creando nueva mesa`);
    
    // Obtener el número máximo de mesa existente para este evento
    const ultimaMesa = await Mesa.findOne({ eventoId }).sort({ numero: -1 }).lean();
    const numeroMaximo = ultimaMesa ? ultimaMesa.numero : 0;
    
    // Verificar si podemos crear más mesas
    if (numeroMaximo >= evento.numero_mesas) {
      throw new Error(`Se ha alcanzado el límite máximo de ${evento.numero_mesas} mesas para este evento`);
    }
    
    const numeroNuevaMesa = numeroMaximo + 1;
    const nombreNuevaMesa = `${evento.nombre} - Mesa ${numeroNuevaMesa}`;
    
    try {
      const nuevaMesa = await Mesa.create({
        eventoId,
        numero: numeroNuevaMesa,
        nombre: nombreNuevaMesa,
        capacidad: 5,
        activa: true,
        ocupada: false // Crear como disponible, se marcará como ocupada después
      });
      
      console.log(`✅ Nueva mesa creada: ${nuevaMesa._id} (${nombreNuevaMesa})`);
      
      // Marcar como ocupada después de crearla
      await Mesa.findByIdAndUpdate(nuevaMesa._id, { ocupada: true });
      console.log(`🔒 Mesa ${nuevaMesa._id} marcada como ocupada`);
      
      return nuevaMesa._id;
      
    } catch (error) {
      console.error(`❌ Error creando nueva mesa:`, error);
      throw new Error('No se pudo crear una nueva mesa para la empresa');
    }
  }
  
  // Seleccionar mesa aleatoria de las disponibles
  const mesaAleatoria = mesasDisponibles[Math.floor(Math.random() * mesasDisponibles.length)];
  console.log(`🎯 Mesa seleccionada: ${mesaAleatoria._id} (${mesaAleatoria.nombre})`);
  
  // Marcar mesa como ocupada
  await Mesa.findByIdAndUpdate(mesaAleatoria._id, { ocupada: true });
  console.log(`🔒 Mesa ${mesaAleatoria._id} marcada como ocupada`);
  
  return mesaAleatoria._id;
}

// Crear empresa
export async function crearEmpresaCtrl(req: Request, res: Response) {
  try {
    const data = createEmpresaSchema.parse(req.body);

    if (data.mesaId) {
      await verificarMesaDisponible(data.mesaId, data.eventoId);
    }

    const doc = await Empresa.create({
      ...data,
      email: data.email?.toLowerCase() ?? null
    });

    // Notificar nueva empresa registrada
    try {
      await notificacionService.notificarNuevaEmpresa(doc);
    } catch (notificationError) {
      console.error('❌ Error enviando notificación de nueva empresa:', notificationError);
      // No fallar la operación principal si falla la notificación
    }

    res.status(201).json(doc);
  } catch (err: any) {
    handleError(err, res);
  }
}

// Listar empresas (paginado, filtros y búsqueda)
export async function listarEmpresasCtrl(req: Request, res: Response) {
  try {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit ?? 20), 1), 100);
    const skip = (page - 1) * limit;

    const filtro: any = {};
    if (req.query.eventoId) {
      const { eventoId } = z.object({ eventoId: objectId }).parse({ eventoId: String(req.query.eventoId) });
      filtro.eventoId = eventoId;
    }
    if (req.query.mesaId) {
      const { mesaId } = z.object({ mesaId: objectId }).parse({ mesaId: String(req.query.mesaId) });
      filtro.mesaId = mesaId;
    }
    if (typeof req.query.asignada !== 'undefined') {
      // asignada=true -> mesaId != null, asignada=false -> mesaId == null
      const asignada = String(req.query.asignada) === 'true';
      filtro.mesaId = asignada ? { $ne: null } : null;
    }
    if (req.query.q) {
      const q = String(req.query.q).trim();
      filtro.$or = [
        { nombre: new RegExp(q, 'i') },
        { rubro: new RegExp(q, 'i') },
        { representante: new RegExp(q, 'i') },
      ];
    }

    const [items, total] = await Promise.all([
      Empresa.find(filtro).sort({ creada_en: -1 }).skip(skip).limit(limit).lean(),
      Empresa.countDocuments(filtro),
    ]);

    res.json({ data: items, total, page, limit });
  } catch (err: any) {
    handleError(err, res);
  }
}

// Listar por evento (paginado)
export async function listarEmpresasPorEventoCtrl(req: Request, res: Response) {
  try {
    const { eventoId } = z.object({ eventoId: objectId }).parse(req.params);
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit ?? 20), 1), 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Empresa.find({ eventoId }).sort({ creada_en: -1 }).skip(skip).limit(limit).lean(),
      Empresa.countDocuments({ eventoId }),
    ]);

    res.json({ data: items, total, page, limit });
  } catch (err: any) {
    handleError(err, res);
  }
}

// Obtener empresa por encargado
export async function getEmpresaByEncargadoCtrl(req: Request, res: Response) {
  try {
    const { encargadoId } = z.object({ encargadoId: objectId }).parse(req.params);
    
    const empresa = await Empresa.findOne({ encargadoId }).lean();
    
    if (!empresa) {
      return res.status(404).json({ error: 'EMPRESA_NOT_FOUND', message: 'No se encontró empresa para este encargado' });
    }

    res.json(empresa);
  } catch (err: any) {
    handleError(err, res);
  }
}

// Obtener empresa por empleado (personal)
export async function getEmpresaByPersonalCtrl(req: Request, res: Response) {
  try {
    const { personalId } = z.object({ personalId: objectId }).parse(req.params);
    
    const empresa = await Empresa.findOne({ personalIds: personalId }).lean();
    
    if (!empresa) {
      return res.status(404).json({ error: 'EMPRESA_NOT_FOUND', message: 'No se encontró empresa para este empleado' });
    }

    res.json(empresa);
  } catch (err: any) {
    handleError(err, res);
  }
}

// Obtener una empresa
export async function obtenerEmpresaCtrl(req: Request, res: Response) {
  try {
    const { id } = z.object({ id: objectId }).parse(req.params);
    const doc = await Empresa.findById(id).lean();
    if (!doc) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(doc);
  } catch (err: any) {
    handleError(err, res);
  }
}

// Actualizar empresa (incluye reasignación de mesa y asignación automática al aceptar)
export async function actualizarEmpresaCtrl(req: Request, res: Response) {
  try {
    const { id } = req.params;
    console.log(`📥 Actualizando empresa ${id} con datos:`, req.body);
    
    const data = req.body;
    console.log(`✅ Datos recibidos:`, data);

    // Normalizaciones
    if (data.email) data.email = data.email.toLowerCase();
    if ('sitio_web' in data && data.sitio_web === '') (data as any).sitio_web = null;
    if ('logo_url' in data && data.logo_url === '') (data as any).logo_url = null;
    if ('comprobante_pago_url' in data && data.comprobante_pago_url === '') (data as any).comprobante_pago_url = null;

    // Obtener empresa actual para verificar cambios
    const empresaActual = await Empresa.findById(id).lean();
    if (!empresaActual) return res.status(404).json({ error: 'NOT_FOUND' });

    // Si se está aceptando la empresa y no es virtual, asignar mesa automáticamente
    if (data.estado === 'aceptado') {
      console.log(`🎉 Empresa ${id} siendo aceptada`);
      console.log(`📊 Estado actual: ${empresaActual.estado} -> nuevo estado: ${data.estado}`);
      
      // Verificar si la empresa es virtual
      const isVirtual = data.isVirtual !== undefined ? data.isVirtual : empresaActual.isVirtual;
      console.log(`💻 Empresa virtual: ${isVirtual} (data.isVirtual: ${data.isVirtual}, empresaActual.isVirtual: ${empresaActual.isVirtual})`);
      
      if (!isVirtual) {
        console.log(`🏢 Empresa no virtual, asignando mesa automáticamente`);
        try {
          const mesaId = await asignarMesaAleatoria(String(empresaActual.eventoId), id);
          (data as any).mesaId = mesaId;
          console.log(`✅ Mesa ${mesaId} asignada a empresa ${id} - data.mesaId:`, data.mesaId);
        } catch (error) {
          console.error(`❌ Error asignando mesa:`, error);
          // No fallar la actualización si no se puede asignar mesa
          console.log(`⚠️ Continuando sin asignar mesa`);
        }
      } else {
        console.log(`💻 Empresa virtual, no se asigna mesa`);
      }
    }

    // Si se está rechazando o poniendo pendiente, liberar mesa
    if ((data.estado === 'rechazado' || data.estado === 'pendiente') && empresaActual.estado === 'aceptado') {
      console.log(`🔄 Empresa ${id} cambiando de aceptado a ${data.estado}, liberando mesa`);
      
      // Si la empresa tenía una mesa asignada, liberarla
      if (empresaActual.mesaId) {
        await Mesa.findByIdAndUpdate(empresaActual.mesaId, { ocupada: false });
        console.log(`🔓 Mesa ${empresaActual.mesaId} liberada (ocupada: false)`);
      }
      
      (data as any).mesaId = null;
    }

    // Si intenta asignar (o cambiar) mesa manualmente, validar coherencia
    // Solo verificar si la mesa se está asignando manualmente (no automáticamente)
    if (data.mesaId && String(data.mesaId) !== String(empresaActual.mesaId) && !data.estado) {
      const eventoId = data.eventoId ? data.eventoId : String(empresaActual.eventoId);
      await verificarMesaDisponible(data.mesaId, String(eventoId), id);
    }

    console.log(`📝 Datos a actualizar para empresa ${id}:`, JSON.stringify(data, null, 2));
    
    const doc = await Empresa.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ error: 'NOT_FOUND' });
    
    console.log(`✅ Empresa actualizada - mesaId guardado:`, doc.mesaId);

    // Notificar cambio de estado si hubo cambio
    if (data.estado && empresaActual.estado !== data.estado) {
      try {
        await notificacionService.notificarCambioEstadoEmpresa(doc, empresaActual.estado, data.estado);
      } catch (notificationError) {
        console.error('❌ Error enviando notificación de cambio de estado:', notificationError);
        // No fallar la operación principal si falla la notificación
      }
    }

    // Notificar asignación de mesa si se asignó una nueva
    if (data.mesaId && empresaActual.mesaId !== data.mesaId) {
      try {
        const mesa = await Mesa.findById(data.mesaId).lean();
        if (mesa) {
          await notificacionService.notificarMesaAsignada(doc, mesa);
        }
      } catch (notificationError) {
        console.error('❌ Error enviando notificación de mesa asignada:', notificationError);
        // No fallar la operación principal si falla la notificación
      }
    }

    // Notificar asignación de encargado si se asignó uno nuevo
    if (data.encargadoId && empresaActual.encargadoId !== data.encargadoId) {
      try {
        await notificacionService.notificarEncargadoAsignado(
          String(data.encargadoId), 
          String(doc._id), 
          doc.nombre
        );
      } catch (notificationError) {
        console.error('❌ Error enviando notificación de encargado asignado:', notificationError);
        // No fallar la operación principal si falla la notificación
      }
    }

    res.json(doc);
  } catch (err: any) {
    handleError(err, res);
  }
}

// Eliminar empresa
export async function eliminarEmpresaCtrl(req: Request, res: Response) {
  try {
    const { id } = z.object({ id: objectId }).parse(req.params);
    const doc = await Empresa.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json({ ok: true });
  } catch (err: any) {
    handleError(err, res);
  }
}
