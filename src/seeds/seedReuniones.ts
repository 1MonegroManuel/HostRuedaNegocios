import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../config/env';

// Definir el esquema y modelo directamente aquí para evitar problemas de importación
type EstadoReunion = 'programada'|'confirmada'|'completada'|'cancelada'|'no_show';

interface ReunionDoc extends mongoose.Document {
  eventoId: mongoose.Types.ObjectId;
  mesaId: mongoose.Types.ObjectId;
  empresaAId: mongoose.Types.ObjectId;
  empresaBId: mongoose.Types.ObjectId;
  inicio: Date;
  fin: Date;
  estado: EstadoReunion;
  notas?: string | null;
  creada_en: Date;
  actualizada_en: Date;
}

const ReunionSchema = new mongoose.Schema<ReunionDoc>({
  eventoId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Evento', required: true, index: true },
  mesaId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Mesa', required: true, index: true },
  empresaAId: { type: mongoose.Schema.Types.ObjectId, ref: 'Empresa', required: true, index: true },
  empresaBId: { type: mongoose.Schema.Types.ObjectId, ref: 'Empresa', required: true, index: true },
  inicio:     { type: Date, required: true, index: true },
  fin:        { type: Date, required: true },
  estado:     { type: String, enum: ['programada','confirmada','completada','cancelada','no_show'], default: 'programada', index: true },
  notas:      { type: String, default: null, trim: true },
}, { timestamps: { createdAt: 'creada_en', updatedAt: 'actualizada_en' } });

// Para evitar duplicidades triviales (mismas 2 empresas, mesa y start)
ReunionSchema.index({ eventoId: 1, mesaId: 1, empresaAId: 1, empresaBId: 1, inicio: 1 }, { unique: true });

const Reunion = mongoose.models.Reunion || mongoose.model<ReunionDoc>('Reunion', ReunionSchema);

// Función para crear o actualizar una reunión
async function upsertReunion(reunionData: Partial<ReunionDoc>) {
  try {
    // Verificar si ya existe una reunión con los mismos datos únicos
    const existingReunion = await Reunion.findOne({
      eventoId: reunionData.eventoId,
      mesaId: reunionData.mesaId,
      empresaAId: reunionData.empresaAId,
      empresaBId: reunionData.empresaBId,
      inicio: reunionData.inicio
    });
    
    if (existingReunion) {
      console.log(`⚠️  Reunión ya existe para las empresas ${reunionData.empresaAId} y ${reunionData.empresaBId}, omitiendo...`);
      return existingReunion;
    }

    const reunion = await Reunion.create(reunionData);
    console.log(`✅ Reunión creada: ${reunion.estado} (ID: ${reunion._id})`);
    return reunion;
  } catch (error) {
    console.error(`❌ Error creando reunión:`, error);
    throw error;
  }
}

async function seedReuniones() {
  try {
    console.log('🌱 Iniciando seed de reuniones...');
    
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
    
    if (eventos.length === 0 || mesas.length === 0 || empresas.length < 2) {
      console.log('⚠️  Faltan datos necesarios. Ejecuta primero seedEventos.ts, seedMesas.ts y seedEmpresas.ts');
      return;
    }

    const evento1 = eventos[0];
    const mesasEvento1 = mesas.filter(m => m.eventoId && m.eventoId.toString() === evento1._id.toString());
    const empresasEvento1 = empresas.filter(e => e.eventoId && e.eventoId.toString() === evento1._id.toString());

    if (mesasEvento1.length === 0 || empresasEvento1.length < 2) {
      console.log('⚠️  No hay mesas o empresas suficientes para el evento principal');
      return;
    }

    // Datos de reuniones de prueba
    const reunionesData = [];
    
    // Crear reuniones para el evento principal
    const fechaBase = new Date('2024-12-15T08:00:00.000Z');
    
    // Reunión 1: AgroBeni vs Ganadería del Norte
    if (empresasEvento1.length >= 2 && mesasEvento1.length >= 1) {
      reunionesData.push({
        eventoId: evento1._id,
        mesaId: mesasEvento1[0]._id,
        empresaAId: empresasEvento1[0]._id,
        empresaBId: empresasEvento1[1]._id,
        inicio: new Date(fechaBase.getTime() + 0 * 30 * 60000), // 8:00
        fin: new Date(fechaBase.getTime() + 1 * 30 * 60000), // 8:30
        estado: 'programada' as EstadoReunion,
        notas: 'Reunión inicial entre empresas del sector primario'
      });
    }

    // Reunión 2: AgroBeni vs Turismo Ribereño
    if (empresasEvento1.length >= 3 && mesasEvento1.length >= 2) {
      reunionesData.push({
        eventoId: evento1._id,
        mesaId: mesasEvento1[1]._id,
        empresaAId: empresasEvento1[0]._id,
        empresaBId: empresasEvento1[2]._id,
        inicio: new Date(fechaBase.getTime() + 1 * 30 * 60000), // 8:30
        fin: new Date(fechaBase.getTime() + 2 * 30 * 60000), // 9:00
        estado: 'confirmada' as EstadoReunion,
        notas: 'Posible colaboración en turismo rural'
      });
    }

    // Reunión 3: Ganadería del Norte vs Turismo Ribereño
    if (empresasEvento1.length >= 3 && mesasEvento1.length >= 3) {
      reunionesData.push({
        eventoId: evento1._id,
        mesaId: mesasEvento1[2]._id,
        empresaAId: empresasEvento1[1]._id,
        empresaBId: empresasEvento1[2]._id,
        inicio: new Date(fechaBase.getTime() + 2 * 30 * 60000), // 9:00
        fin: new Date(fechaBase.getTime() + 3 * 30 * 60000), // 9:30
        estado: 'completada' as EstadoReunion,
        notas: 'Reunión exitosa, se acordó colaboración futura'
      });
    }

    // Reunión 4: Reunión cancelada
    if (empresasEvento1.length >= 2 && mesasEvento1.length >= 1) {
      reunionesData.push({
        eventoId: evento1._id,
        mesaId: mesasEvento1[0]._id,
        empresaAId: empresasEvento1[1]._id,
        empresaBId: empresasEvento1[0]._id,
        inicio: new Date(fechaBase.getTime() + 3 * 30 * 60000), // 9:30
        fin: new Date(fechaBase.getTime() + 4 * 30 * 60000), // 10:00
        estado: 'cancelada' as EstadoReunion,
        notas: 'Cancelada por indisponibilidad de una de las partes'
      });
    }

    // Reunión 5: No show
    if (empresasEvento1.length >= 2 && mesasEvento1.length >= 2) {
      reunionesData.push({
        eventoId: evento1._id,
        mesaId: mesasEvento1[1]._id,
        empresaAId: empresasEvento1[2]?._id || empresasEvento1[0]._id,
        empresaBId: empresasEvento1[1]._id,
        inicio: new Date(fechaBase.getTime() + 4 * 30 * 60000), // 10:00
        fin: new Date(fechaBase.getTime() + 5 * 30 * 60000), // 10:30
        estado: 'no_show' as EstadoReunion,
        notas: 'Una de las empresas no se presentó'
      });
    }

    const reunionesCreadas = [];
    
    // Crear reuniones
    for (const reunionData of reunionesData) {
      const reunion = await upsertReunion(reunionData);
      reunionesCreadas.push(reunion);
    }

    console.log(`\n📊 Resumen de reuniones:`);
    console.log(`   Total procesadas: ${reunionesData.length}`);
    console.log(`   Creadas: ${reunionesCreadas.length}`);
    console.log(`   Omitidas (ya existían): ${reunionesData.length - reunionesCreadas.length}`);

    // Mostrar reuniones creadas por estado
    console.log(`\n📋 Reuniones por estado:`);
    const estados = ['programada', 'confirmada', 'completada', 'cancelada', 'no_show'];
    for (const estado of estados) {
      const reunionesDelEstado = reunionesCreadas.filter(r => r.estado === estado);
      if (reunionesDelEstado.length > 0) {
        console.log(`   ${estado.toUpperCase()}: ${reunionesDelEstado.length}`);
        for (const reunion of reunionesDelEstado) {
          const inicio = reunion.inicio.toLocaleTimeString('es-BO', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          console.log(`     • ${inicio} - ${reunion.notas || 'Sin notas'}`);
        }
      }
    }

    // Estadísticas de horarios
    const horarios = reunionesCreadas.map(r => ({
      inicio: r.inicio.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }),
      fin: r.fin.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }),
      estado: r.estado
    }));

    console.log(`\n⏰ Cronograma de reuniones:`);
    for (const horario of horarios) {
      console.log(`   ${horario.inicio} - ${horario.fin} (${horario.estado})`);
    }

    console.log('\n✅ Seed de reuniones completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error en seed de reuniones:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('📡 Desconectado de MongoDB');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedReuniones()
    .then(() => {
      console.log('🎉 Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

export default seedReuniones;
