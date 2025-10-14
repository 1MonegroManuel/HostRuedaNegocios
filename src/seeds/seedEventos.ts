import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../config/env';

// Definir el esquema y modelo directamente aquí para evitar problemas de importación
interface EventoDoc extends mongoose.Document {
  nombre: string;
  descripcion: string;
  inicio: Date;
  fin: Date;
  duracion_minutos_reunion: number;
  numero_mesa?: number | null;
  modo_mesas: 'FIJA_POR_EMPRESA' | 'POR_REUNION';
  logo_url: string | null;
  creado_en: Date;
  actualizado_en: Date;
}

const EventoSchema = new mongoose.Schema<EventoDoc>({
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, required: true, trim: true },
  inicio: { type: Date, required: true, index: true },
  fin: { type: Date, required: true },
  duracion_minutos_reunion: { type: Number, required: true, min: 1 },
  numero_mesa: { type: Number, default: null },
  modo_mesas: { type: String, enum: ['FIJA_POR_EMPRESA','POR_REUNION'], required: true },
  logo_url: { type: String, default: null }
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });

const Evento = mongoose.models.Evento || mongoose.model<EventoDoc>('Evento', EventoSchema);

// Función para crear o actualizar un evento
async function upsertEvento(eventoData: Partial<EventoDoc>) {
  try {
    // Verificar si ya existe un evento con el mismo nombre
    const existingEvento = await Evento.findOne({ nombre: eventoData.nombre });
    
    if (existingEvento) {
      console.log(`⚠️  Evento "${eventoData.nombre}" ya existe, omitiendo...`);
      return existingEvento;
    }

    const evento = await Evento.create(eventoData);
    console.log(`✅ Evento creado: ${evento.nombre} (ID: ${evento._id})`);
    return evento;
  } catch (error) {
    console.error(`❌ Error creando evento "${eventoData.nombre}":`, error);
    throw error;
  }
}

async function seedEventos() {
  try {
    console.log('🌱 Iniciando seed de eventos...');
    
    // Conectar a MongoDB
    await mongoose.connect(env.MONGODB_URI);
    console.log('📡 Conectado a MongoDB');

    // Datos de eventos de prueba
    const eventosData = [
      {
        nombre: 'Rueda de Negocios Beni 2024',
        descripcion: 'Evento principal de networking empresarial en el Beni',
        inicio: new Date('2024-12-15T08:00:00.000Z'),
        fin: new Date('2024-12-15T18:00:00.000Z'),
        duracion_minutos_reunion: 30,
        numero_mesa: null,
        modo_mesas: 'FIJA_POR_EMPRESA' as const,
        logo_url: 'https://example.com/logo-rueda-2024.png'
      },
      {
        nombre: 'Rueda de Negocios Beni 2025',
        descripcion: 'Segunda edición del evento de networking empresarial',
        inicio: new Date('2025-03-20T09:00:00.000Z'),
        fin: new Date('2025-03-20T17:00:00.000Z'),
        duracion_minutos_reunion: 45,
        numero_mesa: null,
        modo_mesas: 'POR_REUNION' as const,
        logo_url: null
      },
      {
        nombre: 'Networking Express 2024',
        descripcion: 'Evento rápido de networking para empresas emergentes',
        inicio: new Date('2024-11-30T14:00:00.000Z'),
        fin: new Date('2024-11-30T16:00:00.000Z'),
        duracion_minutos_reunion: 20,
        numero_mesa: 1,
        modo_mesas: 'FIJA_POR_EMPRESA' as const,
        logo_url: 'https://example.com/logo-express.png'
      }
    ];

    const eventosCreados = [];
    
    // Crear eventos
    for (const eventoData of eventosData) {
      const evento = await upsertEvento(eventoData);
      eventosCreados.push(evento);
    }

    console.log(`\n📊 Resumen de eventos:`);
    console.log(`   Total procesados: ${eventosData.length}`);
    console.log(`   Creados: ${eventosCreados.length}`);
    console.log(`   Omitidos (ya existían): ${eventosData.length - eventosCreados.length}`);

    // Mostrar eventos creados
    console.log(`\n📋 Eventos en la base de datos:`);
    for (const evento of eventosCreados) {
      console.log(`   • ${evento.nombre} (${evento.modo_mesas}) - ${evento.inicio.toLocaleDateString()}`);
    }

    console.log('\n✅ Seed de eventos completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error en seed de eventos:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('📡 Desconectado de MongoDB');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedEventos()
    .then(() => {
      console.log('🎉 Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

export default seedEventos;
