// Tipos base para todas las entidades
export interface BaseEntity {
  _id: string;
  creado_en?: string;
  actualizado_en?: string;
}

// Tipos para Usuario
export interface Usuario extends BaseEntity {
  nombre: string;
  apellido: string;
  email: string;
  username: string;
  telefono?: string;
  tipoUsuario: 'personal' | 'encargado' | 'admin';
}

export interface UsuarioCreate {
  nombre: string;
  apellido: string;
  email: string;
  username: string;
  password: string;
  telefono?: string;
  tipoUsuario: 'personal' | 'encargado' | 'admin';
}

export interface UsuarioUpdate {
  nombre?: string;
  apellido?: string;
  email?: string;
  username?: string;
  password?: string;
  telefono?: string;
  tipoUsuario?: 'personal' | 'encargado' | 'admin';
}

// Tipos para Evento
export interface Evento extends BaseEntity {
  nombre: string;
  descripcion: string;
  inicio: string;
  fin: string;
  duracion_minutos_reunion: number;
  numero_mesas: number;
  modo_mesas: 'FIJA_POR_EMPRESA' | 'POR_REUNION';
  logo_url?: string | null;
  estado: 'ACTIVO' | 'FINALIZADO' | 'CANCELADO' | 'PROGRAMADO';
}

export interface EventoCreate {
  nombre: string;
  descripcion: string;
  inicio: string;
  fin: string;
  duracion_minutos_reunion: number;
  numero_mesas: number;
  modo_mesas: 'FIJA_POR_EMPRESA' | 'POR_REUNION';
  logo_url?: string | null;
  estado?: 'ACTIVO' | 'FINALIZADO' | 'CANCELADO' | 'PROGRAMADO';
}

export interface EventoUpdate {
  nombre?: string;
  descripcion?: string;
  inicio?: string;
  fin?: string;
  duracion_minutos_reunion?: number;
  numero_mesas?: number;
  modo_mesas?: 'FIJA_POR_EMPRESA' | 'POR_REUNION';
  logo_url?: string | null;
  estado?: 'ACTIVO' | 'FINALIZADO' | 'CANCELADO' | 'PROGRAMADO';
}

// Tipos para Empresa
export type EstadoEmpresa = 'pendiente' | 'aceptado' | 'rechazado';

export interface Empresa extends BaseEntity {
  eventoId: string;
  mesaId?: string | null;
  nombre: string;
  nit?: string | null;
  rubro?: string | null;
  representante?: string | null;
  telefono?: string | null;
  email?: string | null;
  sitio_web?: string | null;
  logo_url?: string | null;
  descripcion?: string | null;
  estado: EstadoEmpresa;
  isVirtual: boolean;
  encargadoId?: string | null;
  personalIds: string[];
}

export interface EmpresaCreate {
  eventoId: string;
  mesaId?: string | null;
  nombre: string;
  nit?: string | null;
  rubro?: string | null;
  representante?: string | null;
  telefono?: string | null;
  email?: string | null;
  sitio_web?: string | null;
  logo_url?: string | null;
  descripcion?: string | null;
  estado?: EstadoEmpresa;
  isVirtual?: boolean;
  encargadoId?: string | null;
  personalIds?: string[];
}

export interface EmpresaUpdate {
  mesaId?: string | null;
  nombre?: string;
  nit?: string | null;
  rubro?: string | null;
  representante?: string | null;
  telefono?: string | null;
  email?: string | null;
  sitio_web?: string | null;
  logo_url?: string | null;
  descripcion?: string | null;
  estado?: EstadoEmpresa;
  isVirtual?: boolean;
  encargadoId?: string | null;
  personalIds?: string[];
}

// Tipos para Mesa
export interface Mesa extends BaseEntity {
  eventoId: string;
  numero: number;
  nombre?: string | null;
  capacidad?: number | null;
  activa: boolean;
  ocupada: boolean;
}

export interface MesaCreate {
  eventoId: string;
  numero: number;
  nombre?: string | null;
  capacidad?: number | null;
  activa?: boolean;
  ocupada?: boolean;
}

export interface MesaUpdate {
  numero?: number;
  nombre?: string | null;
  capacidad?: number | null;
  activa?: boolean;
  ocupada?: boolean;
}

// Tipos para Reunión
export type EstadoReunion = 'programada' | 'confirmada' | 'completada' | 'cancelada' | 'no_show';

export interface Reunion extends BaseEntity {
  eventoId: string;
  mesaId: string;
  empresaAId: string;
  empresaBId: string;
  inicio: string;
  fin: string;
  estado: EstadoReunion;
  notas?: string | null;
}

export interface ReunionCreate {
  eventoId: string;
  mesaId: string;
  empresaAId: string;
  empresaBId: string;
  inicio: string;
  fin: string;
  estado?: EstadoReunion;
  notas?: string | null;
}

export interface ReunionUpdate {
  mesaId?: string;
  empresaAId?: string;
  empresaBId?: string;
  inicio?: string;
  fin?: string;
  estado?: EstadoReunion;
  notas?: string | null;
}

// Tipos para Solicitud de Reunión
export type EstadoSolicitud = 'pendiente' | 'aceptada' | 'rechazada' | 'cancelada';

export interface SolicitudReunion extends BaseEntity {
  eventoId: string;
  empresaSolicitaId: string;
  empresaObjetivoId: string;
  usuarioSolicitaId: string;
  mesaPreferidaId?: string | null;
  inicioPropuesto?: string | null;
  finPropuesto?: string | null;
  tipoReunion: 'virtual' | 'presencial';
  mensaje?: string | null;
  estado: EstadoSolicitud;
  // Campos populados
  empresaSolicita?: {
    _id: string;
    nombre: string;
    representante?: string;
    logo_url?: string;
    sitio_web?: string;
  };
  empresaObjetivo?: {
    _id: string;
    nombre: string;
    representante?: string;
    logo_url?: string;
    sitio_web?: string;
  };
  mesaPreferida?: {
    _id: string;
    numero: number;
    nombre?: string;
  };
}

export interface SolicitudReunionCreate {
  eventoId: string;
  empresaSolicitaId: string;
  empresaObjetivoId: string;
  usuarioSolicitaId: string;
  mesaPreferidaId?: string | null;
  inicioPropuesto?: string | null;
  finPropuesto?: string | null;
  tipoReunion: 'virtual' | 'presencial';
  mensaje?: string | null;
  estado?: EstadoSolicitud;
}

export interface SolicitudReunionUpdate {
  mesaPreferidaId?: string | null;
  inicioPropuesto?: string | null;
  finPropuesto?: string | null;
  tipoReunion?: 'virtual' | 'presencial';
  mensaje?: string | null;
  estado?: EstadoSolicitud;
}

// Tipos para Encuesta
export interface EncuestaReunion extends BaseEntity {
  eventoId: string;
  reunionId: string;
  empresaId: string;
  calificacion_general: number;
  match_negocio?: number | null;
  puntualidad?: number | null;
  interes_contraparte?: number | null;
  recomendar_nps?: number | null;
  comentarios?: string | null;
}

export interface EncuestaReunionCreate {
  eventoId: string;
  reunionId: string;
  empresaId: string;
  calificacion_general: number;
  match_negocio?: number | null;
  puntualidad?: number | null;
  interes_contraparte?: number | null;
  recomendar_nps?: number | null;
  comentarios?: string | null;
}

export interface EncuestaReunionUpdate {
  calificacion_general?: number;
  match_negocio?: number | null;
  puntualidad?: number | null;
  interes_contraparte?: number | null;
  recomendar_nps?: number | null;
  comentarios?: string | null;
}

// Tipos para Notificación
export type CanalNotificacion = 'app' | 'email' | 'sms' | 'whatsapp';
export type EstadoNotificacion = 'pendiente' | 'enviada' | 'leida' | 'fallida';

export interface Notificacion extends BaseEntity {
  eventoId?: string | null;
  reunionId?: string | null;
  empresaId?: string | null;
  usuarioId?: string | null;
  tipo: string;
  canal: CanalNotificacion;
  titulo: string;
  mensaje: string;
  payload?: Record<string, any> | null;
  estado: EstadoNotificacion;
  intento?: number | null;
}

export interface NotificacionCreate {
  eventoId?: string | null;
  reunionId?: string | null;
  empresaId?: string | null;
  usuarioId?: string | null;
  tipo: string;
  canal: CanalNotificacion;
  titulo: string;
  mensaje: string;
  payload?: Record<string, any> | null;
  estado?: EstadoNotificacion;
  intento?: number | null;
}

export interface NotificacionUpdate {
  estado?: EstadoNotificacion;
  intento?: number | null;
}

// Tipos para Archivo de Evento
export type TipoArchivoEvento = 'MAPA' | 'CRONOGRAMA' | 'OTRO';

export interface ArchivoEvento extends BaseEntity {
  eventoId: string;
  tipo: TipoArchivoEvento;
  url: string;
  nombre_archivo: string;
  mime: string;
}

export interface ArchivoEventoCreate {
  eventoId: string;
  tipo: TipoArchivoEvento;
  url: string;
  nombre_archivo: string;
  mime: string;
}

export interface ArchivoEventoUpdate {
  tipo?: TipoArchivoEvento;
  url?: string;
  nombre_archivo?: string;
  mime?: string;
}

// Tipos para respuestas de la API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Tipos para filtros y consultas
export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  [key: string]: any;
}

export interface EmpresaFilters extends QueryParams {
  eventoId?: string;
  mesaId?: string;
  rubro?: string;
  activa?: boolean;
}

export interface MesaFilters extends QueryParams {
  eventoId?: string;
  activa?: boolean;
}

export interface ReunionFilters extends QueryParams {
  eventoId?: string;
  estado?: EstadoReunion;
  empresaId?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface SolicitudReunionFilters extends QueryParams {
  eventoId?: string;
  estado?: EstadoSolicitud;
  empresaSolicitaId?: string;
  empresaObjetivoId?: string;
  usuarioSolicitaId?: string;
  tipoReunion?: 'virtual' | 'presencial';
}

export interface EncuestaFilters extends QueryParams {
  eventoId?: string;
  reunionId?: string;
  empresaId?: string;
}

export interface NotificacionFilters extends QueryParams {
  eventoId?: string;
  reunionId?: string;
  empresaId?: string;
  usuarioId?: string;
  tipo?: string;
  canal?: CanalNotificacion;
  estado?: EstadoNotificacion;
}

export interface ArchivoFilters extends QueryParams {
  eventoId?: string;
  tipo?: TipoArchivoEvento;
}

// Tipos para autenticación
export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user: Usuario;
  accessToken: string;
  refreshToken: string;
  message?: string;
}

export interface RegisterRequest {
  nombre: string;
  apellido: string;
  email: string;
  username: string;
  password: string;
  telefono?: string;
  tipoUsuario: 'personal' | 'encargado' | 'admin';
}

export interface RegisterResponse {
  success: boolean;
  user: Usuario;
  message?: string;
}

// Tipos para métricas y estadísticas
export interface EncuestaMetrics {
  totalEncuestas: number;
  calificacionPromedio: number;
  npsPromedio: number;
  matchPromedio: number;
  distribucionCalificaciones: Record<number, number>;
  distribucionNPS: Record<number, number>;
}

export interface EventoStats {
  totalEventos: number;
  eventosActivos: number;
  totalEmpresas: number;
  totalReuniones: number;
  reunionesCompletadas: number;
  tasaCompletitud: number;
}

export interface EmpresaStats {
  totalEmpresas: number;
  empresasConMesa: number;
  distribucionRubros: Record<string, number>;
  distribucionEventos: Record<string, number>;
}
