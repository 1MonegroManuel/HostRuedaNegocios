// Configuración de la API
export const API_CONFIG = {
  // URL base de la API
  BASE_URL: import.meta.env.VITE_API_URL || 'https://hostruedanegocios.onrender.com/api',

  // Timeouts
  TIMEOUT: 30000, // 30 segundos

  // Configuración de paginación por defecto
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,

  // Configuración de reintentos
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 segundo

  // Configuración de cache
  CACHE_ENABLED: true,
  CACHE_TTL: 5 * 60 * 1000, // 5 minutos

  // Configuración de archivos
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/csv',
    'application/json'
  ],

  // Configuración de notificaciones
  NOTIFICATION_POLLING_INTERVAL: 30000, // 30 segundos

  // Configuración de autenticación
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutos antes del vencimiento

  // Configuración de logs
  LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || 'info',
  LOG_REQUESTS: import.meta.env.VITE_LOG_REQUESTS === 'true',
  LOG_RESPONSES: import.meta.env.VITE_LOG_RESPONSES === 'true',
};

// Configuración de endpoints específicos
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
    REFRESH: '/auth/refresh',
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  USUARIOS: {
    BASE: '/usuarios',
    SEARCH: '/usuarios/search',
    CHECK_EMAIL: '/usuarios/check-email',
    CHECK_USERNAME: '/usuarios/check-username',
    STATS: '/usuarios/stats',
  },
  EVENTOS: {
    BASE: '/eventos',
    SEARCH: '/eventos/search',
    ACTIVOS: '/eventos/activos',
    PASADOS: '/eventos/pasados',
    PROXIMOS: '/eventos/proximos',
    STATS: '/eventos/stats',
    EXPORT: '/eventos/export',
    DUPLICATE: '/eventos/duplicate',
    UPLOAD_LOGO: '/eventos/upload-logo',
    DELETE_LOGO: '/eventos/delete-logo',
  },
  EMPRESAS: {
    BASE: '/empresas',
    BY_EVENTO: '/empresas/by-evento',
    SEARCH: '/empresas/search',
    CHECK_NIT: '/empresas/check-nit',
    TOP_REUNIONES: '/empresas/top-reuniones',
    STATS: '/empresas/stats',
    EXPORT: '/empresas/export',
    IMPORT: '/empresas/import',
    UPLOAD_LOGO: '/empresas/upload-logo',
    DELETE_LOGO: '/empresas/delete-logo',
  },
  MESAS: {
    BASE: '/mesas',
    BY_EVENTO: '/mesas/by-evento',
    SEARCH: '/mesas/search',
    CHECK_NUMERO: '/mesas/check-numero',
    STATS: '/mesas/stats',
    EXPORT: '/mesas/export',
    DUPLICATE: '/mesas/duplicate',
    REORGANIZAR: '/mesas/reorganizar',
  },
  REUNIONES: {
    BASE: '/reuniones',
    BY_EVENTO: '/reuniones/by-evento',
    PROXIMAS: '/reuniones/proximas',
    VENCIDAS: '/reuniones/vencidas',
    CRONOGRAMA: '/reuniones/cronograma',
    CONFLICTOS: '/reuniones/conflictos',
    VERIFICAR_DISPONIBILIDAD: '/reuniones/verificar-disponibilidad',
    REAGENDAR: '/reuniones/reagendar',
    STATS: '/reuniones/stats',
    EXPORT: '/reuniones/export',
    REPORTE: '/reuniones/reporte',
  },
  SOLICITUDES: {
    BASE: '/solicitudes-reunion',
    BY_EVENTO: '/solicitudes-reunion/by-evento',
    SEARCH: '/solicitudes-reunion/search',
    VERIFICAR_EXISTENTE: '/solicitudes-reunion/verificar-existente',
    CONVERTIR_A_REUNION: '/solicitudes-reunion/convertir-a-reunion',
    STATS: '/solicitudes-reunion/stats',
    EXPORT: '/solicitudes-reunion/export',
    REPORTE: '/solicitudes-reunion/reporte',
  },
  ENCUESTAS: {
    BASE: '/encuestas',
    BY_EVENTO: '/encuestas/by-evento',
    BY_REUNION: '/encuestas/by-reunion',
    SEARCH: '/encuestas/search',
    METRICAS: '/encuestas/metricas',
    STATS: '/encuestas/stats',
    EXPORT: '/encuestas/export',
    REPORTE: '/encuestas/reporte',
    COMPARATIVA_EVENTOS: '/encuestas/comparativa-eventos',
  },
  NOTIFICACIONES: {
    BASE: '/notificaciones',
    BY_EVENTO: '/notificaciones/by-evento',
    BY_REUNION: '/notificaciones/by-reunion',
    SEARCH: '/notificaciones/search',
    MARCAR_LEIDAS: '/notificaciones/marcar-leidas',
    MARCAR_TODAS_LEIDAS: '/notificaciones/marcar-todas-leidas',
    REENVIAR: '/notificaciones/reenviar',
    MIS_NOTIFICACIONES: '/notificaciones/mis-notificaciones',
    STATS: '/notificaciones/stats',
    EXPORT: '/notificaciones/export',
    REPORTE: '/notificaciones/reporte',
  },
  ARCHIVOS: {
    BASE: '/archivos-evento',
    BY_EVENTO: '/archivos-evento/by-evento',
    UPLOAD: '/archivos-evento/upload',
    DOWNLOAD: '/archivos-evento/download',
    PREVIEW: '/archivos-evento/preview',
    VERIFICAR_EXISTE: '/archivos-evento/verificar-existe',
    DUPLICADOS: '/archivos-evento/duplicados',
    ELIMINAR_DUPLICADOS: '/archivos-evento/eliminar-duplicados',
    RENOMBRAR: '/archivos-evento/renombrar',
    MOVER: '/archivos-evento/mover',
    COPIAR: '/archivos-evento/copiar',
    STATS: '/archivos-evento/stats',
    EXPORT: '/archivos-evento/export',
    REPORTE: '/archivos-evento/reporte',
  },
};

// Configuración de mensajes de error
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Error de conexión. Verifica tu conexión a internet.',
  TIMEOUT_ERROR: 'La solicitud tardó demasiado tiempo en completarse.',
  UNAUTHORIZED: 'No tienes autorización para realizar esta acción.',
  FORBIDDEN: 'Acceso denegado.',
  NOT_FOUND: 'El recurso solicitado no fue encontrado.',
  VALIDATION_ERROR: 'Los datos proporcionados no son válidos.',
  SERVER_ERROR: 'Error interno del servidor. Intenta nuevamente más tarde.',
  FILE_TOO_LARGE: 'El archivo es demasiado grande.',
  INVALID_FILE_TYPE: 'Tipo de archivo no permitido.',
  UPLOAD_FAILED: 'Error al subir el archivo.',
  DOWNLOAD_FAILED: 'Error al descargar el archivo.',
  EXPORT_FAILED: 'Error al exportar los datos.',
  IMPORT_FAILED: 'Error al importar los datos.',
  UNKNOWN_ERROR: 'Error desconocido.',
};

// Configuración de estados de carga
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

// Configuración de filtros por defecto
export const DEFAULT_FILTERS = {
  page: 1,
  limit: 10,
  sort: 'creado_en',
  order: 'desc' as const,
};

// Configuración de validación
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\+]?[1-9][\d]{0,15}$/,
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
  NOMBRE_MIN_LENGTH: 2,
  NOMBRE_MAX_LENGTH: 50,
  DESCRIPCION_MAX_LENGTH: 500,
  COMENTARIO_MAX_LENGTH: 1000,
};

// Configuración de formatos de fecha
export const DATE_FORMATS = {
  API: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  DISPLAY: 'DD/MM/YYYY HH:mm',
  DATE_ONLY: 'DD/MM/YYYY',
  TIME_ONLY: 'HH:mm',
  ISO: 'YYYY-MM-DD',
};

// Configuración de temas
export const THEME_CONFIG = {
  PRIMARY_COLOR: '#1976d2',
  SECONDARY_COLOR: '#dc004e',
  SUCCESS_COLOR: '#2e7d32',
  WARNING_COLOR: '#ed6c02',
  ERROR_COLOR: '#d32f2f',
  INFO_COLOR: '#0288d1',
};

// Configuración de notificaciones
export const NOTIFICATION_CONFIG = {
  SUCCESS_DURATION: 3000,
  ERROR_DURATION: 5000,
  WARNING_DURATION: 4000,
  INFO_DURATION: 3000,
  POSITION: 'top-right' as const,
};

// Configuración de paginación
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100],
  SHOW_SIZE_CHANGER: true,
  SHOW_QUICK_JUMPER: true,
  SHOW_TOTAL: true,
};

// Configuración de exportación
export const EXPORT_CONFIG = {
  DEFAULT_FORMAT: 'xlsx' as const,
  SUPPORTED_FORMATS: ['csv', 'xlsx', 'pdf'] as const,
  MAX_RECORDS: 10000,
  CHUNK_SIZE: 1000,
};

// Configuración de cache
export const CACHE_CONFIG = {
  ENABLED: true,
  TTL: 5 * 60 * 1000, // 5 minutos
  MAX_SIZE: 100, // Máximo 100 elementos en cache
  STORAGE: 'memory' as const, // 'memory' | 'localStorage' | 'sessionStorage'
};
