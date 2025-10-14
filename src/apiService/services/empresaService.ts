import { apiClient } from '../client';
import type { Empresa, EmpresaCreate, EmpresaUpdate, EmpresaFilters, QueryParams } from '../types';

export class EmpresaService {
  // Obtener todas las empresas con paginación
  async getEmpresas(params?: EmpresaFilters) {
    return apiClient.getPaginated<Empresa>('/empresas', params);
  }

  // Obtener una empresa por ID
  async getEmpresa(id: string): Promise<Empresa> {
    const response = await apiClient.get<Empresa>(`/empresas/${id}`);
    return response.data!;
  }

  // Crear una nueva empresa
  async createEmpresa(empresaData: EmpresaCreate): Promise<Empresa> {
    const response = await apiClient.post<Empresa>('/empresas', empresaData);
    // El backend devuelve directamente el documento, no en data
    return response.data || response as any;
  }

  // Actualizar una empresa
  async updateEmpresa(id: string, empresaData: EmpresaUpdate): Promise<Empresa> {
    const response = await apiClient.patch<Empresa>(`/empresas/${id}`, empresaData);
    return response.data!;
  }

  // Eliminar una empresa
  async deleteEmpresa(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/empresas/${id}`);
    return response.data || { success: true, message: 'Empresa eliminada' };
  }

  // Obtener empresas por evento
  async getEmpresasByEvento(eventoId: string, params?: Omit<EmpresaFilters, 'eventoId'>) {
    return apiClient.getPaginated<Empresa>(`/empresas/by-evento/${eventoId}`, params);
  }

  // Obtener empresas asignadas a una mesa
  async getEmpresasByMesa(mesaId: string, params?: QueryParams) {
    return apiClient.getPaginated<Empresa>('/empresas', {
      ...params,
      mesaId,
    });
  }

  // Buscar empresas por término de búsqueda
  async searchEmpresas(searchTerm: string, params?: EmpresaFilters) {
    return apiClient.getPaginated<Empresa>('/empresas/search', {
      ...params,
      q: searchTerm,
    });
  }

  // Obtener empresas por rubro
  async getEmpresasByRubro(rubro: string, params?: EmpresaFilters) {
    return apiClient.getPaginated<Empresa>('/empresas', {
      ...params,
      rubro,
    });
  }

  // Obtener empresa por encargado
  async getEmpresaByEncargado(encargadoId: string): Promise<Empresa> {
    const response = await apiClient.get<Empresa>(`/empresas/by-encargado/${encargadoId}`);
    
    // Si no hay datos (304 Not Modified), lanzar error
    if (!response.data) {
      throw new Error('No se encontró empresa para este encargado');
    }
    
    return response.data;
  }

  // Obtener empresa por empleado (personal)
  async getEmpresaByPersonal(personalId: string): Promise<Empresa> {
    const response = await apiClient.get<Empresa>(`/empresas/by-personal/${personalId}`);
    
    // Si no hay datos (304 Not Modified), lanzar error
    if (!response.data) {
      throw new Error('No se encontró empresa para este empleado');
    }
    
    return response.data;
  }

  // Obtener empresas sin mesa asignada
  async getEmpresasSinMesa(eventoId: string, params?: Omit<EmpresaFilters, 'eventoId'>) {
    return apiClient.getPaginated<Empresa>(`/empresas/by-evento/${eventoId}`, {
      ...params,
      sinMesa: true,
    });
  }

  // Asignar empresa a mesa
  async asignarEmpresaAMesa(empresaId: string, mesaId: string): Promise<Empresa> {
    const response = await apiClient.patch<Empresa>(`/empresas/${empresaId}/asignar-mesa`, { mesaId });
    return response.data!;
  }

  // Desasignar empresa de mesa
  async desasignarEmpresaDeMesa(empresaId: string): Promise<Empresa> {
    const response = await apiClient.patch<Empresa>(`/empresas/${empresaId}/desasignar-mesa`);
    return response.data!;
  }

  // Subir logo de empresa
  async uploadEmpresaLogo(id: string, file: File): Promise<Empresa> {
    const response = await apiClient.uploadFile<Empresa>(`/empresas/${id}/logo`, file);
    return response.data!;
  }

  // Eliminar logo de empresa
  async deleteEmpresaLogo(id: string): Promise<Empresa> {
    const response = await apiClient.delete<Empresa>(`/empresas/${id}/logo`);
    return response.data!;
  }

  // Obtener estadísticas de empresas
  async getEmpresaStats(eventoId?: string) {
    const endpoint = eventoId ? `/empresas/stats?eventoId=${eventoId}` : '/empresas/stats';
    const response = await apiClient.get<{
      totalEmpresas: number;
      empresasConMesa: number;
      empresasSinMesa: number;
      distribucionRubros: Record<string, number>;
      distribucionEventos: Record<string, number>;
    }>(endpoint);
    return response.data!;
  }

  // Obtener empresas por representante
  async getEmpresasByRepresentante(representante: string, params?: EmpresaFilters) {
    return apiClient.getPaginated<Empresa>('/empresas', {
      ...params,
      representante,
    });
  }

  // Verificar disponibilidad de NIT
  async checkNitAvailability(nit: string, eventoId: string): Promise<{ available: boolean }> {
    const response = await apiClient.get<{ available: boolean }>(`/empresas/check-nit/${nit}?eventoId=${eventoId}`);
    return response.data!;
  }

  // Obtener empresas con más reuniones
  async getEmpresasTopReuniones(eventoId: string, limit: number = 10) {
    const response = await apiClient.get<Empresa[]>(`/empresas/top-reuniones/${eventoId}?limit=${limit}`);
    return response.data!;
  }

  // Exportar empresas a CSV/Excel
  async exportEmpresas(eventoId?: string, formato: 'csv' | 'xlsx' = 'xlsx') {
    const endpoint = eventoId ? `/empresas/export?eventoId=${eventoId}&formato=${formato}` : `/empresas/export?formato=${formato}`;
    
    const response = await fetch(`${apiClient['baseURL']}${endpoint}`, {
      method: 'GET',
      headers: apiClient['getHeaders'](),
    });

    if (!response.ok) {
      throw new Error('Error al exportar empresas');
    }

    return response.blob();
  }

  // Importar empresas desde CSV/Excel
  async importEmpresas(file: File, eventoId: string) {
    const response = await apiClient.uploadFile<{
      success: boolean;
      imported: number;
      errors: string[];
    }>('/empresas/import', file, { eventoId });
    return response.data!;
  }
}

// Instancia singleton del servicio
export const empresaService = new EmpresaService();
