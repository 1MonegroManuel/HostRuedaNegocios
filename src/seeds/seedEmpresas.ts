import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../config/env';

// Definir el esquema y modelo directamente aquí para evitar problemas de importación
interface EmpresaDoc extends mongoose.Document {
  eventoId: mongoose.Types.ObjectId;
  mesaId?: mongoose.Types.ObjectId | null;
  nombre: string;
  nit?: string | null;
  rubro?: string | null;
  representante?: string | null;
  telefono?: string | null;
  email?: string | null;
  sitio_web?: string | null;
  logo_url?: string | null;
  descripcion?: string | null;
  creada_en: Date;
  actualizada_en: Date;
}

const EmpresaSchema = new mongoose.Schema<EmpresaDoc>({
  eventoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Evento', required: true, index: true },
  mesaId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Mesa', default: null, index: true },
  nombre: { type: String, required: true, trim: true },
  nit: { type: String, default: null, trim: true },
  rubro: { type: String, default: null, trim: true },
  representante: { type: String, default: null, trim: true },
  telefono: { type: String, default: null, trim: true },
  email: { type: String, default: null, trim: true, lowercase: true },
  sitio_web: { type: String, default: null, trim: true },
  logo_url: { type: String, default: null, trim: true },
  descripcion: { type: String, default: null, trim: true },
}, { timestamps: { createdAt: 'creada_en', updatedAt: 'actualizada_en' } });

// Una misma empresa (por nombre) no debe repetirse en el mismo evento
EmpresaSchema.index({ eventoId: 1, nombre: 1 }, { unique: true });

const Empresa = mongoose.models.Empresa || mongoose.model<EmpresaDoc>('Empresa', EmpresaSchema);

// Función para crear o actualizar una empresa
async function upsertEmpresa(empresaData: Partial<EmpresaDoc>) {
  try {
    // Verificar si ya existe una empresa con el mismo nombre en el mismo evento
    const existingEmpresa = await Empresa.findOne({ 
      nombre: empresaData.nombre, 
      eventoId: empresaData.eventoId 
    });
    
    if (existingEmpresa) {
      console.log(`⚠️  Empresa "${empresaData.nombre}" ya existe en el evento, omitiendo...`);
      return existingEmpresa;
    }

    const empresa = await Empresa.create(empresaData);
    console.log(`✅ Empresa creada: ${empresa.nombre} (ID: ${empresa._id})`);
    return empresa;
  } catch (error) {
    console.error(`❌ Error creando empresa "${empresaData.nombre}":`, error);
    throw error;
  }
}

async function seedEmpresas() {
  try {
    console.log('🌱 Iniciando seed de empresas...');
    
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

    // Datos de empresas de prueba
    const empresasData = [
      // Empresas para evento 1
      {
        eventoId: evento1._id,
        nombre: 'AgroBeni S.A.',
        nit: '123456789',
        rubro: 'Agricultura',
        representante: 'Juan Pérez',
        telefono: '+591-12345678',
        email: 'contacto@agrobeni.com',
        sitio_web: 'https://agrobeni.com',
        descripcion: 'Empresa líder en producción agrícola en el Beni'
      },
      {
        eventoId: evento1._id,
        nombre: 'Ganadería del Norte',
        nit: '987654321',
        rubro: 'Ganadería',
        representante: 'María González',
        telefono: '+591-87654321',
        email: 'info@ganaderianorte.com',
        descripcion: 'Especialistas en ganado bovino y porcino'
      },
      {
        eventoId: evento1._id,
        nombre: 'Turismo Ribereño',
        nit: '456789123',
        rubro: 'Turismo',
        representante: 'Carlos Rivera',
        telefono: '+591-45678912',
        email: 'turismo@ribereno.com',
        sitio_web: 'https://turismoribereno.com',
        descripcion: 'Tours y servicios turísticos en la región'
      },
      // Empresas para evento 2
      {
        eventoId: evento2._id,
        nombre: 'Tecnología Beni',
        nit: '789123456',
        rubro: 'Tecnología',
        representante: 'Ana Martínez',
        telefono: '+591-78912345',
        email: 'ana@tecbeni.com',
        sitio_web: 'https://tecbeni.com',
        descripcion: 'Soluciones tecnológicas para empresas'
      },
      {
        eventoId: evento2._id,
        nombre: 'Construcciones del Trópico',
        nit: '321654987',
        rubro: 'Construcción',
        representante: 'Roberto Silva',
        telefono: '+591-32165498',
        email: 'roberto@constropico.com',
        descripcion: 'Construcción y obras civiles'
      },
      // Empresas para evento 3
      {
        eventoId: evento3._id,
        nombre: 'Comercializadora Regional',
        nit: '654987321',
        rubro: 'Comercio',
        representante: 'Laura Fernández',
        telefono: '+591-65498732',
        email: 'laura@comercialregional.com',
        descripcion: 'Distribución y comercialización de productos'
      },
      {
        eventoId: evento3._id,
        nombre: 'Servicios Logísticos Beni',
        nit: '147258369',
        rubro: 'Logística',
        representante: 'Diego Morales',
        telefono: '+591-14725836',
        email: 'diego@logbeni.com',
        sitio_web: 'https://logbeni.com',
        descripcion: 'Servicios de transporte y logística'
      }
    ];

    const empresasCreadas = [];
    
    // Crear empresas
    for (const empresaData of empresasData) {
      const empresa = await upsertEmpresa(empresaData);
      empresasCreadas.push(empresa);
    }

    console.log(`\n📊 Resumen de empresas:`);
    console.log(`   Total procesadas: ${empresasData.length}`);
    console.log(`   Creadas: ${empresasCreadas.length}`);
    console.log(`   Omitidas (ya existían): ${empresasData.length - empresasCreadas.length}`);

    // Mostrar empresas creadas por evento
    console.log(`\n📋 Empresas por evento:`);
    for (const evento of eventos) {
      const empresasDelEvento = empresasCreadas.filter(e => e.eventoId.toString() === evento._id.toString());
      console.log(`   ${evento.nombre}:`);
      for (const empresa of empresasDelEvento) {
        console.log(`     • ${empresa.nombre} (${empresa.rubro})`);
      }
    }

    console.log('\n✅ Seed de empresas completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error en seed de empresas:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('📡 Desconectado de MongoDB');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedEmpresas()
    .then(() => {
      console.log('🎉 Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

export default seedEmpresas;
