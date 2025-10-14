import { apiClient } from '../client';
import type { ArchivoEvento, ArchivoEventoCreate, ArchivoEventoUpdate, ArchivoFilters, TipoArchivoEvento } from '../types';

export class ArchivoEventoService {
  // Obtener todos los archivos con paginación
  async getArchivos(params?: ArchivoFilters) {
    return apiClient.getPaginated<ArchivoEvento>('/archivos-evento', params);
  }

  // Obtener un archivo por ID
  async getArchivo(id: string): Promise<ArchivoEvento> {
    const response = await apiClient.get<ArchivoEvento>(`/archivos-evento/${id}`);
    return response.data!;
  }

  // Crear un nuevo archivo
  async createArchivo(archivoData: ArchivoEventoCreate): Promise<ArchivoEvento> {
    const response = await apiClient.post<ArchivoEvento>('/archivos-evento', archivoData);
    return response.data!;
  }

  // Actualizar un archivo
  async updateArchivo(id: string, archivoData: ArchivoEventoUpdate): Promise<ArchivoEvento> {
    const response = await apiClient.patch<ArchivoEvento>(`/archivos-evento/${id}`, archivoData);
    return response.data!;
  }

  // Eliminar un archivo
  async deleteArchivo(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/archivos-evento/${id}`);
    return response.data || { success: true, message: 'Archivo eliminado' };
  }

  // Obtener archivos por evento
  async getArchivosByEvento(eventoId: string, params?: Omit<ArchivoFilters, 'eventoId'>) {
    return apiClient.getPaginated<ArchivoEvento>(`/archivos-evento/by-evento/${eventoId}`, params);
  }

  // Obtener archivos por tipo
  async getArchivosByTipo(tipo: TipoArchivoEvento, eventoId?: string, params?: ArchivoFilters) {
    console.log(`🔍 getArchivosByTipo - tipo: ${tipo}, eventoId: ${eventoId}`);
    
    if (eventoId) {
      // Si hay eventoId, usar el endpoint específico y filtrar por tipo
      console.log(`📡 Calling: /archivos-evento/by-evento/${eventoId}`);
      const response = await apiClient.getPaginated<ArchivoEvento>(`/archivos-evento/by-evento/${eventoId}`, params);
      console.log(`📋 Raw response:`, response);
      
      // Filtrar por tipo en el frontend
      const filteredData = response.data.filter(archivo => archivo.tipo === tipo);
      console.log(`🔍 Filtered data for tipo ${tipo}:`, filteredData);
      
      return {
        ...response,
        data: filteredData,
        total: filteredData.length
      };
    } else {
      console.log(`📡 Calling: /archivos-evento with tipo filter`);
      return apiClient.getPaginated<ArchivoEvento>('/archivos-evento', {
        ...params,
        tipo,
      });
    }
  }

  // Obtener mapas de eventos
  async getMapas(eventoId?: string, params?: ArchivoFilters) {
    return this.getArchivosByTipo('MAPA', eventoId, params);
  }

  // Obtener cronogramas de eventos
  async getCronogramas(eventoId?: string, params?: ArchivoFilters) {
    return this.getArchivosByTipo('CRONOGRAMA', eventoId, params);
  }

  // Obtener otros archivos de eventos
  async getOtrosArchivos(eventoId?: string, params?: ArchivoFilters) {
    return this.getArchivosByTipo('OTRO', eventoId, params);
  }

  // Subir archivo
  async uploadArchivo(eventoId: string, file: File, tipo: TipoArchivoEvento): Promise<ArchivoEvento> {
    const response = await apiClient.uploadFile<ArchivoEvento>('/archivos-evento/upload', file, {
      eventoId,
      tipo,
    });
    return response.data!;
  }

  // Descargar archivo
  async downloadArchivo(id: string): Promise<Blob> {
    const response = await fetch(`${apiClient['baseURL']}/archivos-evento/${id}/download`, {
      method: 'GET',
      headers: apiClient['getHeaders'](),
    });

    if (!response.ok) {
      throw new Error('Error al descargar archivo');
    }

    return response.blob();
  }

  // Obtener URL de descarga del archivo
  getDownloadUrl(id: string): string {
    return `${apiClient['baseURL']}/archivos-evento/${id}/download`;
  }

  // Obtener URL de vista previa del archivo
  getPreviewUrl(id: string): string {
    return `${apiClient['baseURL']}/archivos-evento/${id}/preview`;
  }

  // Obtener archivos por tipo MIME
  async getArchivosByMimeType(mimeType: string, eventoId?: string, params?: ArchivoFilters) {
    return apiClient.getPaginated<ArchivoEvento>('/archivos-evento', {
      ...params,
      mimeType,
      ...(eventoId && { eventoId }),
    });
  }

  // Obtener archivos PDF
  async getArchivosPDF(eventoId?: string, params?: ArchivoFilters) {
    return this.getArchivosByMimeType('application/pdf', eventoId, params);
  }

  // Obtener archivos Excel
  async getArchivosExcel(eventoId?: string, params?: ArchivoFilters) {
    return apiClient.getPaginated<ArchivoEvento>('/archivos-evento', {
      ...params,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ...(eventoId && { eventoId }),
    });
  }

  // Obtener archivos PowerPoint
  async getArchivosPowerPoint(eventoId?: string, params?: ArchivoFilters) {
    return apiClient.getPaginated<ArchivoEvento>('/archivos-evento', {
      ...params,
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ...(eventoId && { eventoId }),
    });
  }

  // Obtener archivos de imagen
  async getArchivosImagen(eventoId?: string, params?: ArchivoFilters) {
    return apiClient.getPaginated<ArchivoEvento>('/archivos-evento', {
      ...params,
      mimeType: 'image/',
      ...(eventoId && { eventoId }),
    });
  }

  // Buscar archivos por término de búsqueda
  async searchArchivos(searchTerm: string, params?: ArchivoFilters) {
    return apiClient.getPaginated<ArchivoEvento>('/archivos-evento/search', {
      ...params,
      q: searchTerm,
    });
  }

  // Obtener archivos recientes
  async getArchivosRecientes(eventoId?: string, limit: number = 10) {
    return apiClient.getPaginated<ArchivoEvento>('/archivos-evento', {
      eventoId,
      limit,
      sort: 'creado_en',
      order: 'desc',
    });
  }

  // Obtener archivos por rango de fechas
  async getArchivosByDateRange(fechaInicio: string, fechaFin: string, eventoId?: string, params?: ArchivoFilters) {
    return apiClient.getPaginated<ArchivoEvento>('/archivos-evento', {
      ...params,
      fechaInicio,
      fechaFin,
      ...(eventoId && { eventoId }),
    });
  }

  // Obtener estadísticas de archivos
  async getArchivoStats(eventoId?: string) {
    const endpoint = eventoId ? `/archivos-evento/stats?eventoId=${eventoId}` : '/archivos-evento/stats';
    const response = await apiClient.get<{
      totalArchivos: number;
      archivosPorTipo: Record<TipoArchivoEvento, number>;
      archivosPorMime: Record<string, number>;
      archivosPorEvento: Record<string, number>;
      tamañoTotal: number;
      archivosRecientes: number;
      distribucionTamaños: Array<{
        rango: string;
        cantidad: number;
      }>;
    }>(endpoint);
    return response.data!;
  }

  // Obtener archivos por tamaño
  async getArchivosBySize(tamañoMin: number, tamañoMax?: number, eventoId?: string, params?: ArchivoFilters) {
    return apiClient.getPaginated<ArchivoEvento>('/archivos-evento', {
      ...params,
      tamañoMin,
      ...(tamañoMax && { tamañoMax }),
      ...(eventoId && { eventoId }),
    });
  }

  // Obtener archivos grandes (>10MB)
  async getArchivosGrandes(eventoId?: string, params?: ArchivoFilters) {
    return this.getArchivosBySize(10 * 1024 * 1024, undefined, eventoId, params);
  }

  // Obtener archivos pequeños (<1MB)
  async getArchivosPequenos(eventoId?: string, params?: ArchivoFilters) {
    return this.getArchivosBySize(0, 1024 * 1024, eventoId, params);
  }

  // Verificar si un archivo existe
  async verificarArchivoExiste(nombreArchivo: string, eventoId: string): Promise<{ existe: boolean; archivo?: ArchivoEvento }> {
    const response = await apiClient.get<{ existe: boolean; archivo?: ArchivoEvento }>('/archivos-evento/verificar-existe', {
      nombreArchivo,
      eventoId,
    });
    return response.data!;
  }

  // Obtener archivos duplicados
  async getArchivosDuplicados(eventoId?: string) {
    const response = await apiClient.get<Array<{
      nombreArchivo: string;
      archivos: ArchivoEvento[];
      cantidad: number;
    }>>('/archivos-evento/duplicados', { eventoId });
    return response.data!;
  }

  // Eliminar archivos duplicados
  async eliminarArchivosDuplicados(eventoId?: string): Promise<{ success: boolean; eliminados: number }> {
    const endpoint = eventoId ? `/archivos-evento/eliminar-duplicados?eventoId=${eventoId}` : '/archivos-evento/eliminar-duplicados';
    const response = await apiClient.delete<{ success: boolean; eliminados: number }>(endpoint);
    return response.data!;
  }

  // Obtener archivos por extensión
  async getArchivosByExtension(extension: string, eventoId?: string, params?: ArchivoFilters) {
    return apiClient.getPaginated<ArchivoEvento>('/archivos-evento', {
      ...params,
      extension,
      ...(eventoId && { eventoId }),
    });
  }

  // Obtener archivos por nombre
  async getArchivosByNombre(nombre: string, eventoId?: string, params?: ArchivoFilters) {
    return apiClient.getPaginated<ArchivoEvento>('/archivos-evento', {
      ...params,
      nombre,
      ...(eventoId && { eventoId }),
    });
  }

  // Renombrar archivo
  async renombrarArchivo(id: string, nuevoNombre: string): Promise<ArchivoEvento> {
    const response = await apiClient.patch<ArchivoEvento>(`/archivos-evento/${id}/renombrar`, { nombre_archivo: nuevoNombre });
    return response.data!;
  }

  // Mover archivo a otro evento
  async moverArchivo(id: string, nuevoEventoId: string): Promise<ArchivoEvento> {
    const response = await apiClient.patch<ArchivoEvento>(`/archivos-evento/${id}/mover`, { eventoId: nuevoEventoId });
    return response.data!;
  }

  // Copiar archivo a otro evento
  async copiarArchivo(id: string, nuevoEventoId: string): Promise<ArchivoEvento> {
    const response = await apiClient.post<ArchivoEvento>(`/archivos-evento/${id}/copiar`, { eventoId: nuevoEventoId });
    return response.data!;
  }

  // Exportar lista de archivos a CSV/Excel
  async exportListaArchivos(eventoId?: string, formato: 'csv' | 'xlsx' = 'xlsx') {
    const endpoint = eventoId ? `/archivos-evento/export?eventoId=${eventoId}&formato=${formato}` : `/archivos-evento/export?formato=${formato}`;
    
    const response = await fetch(`${apiClient['baseURL']}${endpoint}`, {
      method: 'GET',
      headers: apiClient['getHeaders'](),
    });

    if (!response.ok) {
      throw new Error('Error al exportar lista de archivos');
    }

    return response.blob();
  }

  // Generar reporte de archivos
  async generarReporte(eventoId: string, tipo: 'resumen' | 'detallado' | 'estadisticas' = 'resumen') {
    const response = await apiClient.get<{
      tipo: string;
      eventoId: string;
      fechaGeneracion: string;
      datos: any;
    }>(`/archivos-evento/reporte/${eventoId}`, { tipo });
    return response.data!;
  }

  // Obtener archivos por período
  async getArchivosByPeriodo(periodo: 'dia' | 'semana' | 'mes' | 'año', eventoId?: string, params?: ArchivoFilters) {
    return apiClient.getPaginated<ArchivoEvento>('/archivos-evento', {
      ...params,
      periodo,
      ...(eventoId && { eventoId }),
    });
  }

  // Limpiar archivos temporales
  async limpiarArchivosTemporales(): Promise<{ success: boolean; eliminados: number }> {
    const response = await apiClient.delete<{ success: boolean; eliminados: number }>('/archivos-evento/limpiar-temporales');
    return response.data!;
  }
}

// Instancia singleton del servicio
export const archivoEventoService = new ArchivoEventoService();
