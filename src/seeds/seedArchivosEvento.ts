import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../config/env';

// Definir el esquema y modelo directamente aquí para evitar problemas de importación
type TipoArchivoEvento = 'MAPA'|'CRONOGRAMA'|'OTRO';

interface ArchivoEventoDoc extends mongoose.Document {
  eventoId: mongoose.Types.ObjectId;
  tipo: TipoArchivoEvento;
  url: string;
  nombre_archivo: string;
  mime: string;
  creado_en: Date;
}

const ArchivoEventoSchema = new mongoose.Schema<ArchivoEventoDoc>({
  eventoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Evento', required: true, index: true },
  tipo: { type: String, enum: ['MAPA','CRONOGRAMA','OTRO'], required: true, index: true },
  url: { type: String, required: true, trim: true },
  nombre_archivo: { type: String, required: true, trim: true },
  mime: { type: String, required: true, trim: true }
}, { timestamps: { createdAt: 'creado_en', updatedAt: false } });

const ArchivoEvento = mongoose.models.ArchivoEvento || mongoose.model<ArchivoEventoDoc>('ArchivoEvento', ArchivoEventoSchema);

// Función para crear o actualizar un archivo
async function upsertArchivo(archivoData: Partial<ArchivoEventoDoc>) {
  try {
    // Verificar si ya existe un archivo con el mismo nombre en el mismo evento
    const existingArchivo = await ArchivoEvento.findOne({
      eventoId: archivoData.eventoId,
      nombre_archivo: archivoData.nombre_archivo
    });
    
    if (existingArchivo) {
      console.log(`⚠️  Archivo "${archivoData.nombre_archivo}" ya existe en el evento, omitiendo...`);
      return existingArchivo;
    }

    const archivo = await ArchivoEvento.create(archivoData);
    console.log(`✅ Archivo creado: ${archivo.nombre_archivo} (${archivo.tipo}) (ID: ${archivo._id})`);
    return archivo;
  } catch (error) {
    console.error(`❌ Error creando archivo "${archivoData.nombre_archivo}":`, error);
    throw error;
  }
}

async function seedArchivosEvento() {
  try {
    console.log('🌱 Iniciando seed de archivos de evento...');
    
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

    // Datos de archivos de prueba
    const archivosData = [
      // Archivos para evento 1 (Rueda de Negocios Beni 2024)
      {
        eventoId: evento1._id,
        tipo: 'MAPA' as TipoArchivoEvento,
        url: 'https://example.com/archivos/rueda-2024/mapa-salon.pdf',
        nombre_archivo: 'Mapa del Salón - Rueda 2024.pdf',
        mime: 'application/pdf'
      },
      {
        eventoId: evento1._id,
        tipo: 'CRONOGRAMA' as TipoArchivoEvento,
        url: 'https://example.com/archivos/rueda-2024/cronograma.pdf',
        nombre_archivo: 'Cronograma de Actividades.pdf',
        mime: 'application/pdf'
      },
      {
        eventoId: evento1._id,
        tipo: 'OTRO' as TipoArchivoEvento,
        url: 'https://example.com/archivos/rueda-2024/reglamento.pdf',
        nombre_archivo: 'Reglamento del Evento.pdf',
        mime: 'application/pdf'
      },
      {
        eventoId: evento1._id,
        tipo: 'OTRO' as TipoArchivoEvento,
        url: 'https://example.com/archivos/rueda-2024/presentacion.pptx',
        nombre_archivo: 'Presentación Inaugural.pptx',
        mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      },
      // Archivos para evento 2 (Rueda de Negocios Beni 2025)
      {
        eventoId: evento2._id,
        tipo: 'MAPA' as TipoArchivoEvento,
        url: 'https://example.com/archivos/rueda-2025/mapa-salon-v2.pdf',
        nombre_archivo: 'Mapa del Salón - Rueda 2025.pdf',
        mime: 'application/pdf'
      },
      {
        eventoId: evento2._id,
        tipo: 'CRONOGRAMA' as TipoArchivoEvento,
        url: 'https://example.com/archivos/rueda-2025/cronograma-detallado.pdf',
        nombre_archivo: 'Cronograma Detallado.pdf',
        mime: 'application/pdf'
      },
      {
        eventoId: evento2._id,
        tipo: 'OTRO' as TipoArchivoEvento,
        url: 'https://example.com/archivos/rueda-2025/lista-empresas.xlsx',
        nombre_archivo: 'Lista de Empresas Participantes.xlsx',
        mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      // Archivos para evento 3 (Networking Express 2024)
      {
        eventoId: evento3._id,
        tipo: 'MAPA' as TipoArchivoEvento,
        url: 'https://example.com/archivos/express-2024/mapa-simple.pdf',
        nombre_archivo: 'Mapa Simple - Express.pdf',
        mime: 'application/pdf'
      },
      {
        eventoId: evento3._id,
        tipo: 'CRONOGRAMA' as TipoArchivoEvento,
        url: 'https://example.com/archivos/express-2024/horarios.pdf',
        nombre_archivo: 'Horarios de Reuniones.pdf',
        mime: 'application/pdf'
      },
      {
        eventoId: evento3._id,
        tipo: 'OTRO' as TipoArchivoEvento,
        url: 'https://example.com/archivos/express-2024/guia-participante.pdf',
        nombre_archivo: 'Guía del Participante.pdf',
        mime: 'application/pdf'
      },
      // Archivos adicionales para evento 1
      {
        eventoId: evento1._id,
        tipo: 'OTRO' as TipoArchivoEvento,
        url: 'https://example.com/archivos/rueda-2024/contactos.xlsx',
        nombre_archivo: 'Lista de Contactos.xlsx',
        mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      {
        eventoId: evento1._id,
        tipo: 'OTRO' as TipoArchivoEvento,
        url: 'https://example.com/archivos/rueda-2024/resultados.pdf',
        nombre_archivo: 'Resultados del Evento.pdf',
        mime: 'application/pdf'
      }
    ];

    const archivosCreados = [];
    
    // Crear archivos
    for (const archivoData of archivosData) {
      const archivo = await upsertArchivo(archivoData);
      archivosCreados.push(archivo);
    }

    console.log(`\n📊 Resumen de archivos:`);
    console.log(`   Total procesados: ${archivosData.length}`);
    console.log(`   Creados: ${archivosCreados.length}`);
    console.log(`   Omitidos (ya existían): ${archivosData.length - archivosCreados.length}`);

    // Mostrar archivos creados por evento
    console.log(`\n📋 Archivos por evento:`);
    for (const evento of eventos) {
      const archivosDelEvento = archivosCreados.filter(a => a.eventoId.toString() === evento._id.toString());
      console.log(`   ${evento.nombre}:`);
      for (const archivo of archivosDelEvento) {
        console.log(`     • ${archivo.nombre_archivo} (${archivo.tipo})`);
      }
    }

    // Mostrar archivos por tipo
    console.log(`\n📋 Archivos por tipo:`);
    const tipos = ['MAPA', 'CRONOGRAMA', 'OTRO'];
    for (const tipo of tipos) {
      const archivosDelTipo = archivosCreados.filter(a => a.tipo === tipo);
      console.log(`   ${tipo}: ${archivosDelTipo.length}`);
      for (const archivo of archivosDelTipo) {
        console.log(`     • ${archivo.nombre_archivo}`);
      }
    }

    // Mostrar archivos por tipo MIME
    console.log(`\n📋 Archivos por tipo MIME:`);
    const mimeTypes = [...new Set(archivosCreados.map(a => a.mime))];
    for (const mime of mimeTypes) {
      const archivosDelMime = archivosCreados.filter(a => a.mime === mime);
      console.log(`   ${mime}: ${archivosDelMime.length}`);
    }

    // Estadísticas de archivos
    const totalArchivos = archivosCreados.length;
    const archivosPDF = archivosCreados.filter(a => a.mime === 'application/pdf').length;
    const archivosExcel = archivosCreados.filter(a => a.mime.includes('spreadsheetml')).length;
    const archivosPowerPoint = archivosCreados.filter(a => a.mime.includes('presentationml')).length;

    console.log(`\n📈 Estadísticas de archivos:`);
    console.log(`   Total de archivos: ${totalArchivos}`);
    console.log(`   Archivos PDF: ${archivosPDF}`);
    console.log(`   Archivos Excel: ${archivosExcel}`);
    console.log(`   Archivos PowerPoint: ${archivosPowerPoint}`);

    console.log('\n✅ Seed de archivos de evento completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error en seed de archivos de evento:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('📡 Desconectado de MongoDB');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedArchivosEvento()
    .then(() => {
      console.log('🎉 Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

export default seedArchivosEvento;
