import { apiClient } from '../client';
import type { Evento, EventoCreate, EventoUpdate, QueryParams } from '../types';

export class EventoService {
  // Obtener todos los eventos con paginación
  async getEventos(params?: QueryParams) {
    return apiClient.getPaginated<Evento>('/eventos', params);
  }

  // Obtener un evento por ID
  async getEvento(id: string): Promise<Evento> {
    const response = await apiClient.get<Evento>(`/eventos/${id}`);
    return response.data!;
  }

  // Crear un nuevo evento
  async createEvento(eventoData: EventoCreate): Promise<Evento> {
    const response = await apiClient.post<Evento>('/eventos', eventoData);
    return response.data!;
  }

  // Actualizar un evento
  async updateEvento(id: string, eventoData: EventoUpdate): Promise<Evento> {
    const response = await apiClient.patch<Evento>(`/eventos/${id}`, eventoData);
    return response.data!;
  }

  // Cambiar estado de un evento
  async cambiarEstadoEvento(id: string, estado: 'ACTIVO' | 'FINALIZADO' | 'CANCELADO' | 'PROGRAMADO'): Promise<Evento> {
    const response = await apiClient.patch<Evento>(`/eventos/${id}/estado`, { estado });
    return response.data!;
  }

  // Buscar eventos por término de búsqueda
  async searchEventos(searchTerm: string, params?: QueryParams) {
    return apiClient.getPaginated<Evento>('/eventos/search', {
      ...params,
      q: searchTerm,
    });
  }

  // Obtener eventos por modo de mesas
  async getEventosByModoMesas(modo: 'FIJA_POR_EMPRESA' | 'POR_REUNION', params?: QueryParams) {
    return apiClient.getPaginated<Evento>('/eventos', {
      ...params,
      modo_mesas: modo,
    });
  }

  // Obtener todos los eventos (excepto finalizados)
  async getTodosEventos(params?: QueryParams) {
    return apiClient.getPaginated<Evento>('/eventos/todos', params);
  }

  // Obtener eventos activos (futuros)
  async getEventosActivos(params?: QueryParams) {
    return apiClient.getPaginated<Evento>('/eventos/activos', params);
  }

  // Obtener eventos pasados
  async getEventosPasados(params?: QueryParams) {
    return apiClient.getPaginated<Evento>('/eventos/pasados', params);
  }

  // Obtener eventos por rango de fechas
  async getEventosByDateRange(fechaInicio: string, fechaFin: string, params?: QueryParams) {
    return apiClient.getPaginated<Evento>('/eventos', {
      ...params,
      fechaInicio,
      fechaFin,
    });
  }

  // Obtener estadísticas de un evento
  async getEventoStats(id: string) {
    const response = await apiClient.get<{
      totalEmpresas: number;
      totalMesas: number;
      totalReuniones: number;
      reunionesCompletadas: number;
      tasaCompletitud: number;
      empresasConMesa: number;
      empresasSinMesa: number;
    }>(`/eventos/${id}/stats`);
    return response.data!;
  }

  // Duplicar un evento
  async duplicateEvento(id: string, nuevoNombre: string, nuevaFechaInicio: string): Promise<Evento> {
    const response = await apiClient.post<Evento>(`/eventos/${id}/duplicate`, {
      nombre: nuevoNombre,
      inicio: nuevaFechaInicio,
    });
    return response.data!;
  }

  // Exportar datos del evento
  async exportEventoData(id: string, formato: 'csv' | 'xlsx' | 'pdf' = 'xlsx') {
    const response = await fetch(`${apiClient['baseURL']}/eventos/${id}/export?formato=${formato}`, {
      method: 'GET',
      headers: apiClient['getHeaders'](),
    });

    if (!response.ok) {
      throw new Error('Error al exportar datos del evento');
    }

    return response.blob();
  }

  // Subir logo del evento
  async uploadEventoLogo(id: string, file: File): Promise<Evento> {
    const response = await apiClient.uploadFile<Evento>(`/eventos/${id}/logo`, file);
    return response.data!;
  }

  // Eliminar un evento
  async deleteEvento(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/eventos/${id}`);
    return response.data || { success: false, message: 'Error al eliminar evento' };
  }

  // Obtener eventos próximos (próximos 30 días)
  async getEventosProximos(params?: QueryParams) {
    return apiClient.getPaginated<Evento>('/eventos/proximos', params);
  }

  // Obtener eventos por año
  async getEventosByYear(year: number, params?: QueryParams) {
    return apiClient.getPaginated<Evento>('/eventos', {
      ...params,
      year,
    });
  }
}

// Instancia singleton del servicio
export const eventoService = new EventoService();
