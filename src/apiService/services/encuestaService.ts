import { apiClient } from '../client';
import type { QueryParams } from '../types';

export interface EncuestaReunion {
  _id: string;
  eventoId: string;
  solicitudReunionId: string;
  empresaId: string;
  calificacion_general: number;
  match_negocio?: number | null;
  puntualidad?: number | null;
  interes_contraparte?: number | null;
  recomendar_nps?: number | null;
  monto_acordado?: number | null;
  comentarios?: string | null;
  creada_en: string;
  actualizada_en: string;
}

export interface EncuestaCreate {
  eventoId: string;
  solicitudReunionId: string;
  empresaId: string;
  calificacion_general: number;
  match_negocio?: number | null;
  puntualidad?: number | null;
  interes_contraparte?: number | null;
  recomendar_nps?: number | null;
  monto_acordado?: number | null;
  comentarios?: string | null;
}

export interface EncuestaPendiente {
  solicitudReunionId: string;
  eventoId: string;
  empresaContraparte: {
    _id: string;
    nombre: string;
  };
  fechaReunion: string;
  fechaFin: string;
  tipoReunion: 'virtual' | 'presencial';
  mensaje?: string | null;
}

export interface EncuestaCompleta {
  solicitudReunionId: string;
  ambasCompletaron: boolean;
  empresasConEncuesta: {
    solicitante: boolean;
    objetivo: boolean;
  };
  totalEncuestas: number;
  fechaReunion: string;
  fechaFin: string;
  reunionFinalizada: boolean;
}

export class EncuestaService {
  // Obtener encuestas con paginación
  async getEncuestas(params?: QueryParams) {
    return apiClient.getPaginated<EncuestaReunion>('/encuestas', params);
  }

  // Obtener una encuesta por ID
  async getEncuesta(id: string): Promise<EncuestaReunion> {
    const response = await apiClient.get<EncuestaReunion>(`/encuestas/${id}`);
    return response.data!;
  }

  // Crear una nueva encuesta
  async createEncuesta(encuestaData: EncuestaCreate): Promise<EncuestaReunion> {
    const response = await apiClient.post<EncuestaReunion>('/encuestas', encuestaData);
    return response.data!;
  }

  // Actualizar una encuesta
  async updateEncuesta(id: string, encuestaData: Partial<EncuestaCreate>): Promise<EncuestaReunion> {
    const response = await apiClient.patch<EncuestaReunion>(`/encuestas/${id}`, encuestaData);
    return response.data!;
  }

  // Eliminar una encuesta
  async deleteEncuesta(id: string): Promise<{ ok: boolean }> {
    const response = await apiClient.delete<{ ok: boolean }>(`/encuestas/${id}`);
    return response.data!;
  }

  // Obtener métricas de encuestas
  async getMetricasEncuestas(eventoId?: string, solicitudReunionId?: string) {
    const params = new URLSearchParams();
    if (eventoId) params.append('eventoId', eventoId);
    if (solicitudReunionId) params.append('solicitudReunionId', solicitudReunionId);
    
    const response = await apiClient.get<{
      count: number;
      avg: {
        general: number | null;
        match_negocio: number | null;
        puntualidad: number | null;
        interes_contraparte: number | null;
      };
      nps: number | null;
    }>(`/encuestas/metricas?${params.toString()}`);
    return response.data!;
  }

  // Verificar encuestas pendientes para una empresa
  async getEncuestasPendientes(empresaId: string): Promise<{
    pendientes: EncuestaPendiente[];
    total: number;
  }> {
    console.log(`🌐 encuestaService: Llamando a /encuestas/pendientes/${empresaId}`);
    try {
      const response = await apiClient.get<{
        pendientes: EncuestaPendiente[];
        total: number;
      }>(`/encuestas/pendientes/${empresaId}`);
      console.log(`🌐 encuestaService: Respuesta recibida:`, response);
      console.log(`🌐 encuestaService: response.data:`, response.data);
      
      // El cliente API ya devuelve los datos directamente, no necesitamos .data
      return response as any;
    } catch (error) {
      console.error(`🌐 encuestaService: Error en la llamada:`, error);
      throw error;
    }
  }

  // Verificar si ambas empresas completaron la encuesta
  async verificarEncuestaCompleta(solicitudReunionId: string): Promise<EncuestaCompleta> {
    const response = await apiClient.get<EncuestaCompleta>(`/encuestas/completa/${solicitudReunionId}`);
    return response.data!;
  }
}

// Instancia singleton del servicio
export const encuestaService = new EncuestaService();