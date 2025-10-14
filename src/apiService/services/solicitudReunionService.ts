import { apiClient } from '../client';
import type { SolicitudReunion, SolicitudReunionCreate, SolicitudReunionUpdate, SolicitudReunionFilters } from '../types';

export class SolicitudReunionService {
  // Obtener todas las solicitudes con paginación
  async getSolicitudesReunion(params?: SolicitudReunionFilters) {
    return apiClient.getPaginated<SolicitudReunion>('/solicitudes', params);
  }

  // Obtener una solicitud por ID
  async getSolicitudReunion(id: string): Promise<SolicitudReunion> {
    const response = await apiClient.get<SolicitudReunion>(`/solicitudes/${id}`);
    return response.data!;
  }

  // Crear una nueva solicitud
  async createSolicitudReunion(solicitudData: SolicitudReunionCreate): Promise<SolicitudReunion> {
    const response = await apiClient.post<SolicitudReunion>('/solicitudes', solicitudData);
    return response.data!;
  }

  // Actualizar una solicitud
  async updateSolicitudReunion(id: string, solicitudData: SolicitudReunionUpdate): Promise<SolicitudReunion> {
    const response = await apiClient.patch<SolicitudReunion>(`/solicitudes/${id}`, solicitudData);
    return response.data!;
  }

  // Eliminar una solicitud
  async deleteSolicitudReunion(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/solicitudes/${id}`);
    return response.data || { success: false, message: 'Error al eliminar solicitud' };
  }

  // Obtener solicitudes por evento
  async getSolicitudesByEvento(eventoId: string, params?: Omit<SolicitudReunionFilters, 'eventoId'>) {
    return apiClient.getPaginated<SolicitudReunion>(`/solicitudes`, { ...params, eventoId });
  }

  // Obtener solicitudes enviadas por una empresa
  async getSolicitudesEnviadas(empresaId: string, params?: SolicitudReunionFilters) {
    return apiClient.getPaginated<SolicitudReunion>('/solicitudes', {
      ...params,
      empresaSolicitaId: empresaId,
    });
  }

  // Obtener solicitudes recibidas por una empresa
  async getSolicitudesRecibidas(empresaId: string, params?: SolicitudReunionFilters) {
    const queryParams = {
      ...params,
      empresaObjetivoId: empresaId,
    };
    console.log('🔍 getSolicitudesRecibidas - empresaId:', empresaId);
    console.log('🔍 getSolicitudesRecibidas - queryParams:', queryParams);
    return apiClient.getPaginated<SolicitudReunion>('/solicitudes', queryParams);
  }

  // Obtener solicitudes por usuario
  async getSolicitudesByUsuario(usuarioId: string, params?: SolicitudReunionFilters) {
    return apiClient.getPaginated<SolicitudReunion>('/solicitudes', {
      ...params,
      usuarioSolicitaId: usuarioId,
    });
  }

  // Obtener solicitudes por estado
  async getSolicitudesByEstado(estado: string, params?: SolicitudReunionFilters) {
    return apiClient.getPaginated<SolicitudReunion>('/solicitudes', {
      ...params,
      estado,
    });
  }

  // Aceptar solicitud
  async aceptarSolicitud(id: string): Promise<SolicitudReunion> {
    const response = await apiClient.patch<SolicitudReunion>(`/solicitudes/${id}/estado`, { estado: 'aceptada' });
    return response.data!;
  }

  // Rechazar solicitud
  async rechazarSolicitud(id: string): Promise<SolicitudReunion> {
    const response = await apiClient.patch<SolicitudReunion>(`/solicitudes/${id}/estado`, { estado: 'rechazada' });
    return response.data!;
  }

  // Cancelar solicitud
  async cancelarSolicitud(id: string): Promise<SolicitudReunion> {
    const response = await apiClient.patch<SolicitudReunion>(`/solicitudes/${id}/estado`, { estado: 'cancelada' });
    return response.data!;
  }

  // Buscar solicitudes por término
  async searchSolicitudes(searchTerm: string, params?: SolicitudReunionFilters) {
    return apiClient.getPaginated<SolicitudReunion>('/solicitudes', {
      ...params,
      q: searchTerm,
    });
  }

  // Obtener estadísticas de solicitudes
  async getSolicitudStats(eventoId?: string) {
    const endpoint = eventoId ? `/solicitudes/stats?eventoId=${eventoId}` : '/solicitudes/stats';
    const response = await apiClient.get<{
      totalSolicitudes: number;
      solicitudesPendientes: number;
      solicitudesAceptadas: number;
      solicitudesRechazadas: number;
      solicitudesCanceladas: number;
      solicitudesVirtuales: number;
      solicitudesPresenciales: number;
    }>(endpoint);
    return response.data!;
  }

  // Verificar si existe solicitud pendiente entre dos empresas
  async verificarSolicitudExistente(eventoId: string, empresaSolicitaId: string, empresaObjetivoId: string): Promise<{ exists: boolean; solicitud?: SolicitudReunion }> {
    const response = await apiClient.get<{ exists: boolean; solicitud?: SolicitudReunion }>(
      `/solicitudes/verificar-existente?eventoId=${eventoId}&empresaSolicitaId=${empresaSolicitaId}&empresaObjetivoId=${empresaObjetivoId}`
    );
    return response.data!;
  }
}

// Instancia singleton del servicio
export const solicitudReunionService = new SolicitudReunionService();