# API Service - Rueda de Negocios Beni

Este directorio contiene toda la lógica para la comunicación con la API del backend, organizada de manera modular y con tipado TypeScript completo.

## 📁 Estructura

```
src/apiService/
├── types/
│   └── index.ts                 # Todos los tipos TypeScript
├── services/
│   ├── authService.ts          # Autenticación
│   ├── usuarioService.ts       # Gestión de usuarios
│   ├── eventoService.ts        # Gestión de eventos
│   ├── empresaService.ts       # Gestión de empresas
│   ├── mesaService.ts          # Gestión de mesas
│   ├── reunionService.ts       # Gestión de reuniones
│   ├── solicitudReunionService.ts # Gestión de solicitudes
│   ├── encuestaService.ts      # Gestión de encuestas
│   ├── notificacionService.ts  # Gestión de notificaciones
│   └── archivoEventoService.ts # Gestión de archivos
├── examples/
│   ├── useEventos.ts           # Hook personalizado de ejemplo
│   ├── EventosList.tsx         # Componente React de ejemplo
│   └── env.example             # Variables de entorno de ejemplo
├── client.ts                   # Cliente HTTP base
├── config.ts                   # Configuración de la API
├── utils.ts                    # Utilidades y helpers
├── index.ts                    # Exportaciones principales
└── README.md                   # Documentación completa
```

## 🚀 Uso Básico

### Importar servicios
```typescript
import { 
  authService, 
  eventoService, 
  empresaService,
  // ... otros servicios
} from '@/apiService';
```

### Importar tipos
```typescript
import { 
  Usuario, 
  Evento, 
  Empresa,
  // ... otros tipos
} from '@/apiService';
```

### Importar utilidades
```typescript
import { 
  formatDateForDisplay, 
  formatNumber, 
  isValidEmail,
  // ... otras utilidades
} from '@/apiService';
```

## 🔧 Configuración

### Variables de entorno
```env
VITE_API_URL=http://localhost:3001/api
VITE_LOG_LEVEL=info
VITE_LOG_REQUESTS=true
VITE_LOG_RESPONSES=false
```

### Configuración personalizada
```typescript
import { API_CONFIG } from '@/apiService/config';

// Modificar configuración si es necesario
API_CONFIG.TIMEOUT = 60000; // 60 segundos
API_CONFIG.DEFAULT_PAGE_SIZE = 20;
```

## 📋 Servicios Disponibles

### 1. AuthService
Maneja la autenticación y autorización.

```typescript
// Iniciar sesión
const loginResponse = await authService.login({
  email: 'usuario@example.com',
  password: 'password123'
});

// Obtener perfil
const profile = await authService.getProfile();

// Cerrar sesión
await authService.logout();
```

### 2. UsuarioService
Gestiona usuarios del sistema.

```typescript
// Obtener usuarios con paginación
const usuarios = await usuarioService.getUsuarios({
  page: 1,
  limit: 10,
  tipoUsuario: 'admin'
});

// Crear usuario
const nuevoUsuario = await usuarioService.createUsuario({
  nombre: 'Juan',
  apellido: 'Pérez',
  email: 'juan@example.com',
  username: 'juanperez',
  password: 'password123',
  tipoUsuario: 'personal'
});
```

### 3. EventoService
Administra eventos de rueda de negocios.

```typescript
// Obtener eventos
const eventos = await eventoService.getEventos({
  page: 1,
  limit: 10,
  activos: true
});

// Crear evento
const nuevoEvento = await eventoService.createEvento({
  nombre: 'Rueda de Negocios 2024',
  descripcion: 'Evento de networking empresarial',
  inicio: '2024-12-15T08:00:00.000Z',
  fin: '2024-12-15T18:00:00.000Z',
  duracion_minutos_reunion: 30,
  modo_mesas: 'FIJA_POR_EMPRESA'
});
```

### 4. EmpresaService
Gestiona empresas participantes.

```typescript
// Obtener empresas por evento
const empresas = await empresaService.getEmpresasByEvento('eventoId', {
  page: 1,
  limit: 10,
  rubro: 'Tecnología'
});

// Asignar empresa a mesa
const empresaActualizada = await empresaService.asignarEmpresaAMesa(
  'empresaId', 
  'mesaId'
);
```

### 5. MesaService
Administra mesas de reunión.

```typescript
// Obtener mesas por evento
const mesas = await mesaService.getMesasByEvento('eventoId', {
  activa: true
});

// Crear mesa
const nuevaMesa = await mesaService.createMesa({
  eventoId: 'eventoId',
  numero: 1,
  nombre: 'Mesa Principal',
  capacidad: 8,
  activa: true
});
```

### 6. ReunionService
Gestiona reuniones programadas.

```typescript
// Obtener reuniones por evento
const reuniones = await reunionService.getReunionesByEvento('eventoId', {
  estado: 'programada'
});

// Crear reunión
const nuevaReunion = await reunionService.createReunion({
  eventoId: 'eventoId',
  mesaId: 'mesaId',
  empresaAId: 'empresaAId',
  empresaBId: 'empresaBId',
  inicio: '2024-12-15T08:00:00.000Z',
  fin: '2024-12-15T08:30:00.000Z'
});
```

### 7. SolicitudReunionService
Maneja solicitudes de reunión.

```typescript
// Obtener solicitudes pendientes
const solicitudes = await solicitudReunionService.getSolicitudesPendientes('eventoId');

// Crear solicitud
const nuevaSolicitud = await solicitudReunionService.createSolicitud({
  eventoId: 'eventoId',
  empresaSolicitaId: 'empresaSolicitaId',
  empresaObjetivoId: 'empresaObjetivoId',
  mensaje: 'Nos interesa una reunión'
});

// Aceptar solicitud
const solicitudAceptada = await solicitudReunionService.aceptarSolicitud('solicitudId');
```

### 8. EncuestaService
Gestiona encuestas de satisfacción.

```typescript
// Obtener encuestas por evento
const encuestas = await encuestaService.getEncuestasByEvento('eventoId');

// Crear encuesta
const nuevaEncuesta = await encuestaService.createEncuesta({
  eventoId: 'eventoId',
  reunionId: 'reunionId',
  empresaId: 'empresaId',
  calificacion_general: 5,
  match_negocio: 4,
  puntualidad: 5,
  interes_contraparte: 4,
  recomendar_nps: 9,
  comentarios: 'Excelente reunión'
});

// Obtener métricas
const metrics = await encuestaService.getEncuestaMetrics('eventoId');
```

### 9. NotificacionService
Administra notificaciones del sistema.

```typescript
// Obtener notificaciones del usuario
const notificaciones = await notificacionService.getMisNotificaciones({
  estado: 'pendiente'
});

// Marcar como leída
const notificacionLeida = await notificacionService.marcarComoLeida('notificacionId');

// Obtener estadísticas
const stats = await notificacionService.getNotificacionStats('eventoId');
```

### 10. ArchivoEventoService
Gestiona archivos de eventos.

```typescript
// Obtener archivos por evento
const archivos = await archivoEventoService.getArchivosByEvento('eventoId');

// Subir archivo
const nuevoArchivo = await archivoEventoService.uploadArchivo(
  'eventoId',
  file,
  'MAPA'
);

// Descargar archivo
const blob = await archivoEventoService.downloadArchivo('archivoId');
```

## 🛠️ Utilidades

### Formateo de datos
```typescript
import { 
  formatDateForDisplay, 
  formatNumber, 
  formatFileSize,
  formatStatus,
  formatChannel
} from '@/apiService';

// Formatear fecha
const fechaFormateada = formatDateForDisplay('2024-12-15T08:00:00.000Z', 'long');

// Formatear número
const numeroFormateado = formatNumber(1234.56, 2);

// Formatear tamaño de archivo
const tamañoFormateado = formatFileSize(1024 * 1024); // "1 MB"

// Formatear estado
const estadoFormateado = formatStatus('pendiente'); // "Pendiente"
```

### Validación
```typescript
import { 
  isValidEmail, 
  isValidPhone, 
  isValidPassword,
  isValidFileType,
  isValidFileSize
} from '@/apiService';

// Validar email
const emailValido = isValidEmail('usuario@example.com');

// Validar contraseña
const validacionPassword = isValidPassword('password123');
if (!validacionPassword.valid) {
  console.log(validacionPassword.errors);
}

// Validar archivo
const archivoValido = isValidFileType(file, ['image/jpeg', 'image/png']);
```

### Manejo de archivos
```typescript
import { 
  fileToBase64, 
  downloadFile, 
  getFileExtension,
  getMimeTypeFromExtension
} from '@/apiService';

// Convertir archivo a base64
const base64 = await fileToBase64(file);

// Descargar archivo
downloadFile(blob, 'archivo.pdf');

// Obtener extensión
const extension = getFileExtension('archivo.pdf'); // "pdf"
```

## 🔄 Manejo de Errores

```typescript
import { handleApiError } from '@/apiService';

try {
  const eventos = await eventoService.getEventos();
} catch (error) {
  const errorMessage = handleApiError(error);
  console.error('Error:', errorMessage);
}
```

## 📊 Paginación

Todos los servicios que devuelven listas soportan paginación:

```typescript
const response = await eventoService.getEventos({
  page: 1,
  limit: 10,
  sort: 'creado_en',
  order: 'desc'
});

console.log(response.data); // Array de eventos
console.log(response.total); // Total de registros
console.log(response.page); // Página actual
console.log(response.totalPages); // Total de páginas
```

## 🔍 Filtros

Los servicios soportan diferentes tipos de filtros:

```typescript
// Filtros de empresa
const empresas = await empresaService.getEmpresas({
  eventoId: 'eventoId',
  rubro: 'Tecnología',
  sinMesa: true
});

// Filtros de reunión
const reuniones = await reunionService.getReuniones({
  eventoId: 'eventoId',
  estado: 'programada',
  fechaInicio: '2024-12-15',
  fechaFin: '2024-12-16'
});
```

## 📈 Estadísticas

Muchos servicios proporcionan estadísticas:

```typescript
// Estadísticas de evento
const stats = await eventoService.getEventoStats('eventoId');
console.log(stats.totalEmpresas);
console.log(stats.totalReuniones);
console.log(stats.tasaCompletitud);

// Estadísticas de encuestas
const metrics = await encuestaService.getEncuestaMetrics('eventoId');
console.log(metrics.calificacionPromedio);
console.log(metrics.npsPromedio);
```

## 📤 Exportación

Varios servicios soportan exportación de datos:

```typescript
// Exportar eventos
const blob = await eventoService.exportEventoData('eventoId', 'xlsx');

// Exportar empresas
const blob = await empresaService.exportEmpresas('eventoId', 'csv');

// Descargar archivo exportado
downloadFile(blob, 'eventos.xlsx');
```

## 🔐 Autenticación

El sistema maneja automáticamente la autenticación:

```typescript
// El token se guarda automáticamente al hacer login
await authService.login(credentials);

// Todas las peticiones incluyen el token automáticamente
const eventos = await eventoService.getEventos();

// El token se limpia automáticamente al hacer logout
await authService.logout();
```

## 🎨 Temas y Colores

Las utilidades incluyen funciones para obtener colores e iconos:

```typescript
import { 
  getStatusColor, 
  getStatusIcon, 
  getChannelColor,
  getRubroColor 
} from '@/apiService';

const colorEstado = getStatusColor('pendiente'); // "#ff9800"
const iconoEstado = getStatusIcon('pendiente'); // "⏳"
const colorCanal = getChannelColor('email'); // "#ff9800"
const colorRubro = getRubroColor('Tecnología'); // "#2196f3"
```

## 🚀 Mejores Prácticas

1. **Manejo de errores**: Siempre usa try-catch para manejar errores de API
2. **Loading states**: Implementa estados de carga para mejorar la UX
3. **Validación**: Valida datos antes de enviarlos a la API
4. **Paginación**: Usa paginación para listas grandes
5. **Filtros**: Aplica filtros para reducir la cantidad de datos
6. **Cache**: Considera implementar cache para datos que no cambian frecuentemente
7. **Debounce**: Usa debounce para búsquedas en tiempo real
8. **TypeScript**: Aprovecha el tipado fuerte para detectar errores temprano

## 🔧 Personalización

Puedes extender los servicios para agregar funcionalidad específica:

```typescript
import { EventoService } from '@/apiService';

class CustomEventoService extends EventoService {
  async getEventosConEstadisticas(eventoId: string) {
    const evento = await this.getEvento(eventoId);
    const stats = await this.getEventoStats(eventoId);
    
    return {
      ...evento,
      estadisticas: stats
    };
  }
}

const customEventoService = new CustomEventoService();
```

## 📝 Notas

- Todos los servicios son singletons, por lo que puedes importarlos directamente
- El cliente HTTP maneja automáticamente la autenticación
- Los tipos están completamente tipados para TypeScript
- Las utilidades están optimizadas para el uso común
- La configuración es flexible y se puede personalizar según necesidades
