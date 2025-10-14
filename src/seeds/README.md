# Sistema de Seeding - Rueda de Negocios Beni

Este directorio contiene scripts para poblar la base de datos con datos de prueba y de producción.

## 📁 Archivos Disponibles

### Seeds Individuales
- **`seedUsers.ts`** - Usuarios del sistema (admin, organizadores, etc.)
- **`seedEventos.ts`** - Eventos de rueda de negocios
- **`seedEmpresas.ts`** - Empresas participantes
- **`seedMesas.ts`** - Mesas de reunión
- **`seedReuniones.ts`** - Reuniones programadas
- **`seedSolicitudesReunion.ts`** - Solicitudes de reunión
- **`seedEncuestas.ts`** - Encuestas de satisfacción
- **`seedNotificaciones.ts`** - Notificaciones del sistema
- **`seedArchivosEvento.ts`** - Archivos de eventos (mapas, cronogramas, etc.)

### Archivo Principal
- **`index.ts`** - Ejecuta todos los seeds en orden correcto

## 🚀 Uso

### Ejecutar Todos los Seeds
```bash
npm run seed
```

### Ejecutar Seeds Específicos
```bash
# Solo usuarios
npm run seed:usuarios

# Solo eventos
npm run seed:eventos

# Solo empresas
npm run seed:empresas

# Solo mesas
npm run seed:mesas

# Solo reuniones
npm run seed:reuniones

# Solo solicitudes
npm run seed:solicitudes

# Solo encuestas
npm run seed:encuestas

# Solo notificaciones
npm run seed:notificaciones

# Solo archivos
npm run seed:archivos
```

### Ejecutar Seeds Específicos con el Index
```bash
# Ejecutar solo eventos y empresas
node -r ts-node/register src/seeds/index.ts Eventos Empresas

# Ejecutar solo usuarios y eventos
node -r ts-node/register src/seeds/index.ts Usuarios Eventos
```

## 📋 Orden de Dependencias

Los seeds se ejecutan en el siguiente orden para respetar las dependencias:

1. **Usuarios** (Requerido)
   - Sin dependencias
   - Crea usuarios del sistema

2. **Eventos** (Requerido)
   - Sin dependencias
   - Crea eventos de rueda de negocios

3. **Empresas** (Requerido)
   - Depende de: Eventos
   - Crea empresas participantes

4. **Mesas** (Requerido)
   - Depende de: Eventos
   - Crea mesas de reunión

5. **Reuniones** (Requerido)
   - Depende de: Eventos, Empresas, Mesas
   - Crea reuniones programadas

6. **Solicitudes de Reunión** (Requerido)
   - Depende de: Eventos, Empresas
   - Crea solicitudes de reunión

7. **Encuestas** (Requerido)
   - Depende de: Eventos, Reuniones, Empresas
   - Crea encuestas de satisfacción

8. **Notificaciones** (Requerido)
   - Depende de: Eventos
   - Crea notificaciones del sistema

9. **Archivos de Evento** (Opcional)
   - Depende de: Eventos
   - Crea archivos de eventos

## 🔧 Configuración

### Variables de Entorno Requeridas
```env
MONGODB_URI=mongodb://localhost:27017/rueda-negocios
JWT_SECRET=tu-jwt-secret-aqui
NODE_ENV=development
```

### Base de Datos
- Los seeds se conectan a la base de datos especificada en `MONGODB_URI`
- Se pueden ejecutar múltiples veces sin duplicar datos (upsert)
- Los datos existentes se omiten con advertencias

## 📊 Datos de Prueba Incluidos

### Usuarios
- Administrador del sistema
- Organizadores de eventos
- Usuarios de prueba con diferentes roles

### Eventos
- Rueda de Negocios Beni 2024
- Rueda de Negocios Beni 2025
- Networking Express 2024

### Empresas
- Empresas del sector agrícola
- Empresas ganaderas
- Empresas de turismo
- Empresas tecnológicas
- Empresas de construcción
- Empresas comerciales
- Empresas logísticas

### Mesas
- Mesas principales y VIP
- Mesas temáticas por sector
- Mesas con diferentes capacidades
- Mesas activas e inactivas

### Reuniones
- Reuniones en diferentes estados
- Cronograma realista
- Diferentes tipos de empresas

### Solicitudes
- Solicitudes pendientes
- Solicitudes aceptadas/rechazadas
- Solicitudes canceladas

### Encuestas
- Encuestas completadas
- Encuestas con expectativas
- Diferentes niveles de satisfacción

### Notificaciones
- Notificaciones de eventos
- Notificaciones de reuniones
- Notificaciones de solicitudes
- Notificaciones de sistema
- Diferentes canales (app, email, sms)

### Archivos
- Mapas de salones
- Cronogramas de actividades
- Reglamentos
- Presentaciones
- Listas de contactos
- Diferentes tipos MIME

## ⚠️ Consideraciones

1. **Datos de Prueba**: Los seeds crean datos de prueba realistas pero ficticios
2. **URLs de Archivos**: Las URLs de archivos son ejemplos y no apuntan a archivos reales
3. **Emails**: Los emails son ficticios y no se pueden usar para comunicación real
4. **Duplicados**: Los seeds verifican duplicados y omiten datos existentes
5. **Dependencias**: Respetar el orden de dependencias es importante para el funcionamiento correcto

## 🐛 Solución de Problemas

### Error de Conexión a MongoDB
```bash
# Verificar que MongoDB esté ejecutándose
# Verificar la variable MONGODB_URI en .env
```

### Error de Dependencias
```bash
# Ejecutar seeds en orden correcto
npm run seed
```

### Error de Duplicados
```bash
# Los seeds omiten duplicados automáticamente
# Revisar logs para confirmar qué se omitió
```

## 📝 Logs

Los seeds proporcionan logs detallados:
- ✅ Operaciones exitosas
- ⚠️ Advertencias (datos omitidos)
- ❌ Errores
- 📊 Estadísticas finales

## 🔄 Re-ejecutar Seeds

Los seeds se pueden ejecutar múltiples veces:
- Datos existentes se omiten
- Solo se crean datos nuevos
- No se duplican registros
- Se mantiene la integridad de la base de datos
