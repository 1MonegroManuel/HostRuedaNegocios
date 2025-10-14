import { apiClient } from '../client';
import type { Mesa, MesaCreate, MesaUpdate, MesaFilters } from '../types';

export class MesaService {
  // Obtener todas las mesas con paginación
  async getMesas(params?: MesaFilters) {
    return apiClient.getPaginated<Mesa>('/mesas', params);
  }

  // Obtener una mesa por ID
  async getMesa(id: string): Promise<Mesa> {
    const response = await apiClient.get<Mesa>(`/mesas/${id}`);
    return response.data!;
  }

  // Crear una nueva mesa
  async createMesa(mesaData: MesaCreate): Promise<Mesa> {
    const response = await apiClient.post<Mesa>('/mesas', mesaData);
    return response.data!;
  }

  // Actualizar una mesa
  async updateMesa(id: string, mesaData: MesaUpdate): Promise<Mesa> {
    const response = await apiClient.patch<Mesa>(`/mesas/${id}`, mesaData);
    return response.data!;
  }

  // Eliminar una mesa
  async deleteMesa(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/mesas/${id}`);
    return response.data || { success: false, message: 'Error al eliminar mesa' };
  }

  // Obtener mesas por evento
  async getMesasByEvento(eventoId: string, params?: Omit<MesaFilters, 'eventoId'>) {
    return apiClient.getPaginated<Mesa>(`/mesas/by-evento/${eventoId}`, params);
  }

  // Obtener mesas activas
  async getMesasActivas(eventoId?: string, params?: MesaFilters) {
    return apiClient.getPaginated<Mesa>('/mesas', {
      ...params,
      activa: true,
      ...(eventoId && { eventoId }),
    });
  }

  // Obtener mesas inactivas
  async getMesasInactivas(eventoId?: string, params?: MesaFilters) {
    return apiClient.getPaginated<Mesa>('/mesas', {
      ...params,
      activa: false,
      ...(eventoId && { eventoId }),
    });
  }

  // Buscar mesas por término de búsqueda
  async searchMesas(searchTerm: string, params?: MesaFilters) {
    return apiClient.getPaginated<Mesa>('/mesas/search', {
      ...params,
      q: searchTerm,
    });
  }

  // Obtener mesas por ubicación
  async getMesasByUbicacion(ubicacion: string, eventoId?: string, params?: MesaFilters) {
    return apiClient.getPaginated<Mesa>('/mesas', {
      ...params,
      ubicacion,
      ...(eventoId && { eventoId }),
    });
  }

  // Obtener mesas por capacidad
  async getMesasByCapacidad(capacidadMin: number, capacidadMax?: number, eventoId?: string, params?: MesaFilters) {
    return apiClient.getPaginated<Mesa>('/mesas', {
      ...params,
      capacidadMin,
      ...(capacidadMax && { capacidadMax }),
      ...(eventoId && { eventoId }),
    });
  }

  // Activar/desactivar mesa
  async toggleMesaStatus(id: string, activa: boolean): Promise<Mesa> {
    const response = await apiClient.patch<Mesa>(`/mesas/${id}/status`, { activa });
    return response.data!;
  }

  // Obtener mesas disponibles (sin empresas asignadas)
  async getMesasDisponibles(eventoId: string): Promise<Mesa[]> {
    try {
      const response = await apiClient.get<{ data: Mesa[] }>(`/mesas/disponibles/${eventoId}`);
      
      // El backend devuelve { data: mesasDisponibles }
      // El apiClient puede envolver esto, así que manejamos ambas estructuras
      let mesas: Mesa[] = [];
      
      if (Array.isArray(response.data)) {
        // Si response.data es directamente un array
        mesas = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        // Si response.data tiene la estructura { data: [...] }
        mesas = response.data.data;
      }
      
      return mesas;
    } catch (error) {
      console.error('❌ Error obteniendo mesas disponibles:', error);
      return [];
    }
  }

  // Obtener mesas ocupadas (con empresas asignadas)
  async getMesasOcupadas(eventoId: string, params?: Omit<MesaFilters, 'eventoId'>) {
    return apiClient.getPaginated<Mesa>(`/mesas/by-evento/${eventoId}`, {
      ...params,
      ocupadas: true,
    });
  }

  // Obtener estadísticas de mesas
  async getMesaStats(eventoId?: string) {
    const endpoint = eventoId ? `/mesas/stats?eventoId=${eventoId}` : '/mesas/stats';
    const response = await apiClient.get<{
      totalMesas: number;
      mesasActivas: number;
      mesasInactivas: number;
      mesasDisponibles: number;
      mesasOcupadas: number;
      capacidadTotal: number;
      capacidadUtilizada: number;
      distribucionCapacidades: Record<number, number>;
    }>(endpoint);
    return response.data!;
  }

  // Verificar disponibilidad de número de mesa
  async checkNumeroMesaDisponible(numero: number, eventoId: string, mesaId?: string): Promise<{ available: boolean }> {
    const endpoint = mesaId 
      ? `/mesas/check-numero/${numero}?eventoId=${eventoId}&excludeId=${mesaId}`
      : `/mesas/check-numero/${numero}?eventoId=${eventoId}`;
    
    const response = await apiClient.get<{ available: boolean }>(endpoint);
    return response.data!;
  }

  // Obtener mesas por rango de números
  async getMesasByNumeroRange(numeroInicio: number, numeroFin: number, eventoId?: string, params?: MesaFilters) {
    return apiClient.getPaginated<Mesa>('/mesas', {
      ...params,
      numeroInicio,
      numeroFin,
      ...(eventoId && { eventoId }),
    });
  }

  // Obtener mesas VIP
  async getMesasVIP(eventoId?: string, params?: MesaFilters) {
    return apiClient.getPaginated<Mesa>('/mesas', {
      ...params,
      vip: true,
      ...(eventoId && { eventoId }),
    });
  }

  // Duplicar mesas de un evento a otro
  async duplicateMesas(eventoOrigenId: string, eventoDestinoId: string): Promise<Mesa[]> {
    const response = await apiClient.post<Mesa[]>(`/mesas/duplicate`, {
      eventoOrigenId,
      eventoDestinoId,
    });
    return response.data!;
  }

  // Reorganizar números de mesa
  async reorganizarNumerosMesas(eventoId: string): Promise<Mesa[]> {
    const response = await apiClient.patch<Mesa[]>(`/mesas/reorganizar/${eventoId}`);
    return response.data!;
  }

  // Exportar mesas a CSV/Excel
  async exportMesas(eventoId?: string, formato: 'csv' | 'xlsx' = 'xlsx') {
    const endpoint = eventoId ? `/mesas/export?eventoId=${eventoId}&formato=${formato}` : `/mesas/export?formato=${formato}`;
    
    const response = await fetch(`${apiClient['baseURL']}${endpoint}`, {
      method: 'GET',
      headers: apiClient['getHeaders'](),
    });

    if (!response.ok) {
      throw new Error('Error al exportar mesas');
    }

    return response.blob();
  }
}

// Instancia singleton del servicio
export const mesaService = new MesaService();
