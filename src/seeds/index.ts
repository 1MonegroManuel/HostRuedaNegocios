import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../config/env';

// Importar todos los seed scripts
import seedEventos from './seedEventos';
import seedEmpresas from './seedEmpresas';
import seedMesas from './seedMesas';
import seedReuniones from './seedReuniones';
import seedSolicitudesReunion from './seedSolicitudesReunion';
import seedEncuestas from './seedEncuestas';
import seedNotificaciones from './seedNotificaciones';
import seedArchivosEvento from './seedArchivosEvento';
import seedUsers from './seedUsers';

// Configuración de seeds
const SEEDS_CONFIG = [
  {
    name: 'Usuarios',
    function: seedUsers,
    description: 'Crear usuarios del sistema (admin, organizadores, etc.)',
    required: true
  },
  {
    name: 'Eventos',
    function: seedEventos,
    description: 'Crear eventos de rueda de negocios',
    required: true
  },
  {
    name: 'Empresas',
    function: seedEmpresas,
    description: 'Crear empresas participantes',
    required: true,
    dependsOn: ['Eventos']
  },
  {
    name: 'Mesas',
    function: seedMesas,
    description: 'Crear mesas de reunión',
    required: true,
    dependsOn: ['Eventos']
  },
  {
    name: 'Reuniones',
    function: seedReuniones,
    description: 'Crear reuniones programadas',
    required: true,
    dependsOn: ['Eventos', 'Empresas', 'Mesas']
  },
  {
    name: 'Solicitudes de Reunión',
    function: seedSolicitudesReunion,
    description: 'Crear solicitudes de reunión',
    required: true,
    dependsOn: ['Eventos', 'Empresas']
  },
  {
    name: 'Encuestas',
    function: seedEncuestas,
    description: 'Crear encuestas de satisfacción',
    required: true,
    dependsOn: ['Eventos', 'Reuniones', 'Empresas']
  },
  {
    name: 'Notificaciones',
    function: seedNotificaciones,
    description: 'Crear notificaciones del sistema',
    required: true,
    dependsOn: ['Eventos']
  },
  {
    name: 'Archivos de Evento',
    function: seedArchivosEvento,
    description: 'Crear archivos de eventos (mapas, cronogramas, etc.)',
    required: false,
    dependsOn: ['Eventos']
  }
];

// Función para ejecutar un seed específico
async function runSeed(seedConfig: typeof SEEDS_CONFIG[0]) {
  try {
    console.log(`\n🌱 Ejecutando seed: ${seedConfig.name}`);
    console.log(`📝 ${seedConfig.description}`);
    console.log('─'.repeat(50));
    
    await seedConfig.function();
    
    console.log(`✅ Seed ${seedConfig.name} completado exitosamente`);
    return { success: true, name: seedConfig.name };
  } catch (error) {
    console.error(`❌ Error en seed ${seedConfig.name}:`, error);
    return { success: false, name: seedConfig.name, error };
  }
}

// Función para ejecutar todos los seeds en orden
async function runAllSeeds() {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Iniciando proceso de seeding completo...');
    console.log('═'.repeat(60));
    
    // Conectar a MongoDB
    await mongoose.connect(env.MONGODB_URI);
    console.log('📡 Conectado a MongoDB');
    
    const results = [];
    const executedSeeds = new Set<string>();
    
    // Ejecutar seeds en orden, respetando dependencias
    for (const seedConfig of SEEDS_CONFIG) {
      // Verificar dependencias
      if (seedConfig.dependsOn) {
        const missingDeps = seedConfig.dependsOn.filter(dep => !executedSeeds.has(dep));
        if (missingDeps.length > 0) {
          console.log(`⚠️  Saltando ${seedConfig.name}: faltan dependencias: ${missingDeps.join(', ')}`);
          results.push({ 
            success: false, 
            name: seedConfig.name, 
            error: `Faltan dependencias: ${missingDeps.join(', ')}` 
          });
          continue;
        }
      }
      
      const result = await runSeed(seedConfig);
      results.push(result);
      
      if (result.success) {
        executedSeeds.add(seedConfig.name);
      } else if (seedConfig.required) {
        console.log(`💥 Seed requerido ${seedConfig.name} falló. Deteniendo proceso.`);
        break;
      }
    }
    
    // Mostrar resumen
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '═'.repeat(60));
    console.log('📊 RESUMEN DE SEEDING');
    console.log('═'.repeat(60));
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ Seeds exitosos: ${successful}`);
    console.log(`❌ Seeds fallidos: ${failed}`);
    console.log(`⏱️  Tiempo total: ${duration} segundos`);
    
    console.log('\n📋 Detalle por seed:');
    for (const result of results) {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${status} ${result.name}`);
      if (!result.success && result.error) {
        console.log(`      Error: ${result.error}`);
      }
    }
    
    if (failed === 0) {
      console.log('\n🎉 ¡Todos los seeds se ejecutaron exitosamente!');
    } else {
      console.log(`\n⚠️  ${failed} seed(s) fallaron. Revisa los errores arriba.`);
    }
    
  } catch (error) {
    console.error('💥 Error fatal en el proceso de seeding:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Desconectado de MongoDB');
  }
}

// Función para ejecutar seeds específicos
async function runSpecificSeeds(seedNames: string[]) {
  const startTime = Date.now();
  
  try {
    console.log(`🚀 Ejecutando seeds específicos: ${seedNames.join(', ')}`);
    console.log('═'.repeat(60));
    
    // Conectar a MongoDB
    await mongoose.connect(env.MONGODB_URI);
    console.log('📡 Conectado a MongoDB');
    
    const results = [];
    
    for (const seedName of seedNames) {
      const seedConfig = SEEDS_CONFIG.find(s => s.name === seedName);
      if (!seedConfig) {
        console.log(`⚠️  Seed "${seedName}" no encontrado`);
        results.push({ success: false, name: seedName, error: 'No encontrado' });
        continue;
      }
      
      const result = await runSeed(seedConfig);
      results.push(result);
    }
    
    // Mostrar resumen
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '═'.repeat(60));
    console.log('📊 RESUMEN DE SEEDING ESPECÍFICO');
    console.log('═'.repeat(60));
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ Seeds exitosos: ${successful}`);
    console.log(`❌ Seeds fallidos: ${failed}`);
    console.log(`⏱️  Tiempo total: ${duration} segundos`);
    
  } catch (error) {
    console.error('💥 Error fatal en el proceso de seeding específico:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Desconectado de MongoDB');
  }
}

// Función para mostrar ayuda
function showHelp() {
  console.log('🌱 SISTEMA DE SEEDING - Rueda de Negocios Beni');
  console.log('═'.repeat(60));
  console.log('');
  console.log('Uso:');
  console.log('  npm run seed                    # Ejecutar todos los seeds');
  console.log('  npm run seed:eventos            # Ejecutar solo seed de eventos');
  console.log('  npm run seed:empresas           # Ejecutar solo seed de empresas');
  console.log('  npm run seed:mesas              # Ejecutar solo seed de mesas');
  console.log('  npm run seed:reuniones          # Ejecutar solo seed de reuniones');
  console.log('  npm run seed:solicitudes        # Ejecutar solo seed de solicitudes');
  console.log('  npm run seed:encuestas          # Ejecutar solo seed de encuestas');
  console.log('  npm run seed:notificaciones     # Ejecutar solo seed de notificaciones');
  console.log('  npm run seed:archivos           # Ejecutar solo seed de archivos');
  console.log('  npm run seed:usuarios           # Ejecutar solo seed de usuarios');
  console.log('');
  console.log('Seeds disponibles:');
  for (const seed of SEEDS_CONFIG) {
    const required = seed.required ? '(Requerido)' : '(Opcional)';
    const deps = seed.dependsOn ? `Depende de: ${seed.dependsOn.join(', ')}` : 'Sin dependencias';
    console.log(`  • ${seed.name} ${required}`);
    console.log(`    ${seed.description}`);
    console.log(`    ${deps}`);
    console.log('');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }
  
  if (args.length === 0) {
    // Ejecutar todos los seeds
    runAllSeeds()
      .then(() => {
        console.log('🎉 Proceso completado');
        process.exit(0);
      })
      .catch((error) => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
      });
  } else {
    // Ejecutar seeds específicos
    runSpecificSeeds(args)
      .then(() => {
        console.log('🎉 Proceso completado');
        process.exit(0);
      })
      .catch((error) => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
      });
  }
}

export {
  runAllSeeds,
  runSpecificSeeds,
  showHelp,
  SEEDS_CONFIG
};
