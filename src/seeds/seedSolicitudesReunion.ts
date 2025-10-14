import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../config/env';

// Definir el esquema y modelo directamente aquí para evitar problemas de importación
type EstadoSolicitud = 'pendiente'|'aceptada'|'rechazada'|'cancelada';

interface SolicitudReunionDoc extends mongoose.Document {
  eventoId: mongoose.Types.ObjectId;
  empresaSolicitaId: mongoose.Types.ObjectId;
  empresaObjetivoId: mongoose.Types.ObjectId;
  mesaPreferidaId?: mongoose.Types.ObjectId | null;
  inicioPropuesto?: Date | null;
  finPropuesto?: Date | null;
  mensaje?: string | null;
  estado: EstadoSolicitud;
  creada_en: Date;
  actualizada_en: Date;
}

const SolicitudReunionSchema = new mongoose.Schema<SolicitudReunionDoc>({
  eventoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Evento', required: true, index: true },
  empresaSolicitaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Empresa', required: true, index: true },
  empresaObjetivoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Empresa', required: true, index: true },
  mesaPreferidaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mesa', default: null },
  inicioPropuesto: { type: Date, default: null },
  finPropuesto: { type: Date, default: null },
  mensaje: { type: String, default: null, trim: true },
  estado: { type: String, enum: ['pendiente','aceptada','rechazada','cancelada'], default: 'pendiente', index: true },
}, { timestamps: { createdAt: 'creada_en', updatedAt: 'actualizada_en' } });

// Evita duplicar solicitudes PENDIENTES entre el mismo par en el mismo evento
SolicitudReunionSchema.index(
  { eventoId: 1, empresaSolicitaId: 1, empresaObjetivoId: 1, estado: 1 },
  { unique: true, partialFilterExpression: { estado: 'pendiente' } }
);

const SolicitudReunion = mongoose.models.SolicitudReunion || mongoose.model<SolicitudReunionDoc>('SolicitudReunion', SolicitudReunionSchema);

// Función para crear o actualizar una solicitud
async function upsertSolicitud(solicitudData: Partial<SolicitudReunionDoc>) {
  try {
    // Verificar si ya existe una solicitud pendiente entre las mismas empresas
    const existingSolicitud = await SolicitudReunion.findOne({
      eventoId: solicitudData.eventoId,
      empresaSolicitaId: solicitudData.empresaSolicitaId,
      empresaObjetivoId: solicitudData.empresaObjetivoId,
      estado: 'pendiente'
    });
    
    if (existingSolicitud) {
      console.log(`⚠️  Solicitud pendiente ya existe entre las empresas, omitiendo...`);
      return existingSolicitud;
    }

    const solicitud = await SolicitudReunion.create(solicitudData);
    console.log(`✅ Solicitud creada: ${solicitud.estado} (ID: ${solicitud._id})`);
    return solicitud;
  } catch (error) {
    console.error(`❌ Error creando solicitud:`, error);
    throw error;
  }
}

async function seedSolicitudesReunion() {
  try {
    console.log('🌱 Iniciando seed de solicitudes de reunión...');
    
    // Conectar a MongoDB
    await mongoose.connect(env.MONGODB_URI);
    console.log('📡 Conectado a MongoDB');

    // Obtener datos existentes
    const Evento = mongoose.models.Evento || mongoose.model('Evento', new mongoose.Schema({}));
    const Mesa = mongoose.models.Mesa || mongoose.model('Mesa', new mongoose.Schema({}));
    const Empresa = mongoose.models.Empresa || mongoose.model('Empresa', new mongoose.Schema({}));

    const eventos = await Evento.find({}).limit(3);
    const mesas = await Mesa.find({ activa: true }).limit(10);
    const empresas = await Empresa.find({}).limit(10);
    
    if (eventos.length === 0 || empresas.length < 2) {
      console.log('⚠️  Faltan datos necesarios. Ejecuta primero seedEventos.ts y seedEmpresas.ts');
      return;
    }

    const evento1 = eventos[0];
    const mesasEvento1 = mesas.filter(m => m.eventoId.toString() === evento1._id.toString());
    const empresasEvento1 = empresas.filter(e => e.eventoId.toString() === evento1._id.toString());

    if (empresasEvento1.length < 2) {
      console.log('⚠️  No hay empresas suficientes para el evento principal');
      return;
    }

    // Datos de solicitudes de prueba
    const solicitudesData = [];
    
    // Crear solicitudes para el evento principal
    const fechaBase = new Date('2024-12-15T08:00:00.000Z');
    
    // Solicitud 1: AgroBeni solicita reunión con Ganadería del Norte
    if (empresasEvento1.length >= 2) {
      solicitudesData.push({
        eventoId: evento1._id,
        empresaSolicitaId: empresasEvento1[0]._id, // AgroBeni
        empresaObjetivoId: empresasEvento1[1]._id, // Ganadería del Norte
        mesaPreferidaId: mesasEvento1[0]?._id || null,
        inicioPropuesto: new Date(fechaBase.getTime() + 0 * 30 * 60000), // 8:00
        finPropuesto: new Date(fechaBase.getTime() + 1 * 30 * 60000), // 8:30
        mensaje: 'Nos interesa explorar oportunidades de colaboración en el sector agropecuario',
        estado: 'pendiente' as EstadoSolicitud
      });
    }

    // Solicitud 2: Turismo Ribereño solicita reunión con AgroBeni
    if (empresasEvento1.length >= 3) {
      solicitudesData.push({
        eventoId: evento1._id,
        empresaSolicitaId: empresasEvento1[2]._id, // Turismo Ribereño
        empresaObjetivoId: empresasEvento1[0]._id, // AgroBeni
        mesaPreferidaId: mesasEvento1[1]?._id || null,
        inicioPropuesto: new Date(fechaBase.getTime() + 1 * 30 * 60000), // 8:30
        finPropuesto: new Date(fechaBase.getTime() + 2 * 30 * 60000), // 9:00
        mensaje: 'Propuesta de turismo rural en fincas agrícolas',
        estado: 'aceptada' as EstadoSolicitud
      });
    }

    // Solicitud 3: Ganadería del Norte solicita reunión con Turismo Ribereño
    if (empresasEvento1.length >= 3) {
      solicitudesData.push({
        eventoId: evento1._id,
        empresaSolicitaId: empresasEvento1[1]._id, // Ganadería del Norte
        empresaObjetivoId: empresasEvento1[2]._id, // Turismo Ribereño
        mesaPreferidaId: mesasEvento1[2]?._id || null,
        inicioPropuesto: new Date(fechaBase.getTime() + 2 * 30 * 60000), // 9:00
        finPropuesto: new Date(fechaBase.getTime() + 3 * 30 * 60000), // 9:30
        mensaje: 'Interés en desarrollar turismo ganadero',
        estado: 'rechazada' as EstadoSolicitud
      });
    }

    // Solicitud 4: Solicitud cancelada
    if (empresasEvento1.length >= 2) {
      solicitudesData.push({
        eventoId: evento1._id,
        empresaSolicitaId: empresasEvento1[1]._id, // Ganadería del Norte
        empresaObjetivoId: empresasEvento1[0]._id, // AgroBeni
        mesaPreferidaId: null,
        inicioPropuesto: new Date(fechaBase.getTime() + 3 * 30 * 60000), // 9:30
        finPropuesto: new Date(fechaBase.getTime() + 4 * 30 * 60000), // 10:00
        mensaje: 'Solicitud cancelada por cambio de agenda',
        estado: 'cancelada' as EstadoSolicitud
      });
    }

    // Solicitud 5: Nueva solicitud pendiente
    if (empresasEvento1.length >= 3) {
      solicitudesData.push({
        eventoId: evento1._id,
        empresaSolicitaId: empresasEvento1[0]._id, // AgroBeni
        empresaObjetivoId: empresasEvento1[2]._id, // Turismo Ribereño
        mesaPreferidaId: mesasEvento1[0]?._id || null,
        inicioPropuesto: new Date(fechaBase.getTime() + 4 * 30 * 60000), // 10:00
        finPropuesto: new Date(fechaBase.getTime() + 5 * 30 * 60000), // 10:30
        mensaje: 'Seguimiento de la reunión anterior',
        estado: 'pendiente' as EstadoSolicitud
      });
    }

    const solicitudesCreadas = [];
    
    // Crear solicitudes
    for (const solicitudData of solicitudesData) {
      const solicitud = await upsertSolicitud(solicitudData);
      solicitudesCreadas.push(solicitud);
    }

    console.log(`\n📊 Resumen de solicitudes:`);
    console.log(`   Total procesadas: ${solicitudesData.length}`);
    console.log(`   Creadas: ${solicitudesCreadas.length}`);
    console.log(`   Omitidas (ya existían): ${solicitudesData.length - solicitudesCreadas.length}`);

    // Mostrar solicitudes creadas por estado
    console.log(`\n📋 Solicitudes por estado:`);
    const estados = ['pendiente', 'aceptada', 'rechazada', 'cancelada'];
    for (const estado of estados) {
      const solicitudesDelEstado = solicitudesCreadas.filter(s => s.estado === estado);
      if (solicitudesDelEstado.length > 0) {
        console.log(`   ${estado.toUpperCase()}: ${solicitudesDelEstado.length}`);
        for (const solicitud of solicitudesDelEstado) {
          const inicio = solicitud.inicioPropuesto?.toLocaleTimeString('es-BO', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }) || 'Sin horario';
          console.log(`     • ${inicio} - ${solicitud.mensaje || 'Sin mensaje'}`);
        }
      }
    }

    // Estadísticas de solicitudes
    const solicitudesPendientes = solicitudesCreadas.filter(s => s.estado === 'pendiente').length;
    const solicitudesAceptadas = solicitudesCreadas.filter(s => s.estado === 'aceptada').length;
    const tasaAceptacion = solicitudesCreadas.length > 0 ? 
      ((solicitudesAceptadas / solicitudesCreadas.length) * 100).toFixed(1) : '0';

    console.log(`\n📈 Estadísticas:`);
    console.log(`   Solicitudes pendientes: ${solicitudesPendientes}`);
    console.log(`   Tasa de aceptación: ${tasaAceptacion}%`);

    console.log('\n✅ Seed de solicitudes de reunión completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error en seed de solicitudes de reunión:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('📡 Desconectado de MongoDB');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedSolicitudesReunion()
    .then(() => {
      console.log('🎉 Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

export default seedSolicitudesReunion;
