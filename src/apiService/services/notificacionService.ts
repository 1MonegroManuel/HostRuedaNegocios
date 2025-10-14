import { apiClient } from '../client';
import type { ApiResponse } from '../types';

export interface Notificacion {
  _id: string;
  tipo: string;
  canal: 'app' | 'email';
  titulo: string;
  mensaje: string;
  estado: 'pendiente' | 'enviada' | 'leida' | 'fallida';
  eventoId?: string;
  empresaId?: string;
  usuarioId?: string;
  payload?: Record<string, any>;
  creada_en: string;
  actualizada_en: string;
}

export const notificacionService = {
  // Obtener notificaciones del usuario logueado
  getNotificacionesUsuario: async (): Promise<ApiResponse<Notificacion[]>> => {
    const response = await apiClient.get('/notificaciones/usuario');
    return response.data as ApiResponse<Notificacion[]>;
  },

  // Obtener notificaciones de la empresa del usuario logueado
  getNotificacionesEmpresa: async (): Promise<ApiResponse<Notificacion[]>> => {
    const response = await apiClient.get('/notificaciones/empresa');
    return response.data as ApiResponse<Notificacion[]>;
  },

  // Obtener notificaciones no leídas del usuario
  getNotificacionesNoLeidas: async (): Promise<ApiResponse<Notificacion[]>> => {
    const response = await apiClient.get('/notificaciones/no-leidas');
    return response.data as ApiResponse<Notificacion[]>;
  },

  // Marcar notificación como leída
  marcarComoLeida: async (notificacionId: string): Promise<void> => {
    await apiClient.patch(`/notificaciones/${notificacionId}/leida`);
  }
};