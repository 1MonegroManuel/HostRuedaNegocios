import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../config/env';

// Definir el esquema y modelo directamente aquí para evitar problemas de importación
interface EncuestaReunionDoc extends mongoose.Document {
  eventoId: mongoose.Types.ObjectId;
  reunionId: mongoose.Types.ObjectId;
  empresaId: mongoose.Types.ObjectId;
  calificacion_general: number;
  match_negocio?: number | null;
  puntualidad?: number | null;
  interes_contraparte?: number | null;
  recomendar_nps?: number | null;
  comentarios?: string | null;
  creada_en: Date;
  actualizada_en: Date;
}

const EncuestaSchema = new mongoose.Schema<EncuestaReunionDoc>({
  eventoId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Evento', required: true, index: true },
  reunionId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Reunion', required: true, index: true },
  empresaId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Empresa', required: true, index: true },
  calificacion_general: { type: Number, required: true, min: 1, max: 5 },
  match_negocio:        { type: Number, default: null, min: 1, max: 5 },
  puntualidad:          { type: Number, default: null, min: 1, max: 5 },
  interes_contraparte:  { type: Number, default: null, min: 1, max: 5 },
  recomendar_nps:       { type: Number, default: null, min: 0, max: 10 },
  comentarios:          { type: String, default: null, trim: true },
}, { timestamps: { createdAt: 'creada_en', updatedAt: 'actualizada_en' } });

// Evita duplicar una encuesta de la misma empresa en la misma reunión
EncuestaSchema.index({ reunionId: 1, empresaId: 1 }, { unique: true });

const EncuestaReunion = mongoose.models.EncuestaReunion || mongoose.model<EncuestaReunionDoc>('EncuestaReunion', EncuestaSchema);

// Función para crear o actualizar una encuesta
async function upsertEncuesta(encuestaData: Partial<EncuestaReunionDoc>) {
  try {
    // Verificar si ya existe una encuesta de la misma empresa en la misma reunión
    const existingEncuesta = await EncuestaReunion.findOne({
      reunionId: encuestaData.reunionId,
      empresaId: encuestaData.empresaId
    });
    
    if (existingEncuesta) {
      console.log(`⚠️  Encuesta ya existe para la empresa en esta reunión, omitiendo...`);
      return existingEncuesta;
    }

    const encuesta = await EncuestaReunion.create(encuestaData);
    console.log(`✅ Encuesta creada: Calificación ${encuesta.calificacion_general}/5 (ID: ${encuesta._id})`);
    return encuesta;
  } catch (error) {
    console.error(`❌ Error creando encuesta:`, error);
    throw error;
  }
}

async function seedEncuestas() {
  try {
    console.log('🌱 Iniciando seed de encuestas...');
    
    // Conectar a MongoDB
    await mongoose.connect(env.MONGODB_URI);
    console.log('📡 Conectado a MongoDB');

    // Obtener datos existentes
    const Evento = mongoose.models.Evento || mongoose.model('Evento', new mongoose.Schema({}));
    const Reunion = mongoose.models.Reunion || mongoose.model('Reunion', new mongoose.Schema({}));
    const Empresa = mongoose.models.Empresa || mongoose.model('Empresa', new mongoose.Schema({}));

    const eventos = await Evento.find({}).limit(3);
    const reuniones = await Reunion.find({}).limit(10);
    const empresas = await Empresa.find({}).limit(10);
    
    if (eventos.length === 0 || reuniones.length === 0 || empresas.length === 0) {
      console.log('⚠️  Faltan datos necesarios. Ejecuta primero seedEventos.ts, seedReuniones.ts y seedEmpresas.ts');
      return;
    }

    const evento1 = eventos[0];
    const reunionesEvento1 = reuniones.filter(r => r.eventoId.toString() === evento1._id.toString());
    const empresasEvento1 = empresas.filter(e => e.eventoId.toString() === evento1._id.toString());

    if (reunionesEvento1.length === 0 || empresasEvento1.length === 0) {
      console.log('⚠️  No hay reuniones o empresas suficientes para el evento principal');
      return;
    }

    // Datos de encuestas de prueba
    const encuestasData = [];
    
    // Crear encuestas para las reuniones completadas
    const reunionesCompletadas = reunionesEvento1.filter(r => r.estado === 'completada');
    
    for (const reunion of reunionesCompletadas) {
      // Buscar las empresas participantes en esta reunión
      const empresaA = empresasEvento1.find(e => e._id.toString() === reunion.empresaAId.toString());
      const empresaB = empresasEvento1.find(e => e._id.toString() === reunion.empresaBId.toString());
      
      if (empresaA) {
        encuestasData.push({
          eventoId: evento1._id,
          reunionId: reunion._id,
          empresaId: empresaA._id,
          calificacion_general: 5,
          match_negocio: 4,
          puntualidad: 5,
          interes_contraparte: 5,
          recomendar_nps: 9,
          comentarios: 'Excelente reunión, muy productiva y con gran potencial de colaboración'
        });
      }
      
      if (empresaB) {
        encuestasData.push({
          eventoId: evento1._id,
          reunionId: reunion._id,
          empresaId: empresaB._id,
          calificacion_general: 4,
          match_negocio: 5,
          puntualidad: 4,
          interes_contraparte: 4,
          recomendar_nps: 8,
          comentarios: 'Muy buena experiencia, esperamos continuar el diálogo'
        });
      }
    }

    // Crear encuestas para reuniones confirmadas (simulando respuestas anticipadas)
    const reunionesConfirmadas = reunionesEvento1.filter(r => r.estado === 'confirmada');
    
    for (const reunion of reunionesConfirmadas) {
      const empresaA = empresasEvento1.find(e => e._id.toString() === reunion.empresaAId.toString());
      const empresaB = empresasEvento1.find(e => e._id.toString() === reunion.empresaBId.toString());
      
      if (empresaA) {
        encuestasData.push({
          eventoId: evento1._id,
          reunionId: reunion._id,
          empresaId: empresaA._id,
          calificacion_general: 3,
          match_negocio: 3,
          puntualidad: null, // No se ha realizado aún
          interes_contraparte: 4,
          recomendar_nps: 7,
          comentarios: 'Reunión programada, expectativas altas'
        });
      }
    }

    // Crear encuestas para reuniones programadas (simulando expectativas)
    const reunionesProgramadas = reunionesEvento1.filter(r => r.estado === 'programada');
    
    for (const reunion of reunionesProgramadas.slice(0, 1)) { // Solo una para no saturar
      const empresaA = empresasEvento1.find(e => e._id.toString() === reunion.empresaAId.toString());
      
      if (empresaA) {
        encuestasData.push({
          eventoId: evento1._id,
          reunionId: reunion._id,
          empresaId: empresaA._id,
          calificacion_general: 2, // Expectativa inicial
          match_negocio: 2,
          puntualidad: null,
          interes_contraparte: 3,
          recomendar_nps: 5,
          comentarios: 'Primera reunión, expectativas moderadas'
        });
      }
    }

    const encuestasCreadas = [];
    
    // Crear encuestas
    for (const encuestaData of encuestasData) {
      const encuesta = await upsertEncuesta(encuestaData);
      encuestasCreadas.push(encuesta);
    }

    console.log(`\n📊 Resumen de encuestas:`);
    console.log(`   Total procesadas: ${encuestasData.length}`);
    console.log(`   Creadas: ${encuestasCreadas.length}`);
    console.log(`   Omitidas (ya existían): ${encuestasData.length - encuestasCreadas.length}`);

    // Mostrar encuestas creadas por calificación
    console.log(`\n📋 Encuestas por calificación general:`);
    const calificaciones = [5, 4, 3, 2, 1];
    for (const calificacion of calificaciones) {
      const encuestasDelNivel = encuestasCreadas.filter(e => e.calificacion_general === calificacion);
      if (encuestasDelNivel.length > 0) {
        console.log(`   ${calificacion} estrellas: ${encuestasDelNivel.length}`);
        for (const encuesta of encuestasDelNivel) {
          const nps = encuesta.recomendar_nps ? ` (NPS: ${encuesta.recomendar_nps})` : '';
          console.log(`     • ${encuesta.comentarios || 'Sin comentarios'}${nps}`);
        }
      }
    }

    // Estadísticas de satisfacción
    const calificacionPromedio = encuestasCreadas.length > 0 ? 
      (encuestasCreadas.reduce((sum, e) => sum + e.calificacion_general, 0) / encuestasCreadas.length).toFixed(2) : '0';
    
    const npsPromedio = encuestasCreadas.filter(e => e.recomendar_nps).length > 0 ?
      (encuestasCreadas
        .filter(e => e.recomendar_nps)
        .reduce((sum, e) => sum + (e.recomendar_nps || 0), 0) / 
       encuestasCreadas.filter(e => e.recomendar_nps).length).toFixed(2) : '0';

    const matchPromedio = encuestasCreadas.filter(e => e.match_negocio).length > 0 ?
      (encuestasCreadas
        .filter(e => e.match_negocio)
        .reduce((sum, e) => sum + (e.match_negocio || 0), 0) / 
       encuestasCreadas.filter(e => e.match_negocio).length).toFixed(2) : '0';

    console.log(`\n📈 Estadísticas de satisfacción:`);
    console.log(`   Calificación promedio: ${calificacionPromedio}/5`);
    console.log(`   NPS promedio: ${npsPromedio}/10`);
    console.log(`   Match de negocio promedio: ${matchPromedio}/5`);

    console.log('\n✅ Seed de encuestas completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error en seed de encuestas:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('📡 Desconectado de MongoDB');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedEncuestas()
    .then(() => {
      console.log('🎉 Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

export default seedEncuestas;
