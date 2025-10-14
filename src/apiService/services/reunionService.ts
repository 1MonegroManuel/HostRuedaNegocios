import { apiClient } from '../client';
import type { Reunion, ReunionCreate, ReunionUpdate, ReunionFilters, EstadoReunion, QueryParams } from '../types';

export class ReunionService {
  // Obtener todas las reuniones con paginación
  async getReuniones(params?: ReunionFilters) {
    return apiClient.getPaginated<Reunion>('/reuniones', params);
  }

  // Obtener una reunión por ID
  async getReunion(id: string): Promise<Reunion> {
    const response = await apiClient.get<Reunion>(`/reuniones/${id}`);
    return response.data!;
  }

  // Crear una nueva reunión
  async createReunion(reunionData: ReunionCreate): Promise<Reunion> {
    const response = await apiClient.post<Reunion>('/reuniones', reunionData);
    return response.data!;
  }

  // Actualizar una reunión
  async updateReunion(id: string, reunionData: ReunionUpdate): Promise<Reunion> {
    const response = await apiClient.patch<Reunion>(`/reuniones/${id}`, reunionData);
    return response.data!;
  }

  // Eliminar una reunión
  async deleteReunion(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/reuniones/${id}`);
    return response.data || { success: false, message: 'Error al eliminar reunión' };
  }

  // Obtener reuniones por evento
  async getReunionesByEvento(eventoId: string, params?: Omit<ReunionFilters, 'eventoId'>) {
    return apiClient.getPaginated<Reunion>(`/reuniones/by-evento/${eventoId}`, params);
  }

  // Obtener reuniones por estado
  async getReunionesByEstado(estado: EstadoReunion, eventoId?: string, params?: ReunionFilters) {
    return apiClient.getPaginated<Reunion>('/reuniones', {
      ...params,
      estado,
      ...(eventoId && { eventoId }),
    });
  }

  // Obtener reuniones por empresa
  async getReunionesByEmpresa(empresaId: string, params?: Omit<ReunionFilters, 'empresaId'>) {
    return apiClient.getPaginated<Reunion>('/reuniones', {
      ...params,
      empresaId,
    });
  }

  // Obtener reuniones por mesa
  async getReunionesByMesa(mesaId: string, params?: QueryParams) {
    return apiClient.getPaginated<Reunion>('/reuniones', {
      ...params,
      mesaId,
    });
  }

  // Obtener reuniones por rango de fechas
  async getReunionesByDateRange(fechaInicio: string, fechaFin: string, eventoId?: string, params?: ReunionFilters) {
    return apiClient.getPaginated<Reunion>('/reuniones', {
      ...params,
      fechaInicio,
      fechaFin,
      ...(eventoId && { eventoId }),
    });
  }

  // Obtener reuniones del día
  async getReunionesDelDia(fecha: string, eventoId?: string, params?: ReunionFilters) {
    return apiClient.getPaginated<Reunion>('/reuniones', {
      ...params,
      fecha,
      ...(eventoId && { eventoId }),
    });
  }

  // Cambiar estado de reunión
  async cambiarEstadoReunion(id: string, nuevoEstado: EstadoReunion): Promise<Reunion> {
    const response = await apiClient.patch<Reunion>(`/reuniones/${id}/estado`, { estado: nuevoEstado });
    return response.data!;
  }

  // Confirmar reunión
  async confirmarReunion(id: string): Promise<Reunion> {
    return this.cambiarEstadoReunion(id, 'confirmada');
  }

  // Completar reunión
  async completarReunion(id: string): Promise<Reunion> {
    return this.cambiarEstadoReunion(id, 'completada');
  }

  // Cancelar reunión
  async cancelarReunion(id: string, motivo?: string): Promise<Reunion> {
    const response = await apiClient.patch<Reunion>(`/reuniones/${id}/estado`, { 
      estado: 'cancelada',
      notas: motivo 
    });
    return response.data!;
  }

  // Marcar como no show
  async marcarNoShow(id: string): Promise<Reunion> {
    return this.cambiarEstadoReunion(id, 'no_show');
  }

  // Obtener reuniones próximas
  async getReunionesProximas(eventoId?: string, horas: number = 24) {
    return apiClient.getPaginated<Reunion>('/reuniones/proximas', {
      eventoId,
      horas,
    });
  }

  // Obtener reuniones vencidas
  async getReunionesVencidas(eventoId?: string) {
    return apiClient.getPaginated<Reunion>('/reuniones/vencidas', {
      eventoId,
    });
  }

  // Obtener estadísticas de reuniones
  async getReunionStats(eventoId?: string) {
    const endpoint = eventoId ? `/reuniones/stats?eventoId=${eventoId}` : '/reuniones/stats';
    const response = await apiClient.get<{
      totalReuniones: number;
      reunionesProgramadas: number;
      reunionesConfirmadas: number;
      reunionesCompletadas: number;
      reunionesCanceladas: number;
      reunionesNoShow: number;
      tasaCompletitud: number;
      tasaAsistencia: number;
      promedioDuracion: number;
      distribucionEstados: Record<EstadoReunion, number>;
    }>(endpoint);
    return response.data!;
  }

  // Obtener cronograma de reuniones
  async getCronograma(eventoId: string, fecha?: string) {
    const response = await apiClient.get<{
      fecha: string;
      reuniones: Reunion[];
      totalReuniones: number;
      duracionTotal: number;
    }>(`/reuniones/cronograma/${eventoId}`, { fecha });
    return response.data!;
  }

  // Obtener conflictos de horarios
  async getConflictosHorarios(eventoId: string, fecha: string) {
    const response = await apiClient.get<{
      conflictos: Array<{
        tipo: 'empresa' | 'mesa';
        descripcion: string;
        reuniones: Reunion[];
      }>;
    }>(`/reuniones/conflictos/${eventoId}`, { fecha });
    return response.data!;
  }

  // Verificar disponibilidad de horario
  async verificarDisponibilidad(eventoId: string, mesaId: string, inicio: string, fin: string, reunionId?: string) {
    const response = await apiClient.post<{
      disponible: boolean;
      conflictos: Reunion[];
    }>('/reuniones/verificar-disponibilidad', {
      eventoId,
      mesaId,
      inicio,
      fin,
      reunionId,
    });
    return response.data!;
  }

  // Reagendar reunión
  async reagendarReunion(id: string, nuevaFecha: string, nuevaHoraInicio: string, nuevaHoraFin: string): Promise<Reunion> {
    const response = await apiClient.patch<Reunion>(`/reuniones/${id}/reagendar`, {
      inicio: nuevaFecha + 'T' + nuevaHoraInicio,
      fin: nuevaFecha + 'T' + nuevaHoraFin,
    });
    return response.data!;
  }

  // Exportar reuniones a CSV/Excel
  async exportReuniones(eventoId?: string, formato: 'csv' | 'xlsx' = 'xlsx') {
    const endpoint = eventoId ? `/reuniones/export?eventoId=${eventoId}&formato=${formato}` : `/reuniones/export?formato=${formato}`;
    
    const response = await fetch(`${apiClient['baseURL']}${endpoint}`, {
      method: 'GET',
      headers: apiClient['getHeaders'](),
    });

    if (!response.ok) {
      throw new Error('Error al exportar reuniones');
    }

    return response.blob();
  }

  // Generar reporte de reuniones
  async generarReporte(eventoId: string, tipo: 'resumen' | 'detallado' | 'estadisticas' = 'resumen') {
    const response = await apiClient.get<{
      tipo: string;
      eventoId: string;
      fechaGeneracion: string;
      datos: any;
    }>(`/reuniones/reporte/${eventoId}`, { tipo });
    return response.data!;
  }
}

// Instancia singleton del servicio
export const reunionService = new ReunionService();
