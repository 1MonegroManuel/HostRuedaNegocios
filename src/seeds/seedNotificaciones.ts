import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../config/env';

// Definir el esquema y modelo directamente aquí para evitar problemas de importación
type CanalNotificacion = 'app'|'email'|'sms'|'whatsapp';
type EstadoNotificacion = 'pendiente'|'enviada'|'leida'|'fallida';

interface NotificacionDoc extends mongoose.Document {
  eventoId?: mongoose.Types.ObjectId | null;
  reunionId?: mongoose.Types.ObjectId | null;
  empresaId?: mongoose.Types.ObjectId | null;
  usuarioId?: mongoose.Types.ObjectId | null;
  tipo: string;
  canal: CanalNotificacion;
  titulo: string;
  mensaje: string;
  payload?: Record<string, any> | null;
  estado: EstadoNotificacion;
  intento?: number | null;
  creada_en: Date;
  actualizada_en: Date;
}

const NotificacionSchema = new mongoose.Schema<NotificacionDoc>({
  eventoId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Evento', default: null, index: true },
  reunionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reunion', default: null, index: true },
  empresaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Empresa', default: null, index: true },
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null, index: true },
  tipo:   { type: String, required: true, trim: true },
  canal:  { type: String, enum: ['app','email','sms','whatsapp'], required: true, index: true },
  titulo: { type: String, required: true, trim: true },
  mensaje:{ type: String, required: true, trim: true },
  payload:{ type: mongoose.Schema.Types.Mixed, default: null },
  estado: { type: String, enum: ['pendiente','enviada','leida','fallida'], default: 'pendiente', index: true },
  intento:{ type: Number, default: null, min: 0 },
}, { timestamps: { createdAt: 'creada_en', updatedAt: 'actualizada_en' } });

const Notificacion = mongoose.models.Notificacion || mongoose.model<NotificacionDoc>('Notificacion', NotificacionSchema);

// Función para crear o actualizar una notificación
async function upsertNotificacion(notificacionData: Partial<NotificacionDoc>) {
  try {
    const notificacion = await Notificacion.create(notificacionData);
    console.log(`✅ Notificación creada: ${notificacion.tipo} - ${notificacion.estado} (ID: ${notificacion._id})`);
    return notificacion;
  } catch (error) {
    console.error(`❌ Error creando notificación:`, error);
    throw error;
  }
}

async function seedNotificaciones() {
  try {
    console.log('🌱 Iniciando seed de notificaciones...');
    
    // Conectar a MongoDB
    await mongoose.connect(env.MONGODB_URI);
    console.log('📡 Conectado a MongoDB');

    // Obtener datos existentes
    const Evento = mongoose.models.Evento || mongoose.model('Evento', new mongoose.Schema({}));
    const Reunion = mongoose.models.Reunion || mongoose.model('Reunion', new mongoose.Schema({}));
    const Empresa = mongoose.models.Empresa || mongoose.model('Empresa', new mongoose.Schema({}));
    const Usuario = mongoose.models.Usuario || mongoose.model('Usuario', new mongoose.Schema({}));

    const eventos = await Evento.find({}).limit(3);
    const reuniones = await Reunion.find({}).limit(10);
    const empresas = await Empresa.find({}).limit(10);
    const usuarios = await Usuario.find({}).limit(5);
    
    if (eventos.length === 0) {
      console.log('⚠️  Faltan datos necesarios. Ejecuta primero seedEventos.ts');
      return;
    }

    const evento1 = eventos[0];
    const reunionesEvento1 = reuniones.filter(r => r.eventoId.toString() === evento1._id.toString());
    const empresasEvento1 = empresas.filter(e => e.eventoId.toString() === evento1._id.toString());

    // Datos de notificaciones de prueba
    const notificacionesData = [];
    
    // Notificaciones de evento
    notificacionesData.push({
      eventoId: evento1._id,
      tipo: 'evento_programado',
      canal: 'email' as CanalNotificacion,
      titulo: 'Rueda de Negocios Beni 2024 - Recordatorio',
      mensaje: 'Te recordamos que el evento Rueda de Negocios Beni 2024 se realizará mañana a las 8:00 AM. ¡No olvides revisar tu agenda de reuniones!',
      payload: {
        evento: evento1.nombre,
        fecha: evento1.inicio,
        ubicacion: 'Centro de Convenciones Beni'
      },
      estado: 'enviada' as EstadoNotificacion,
      intento: 1
    });

    notificacionesData.push({
      eventoId: evento1._id,
      tipo: 'evento_inicio',
      canal: 'app' as CanalNotificacion,
      titulo: '¡El evento ha comenzado!',
      mensaje: 'La Rueda de Negocios Beni 2024 ha iniciado. Puedes ver tu agenda de reuniones en la aplicación.',
      payload: {
        evento: evento1.nombre,
        estado: 'iniciado'
      },
      estado: 'leida' as EstadoNotificacion,
      intento: 1
    });

    // Notificaciones de reuniones
    for (const reunion of reunionesEvento1.slice(0, 3)) {
      const empresaA = empresasEvento1.find(e => e._id.toString() === reunion.empresaAId.toString());
      const empresaB = empresasEvento1.find(e => e._id.toString() === reunion.empresaBId.toString());
      
      if (empresaA) {
        notificacionesData.push({
          eventoId: evento1._id,
          reunionId: reunion._id,
          empresaId: empresaA._id,
          tipo: 'reunion_programada',
          canal: 'email' as CanalNotificacion,
          titulo: 'Nueva reunión programada',
          mensaje: `Tienes una reunión programada para el ${reunion.inicio.toLocaleDateString('es-BO')} a las ${reunion.inicio.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}`,
          payload: {
            reunion: reunion._id,
            inicio: reunion.inicio,
            fin: reunion.fin,
            estado: reunion.estado
          },
          estado: reunion.estado === 'completada' ? 'leida' as EstadoNotificacion : 'enviada' as EstadoNotificacion,
          intento: 1
        });
      }

      if (empresaB) {
        notificacionesData.push({
          eventoId: evento1._id,
          reunionId: reunion._id,
          empresaId: empresaB._id,
          tipo: 'reunion_programada',
          canal: 'app' as CanalNotificacion,
          titulo: 'Reunión confirmada',
          mensaje: `Tu reunión del ${reunion.inicio.toLocaleDateString('es-BO')} ha sido confirmada`,
          payload: {
            reunion: reunion._id,
            inicio: reunion.inicio,
            fin: reunion.fin,
            estado: reunion.estado
          },
          estado: reunion.estado === 'completada' ? 'leida' as EstadoNotificacion : 'pendiente' as EstadoNotificacion,
          intento: reunion.estado === 'completada' ? 1 : null
        });
      }
    }

    // Notificaciones de solicitudes
    notificacionesData.push({
      eventoId: evento1._id,
      empresaId: empresasEvento1[0]?._id || null,
      tipo: 'solicitud_recibida',
      canal: 'email' as CanalNotificacion,
      titulo: 'Nueva solicitud de reunión',
      mensaje: 'Has recibido una nueva solicitud de reunión. Revisa los detalles en la aplicación.',
      payload: {
        solicitud: 'nueva',
        empresa_solicitante: 'Empresa solicitante'
      },
      estado: 'pendiente' as EstadoNotificacion
    });

    notificacionesData.push({
      eventoId: evento1._id,
      empresaId: empresasEvento1[1]?._id || null,
      tipo: 'solicitud_aceptada',
      canal: 'app' as CanalNotificacion,
      titulo: 'Solicitud aceptada',
      mensaje: 'Tu solicitud de reunión ha sido aceptada. La reunión ha sido programada.',
      payload: {
        solicitud: 'aceptada',
        reunion: 'programada'
      },
      estado: 'leida' as EstadoNotificacion,
      intento: 1
    });

    // Notificaciones de encuestas
    notificacionesData.push({
      eventoId: evento1._id,
      empresaId: empresasEvento1[0]?._id || null,
      tipo: 'encuesta_disponible',
      canal: 'email' as CanalNotificacion,
      titulo: 'Encuesta de satisfacción disponible',
      mensaje: 'Tu reunión ha finalizado. Por favor, completa la encuesta de satisfacción para ayudarnos a mejorar.',
      payload: {
        encuesta: 'disponible',
        reunion: 'completada'
      },
      estado: 'enviada' as EstadoNotificacion,
      intento: 1
    });

    // Notificaciones de sistema
    notificacionesData.push({
      tipo: 'sistema_mantenimiento',
      canal: 'app' as CanalNotificacion,
      titulo: 'Mantenimiento programado',
      mensaje: 'El sistema estará en mantenimiento el próximo domingo de 2:00 AM a 4:00 AM.',
      payload: {
        mantenimiento: true,
        fecha: '2024-12-22',
        inicio: '02:00',
        fin: '04:00'
      },
      estado: 'enviada' as EstadoNotificacion,
      intento: 1
    });

    // Notificaciones fallidas
    notificacionesData.push({
      eventoId: evento1._id,
      empresaId: empresasEvento1[2]?._id || null,
      tipo: 'reunion_recordatorio',
      canal: 'sms' as CanalNotificacion,
      titulo: 'Recordatorio de reunión',
      mensaje: 'Recordatorio: Tu reunión es en 30 minutos.',
      payload: {
        reunion: 'recordatorio',
        tiempo_restante: '30 minutos'
      },
      estado: 'fallida' as EstadoNotificacion,
      intento: 3
    });

    const notificacionesCreadas = [];
    
    // Crear notificaciones
    for (const notificacionData of notificacionesData) {
      const notificacion = await upsertNotificacion(notificacionData);
      notificacionesCreadas.push(notificacion);
    }

    console.log(`\n📊 Resumen de notificaciones:`);
    console.log(`   Total procesadas: ${notificacionesData.length}`);
    console.log(`   Creadas: ${notificacionesCreadas.length}`);

    // Mostrar notificaciones creadas por tipo
    console.log(`\n📋 Notificaciones por tipo:`);
    const tipos = [...new Set(notificacionesCreadas.map(n => n.tipo))];
    for (const tipo of tipos) {
      const notificacionesDelTipo = notificacionesCreadas.filter(n => n.tipo === tipo);
      console.log(`   ${tipo}: ${notificacionesDelTipo.length}`);
    }

    // Mostrar notificaciones por estado
    console.log(`\n📋 Notificaciones por estado:`);
    const estados = ['pendiente', 'enviada', 'leida', 'fallida'];
    for (const estado of estados) {
      const notificacionesDelEstado = notificacionesCreadas.filter(n => n.estado === estado);
      if (notificacionesDelEstado.length > 0) {
        console.log(`   ${estado.toUpperCase()}: ${notificacionesDelEstado.length}`);
      }
    }

    // Mostrar notificaciones por canal
    console.log(`\n📋 Notificaciones por canal:`);
    const canales = ['app', 'email', 'sms', 'whatsapp'];
    for (const canal of canales) {
      const notificacionesDelCanal = notificacionesCreadas.filter(n => n.canal === canal);
      if (notificacionesDelCanal.length > 0) {
        console.log(`   ${canal.toUpperCase()}: ${notificacionesDelCanal.length}`);
      }
    }

    // Estadísticas de entrega
    const notificacionesEnviadas = notificacionesCreadas.filter(n => n.estado === 'enviada').length;
    const notificacionesLeidas = notificacionesCreadas.filter(n => n.estado === 'leida').length;
    const notificacionesFallidas = notificacionesCreadas.filter(n => n.estado === 'fallida').length;
    const tasaEntrega = notificacionesCreadas.length > 0 ? 
      (((notificacionesEnviadas + notificacionesLeidas) / notificacionesCreadas.length) * 100).toFixed(1) : '0';
    const tasaLectura = (notificacionesEnviadas + notificacionesLeidas) > 0 ? 
      ((notificacionesLeidas / (notificacionesEnviadas + notificacionesLeidas)) * 100).toFixed(1) : '0';

    console.log(`\n📈 Estadísticas de entrega:`);
    console.log(`   Tasa de entrega: ${tasaEntrega}%`);
    console.log(`   Tasa de lectura: ${tasaLectura}%`);
    console.log(`   Notificaciones fallidas: ${notificacionesFallidas}`);

    console.log('\n✅ Seed de notificaciones completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error en seed de notificaciones:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('📡 Desconectado de MongoDB');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedNotificaciones()
    .then(() => {
      console.log('🎉 Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

export default seedNotificaciones;
