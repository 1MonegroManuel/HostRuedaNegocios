import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../config/env';

// Definir el esquema y modelo directamente aquí para evitar problemas de importación
interface MesaDoc extends mongoose.Document {
  eventoId: mongoose.Types.ObjectId;
  numero: number;
  nombre?: string | null;
  ubicacion?: string | null;
  capacidad?: number | null;
  activa: boolean;
  creado_en: Date;
  actualizado_en: Date;
}

const MesaSchema = new mongoose.Schema<MesaDoc>({
  eventoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Evento', required: true, index: true },
  numero:   { type: Number, required: true, min: 1 },
  nombre:   { type: String, default: null, trim: true },
  ubicacion:{ type: String, default: null, trim: true },
  capacidad:{ type: Number, default: null, min: 1 },
  activa:   { type: Boolean, default: true, index: true },
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });

// Evita mesas duplicadas dentro del mismo evento
MesaSchema.index({ eventoId: 1, numero: 1 }, { unique: true });

const Mesa = mongoose.models.Mesa || mongoose.model<MesaDoc>('Mesa', MesaSchema);

// Función para crear o actualizar una mesa
async function upsertMesa(mesaData: Partial<MesaDoc>) {
  try {
    // Verificar si ya existe una mesa con el mismo número en el mismo evento
    const existingMesa = await Mesa.findOne({ 
      numero: mesaData.numero, 
      eventoId: mesaData.eventoId 
    });
    
    if (existingMesa) {
      console.log(`⚠️  Mesa ${mesaData.numero} ya existe en el evento, omitiendo...`);
      return existingMesa;
    }

    const mesa = await Mesa.create(mesaData);
    console.log(`✅ Mesa creada: ${mesa.nombre || `Mesa ${mesa.numero}`} (ID: ${mesa._id})`);
    return mesa;
  } catch (error) {
    console.error(`❌ Error creando mesa ${mesaData.numero}:`, error);
    throw error;
  }
}

async function seedMesas() {
  try {
    console.log('🌱 Iniciando seed de mesas...');
    
    // Conectar a MongoDB
    await mongoose.connect(env.MONGODB_URI);
    console.log('📡 Conectado a MongoDB');

    // Obtener eventos existentes
    const Evento = mongoose.models.Evento || mongoose.model('Evento', new mongoose.Schema({}));
    const eventos = await Evento.find({}).limit(3);
    
    if (eventos.length === 0) {
      console.log('⚠️  No hay eventos en la base de datos. Ejecuta primero seedEventos.ts');
      return;
    }

    const evento1 = eventos[0];
    const evento2 = eventos[1] || eventos[0];
    const evento3 = eventos[2] || eventos[0];

    // Datos de mesas de prueba
    const mesasData = [
      // Mesas para evento 1 (Rueda de Negocios Beni 2024)
      {
        eventoId: evento1._id,
        numero: 1,
        nombre: 'Mesa Principal',
        ubicacion: 'Centro del salón',
        capacidad: 8,
        activa: true
      },
      {
        eventoId: evento1._id,
        numero: 2,
        nombre: 'Mesa VIP',
        ubicacion: 'Frente al escenario',
        capacidad: 6,
        activa: true
      },
      {
        eventoId: evento1._id,
        numero: 3,
        nombre: 'Mesa Agrícola',
        ubicacion: 'Zona norte',
        capacidad: 10,
        activa: true
      },
      {
        eventoId: evento1._id,
        numero: 4,
        nombre: 'Mesa Ganadera',
        ubicacion: 'Zona sur',
        capacidad: 8,
        activa: true
      },
      {
        eventoId: evento1._id,
        numero: 5,
        nombre: 'Mesa Turística',
        ubicacion: 'Zona este',
        capacidad: 6,
        activa: true
      },
      // Mesas para evento 2 (Rueda de Negocios Beni 2025)
      {
        eventoId: evento2._id,
        numero: 1,
        nombre: 'Mesa Tecnológica',
        ubicacion: 'Sala A',
        capacidad: 12,
        activa: true
      },
      {
        eventoId: evento2._id,
        numero: 2,
        nombre: 'Mesa Construcción',
        ubicacion: 'Sala B',
        capacidad: 10,
        activa: true
      },
      {
        eventoId: evento2._id,
        numero: 3,
        nombre: 'Mesa Comercial',
        ubicacion: 'Sala C',
        capacidad: 8,
        activa: true
      },
      // Mesas para evento 3 (Networking Express 2024)
      {
        eventoId: evento3._id,
        numero: 1,
        nombre: 'Mesa Express',
        ubicacion: 'Salón principal',
        capacidad: 15,
        activa: true
      },
      {
        eventoId: evento3._id,
        numero: 2,
        nombre: 'Mesa Emergente',
        ubicacion: 'Salón principal',
        capacidad: 12,
        activa: true
      },
      // Mesa inactiva para pruebas
      {
        eventoId: evento1._id,
        numero: 99,
        nombre: 'Mesa de Prueba',
        ubicacion: 'Zona de pruebas',
        capacidad: 4,
        activa: false
      }
    ];

    const mesasCreadas = [];
    
    // Crear mesas
    for (const mesaData of mesasData) {
      const mesa = await upsertMesa(mesaData);
      mesasCreadas.push(mesa);
    }

    console.log(`\n📊 Resumen de mesas:`);
    console.log(`   Total procesadas: ${mesasData.length}`);
    console.log(`   Creadas: ${mesasCreadas.length}`);
    console.log(`   Omitidas (ya existían): ${mesasData.length - mesasCreadas.length}`);

    // Mostrar mesas creadas por evento
    console.log(`\n📋 Mesas por evento:`);
    for (const evento of eventos) {
      const mesasDelEvento = mesasCreadas.filter(m => m.eventoId.toString() === evento._id.toString());
      console.log(`   ${evento.nombre}:`);
      for (const mesa of mesasDelEvento) {
        const estado = mesa.activa ? '✅' : '❌';
        console.log(`     ${estado} Mesa ${mesa.numero}: ${mesa.nombre} (Cap: ${mesa.capacidad})`);
      }
    }

    // Estadísticas de capacidad
    const totalCapacidad = mesasCreadas
      .filter(m => m.activa && m.capacidad)
      .reduce((sum, m) => sum + (m.capacidad || 0), 0);
    
    console.log(`\n📈 Estadísticas:`);
    console.log(`   Total de mesas activas: ${mesasCreadas.filter(m => m.activa).length}`);
    console.log(`   Capacidad total: ${totalCapacidad} asientos`);

    console.log('\n✅ Seed de mesas completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error en seed de mesas:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('📡 Desconectado de MongoDB');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedMesas()
    .then(() => {
      console.log('🎉 Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

export default seedMesas;
