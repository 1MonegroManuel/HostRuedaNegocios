import { apiClient } from '../client';

export interface UploadResponse {
  url: string;
  tipo: string;
  carpeta: string;
  nombre: string;
  bytes: number;
  mime: string;
}

export interface DeleteRequest {
  url: string;
}

export class StorageService {
  /**
   * Sube un archivo al servidor
   * @param file - Archivo a subir
   * @param carpeta - Carpeta donde guardar (opcional)
   * @param nombre - Nombre personalizado (opcional)
   * @returns Información del archivo subido
   */
  async uploadFile(file: File, carpeta?: string, nombre?: string): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('archivo', file);
    
    const params = new URLSearchParams();
    if (carpeta) params.append('carpeta', carpeta);
    if (nombre) params.append('nombre', nombre);
    
    const url = `/storage${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await fetch(`${apiClient['baseURL']}${url}`, {
      method: 'POST',
      headers: {
        'Authorization': apiClient['token'] ? `Bearer ${apiClient['token']}` : '',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error al subir archivo' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Reemplaza el contenido de un archivo existente manteniendo la misma URL
   * @param file - Nuevo archivo
   * @param existingUrl - URL del archivo existente a reemplazar
   * @returns Información del archivo actualizado (misma URL)
   */
  async replaceFile(file: File, existingUrl: string): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('archivo', file);
    
    const params = new URLSearchParams();
    params.append('existingUrl', existingUrl);
    
    const url = `/storage/replace?${params.toString()}`;
    
    const response = await fetch(`${apiClient['baseURL']}${url}`, {
      method: 'PUT',
      headers: {
        'Authorization': apiClient['token'] ? `Bearer ${apiClient['token']}` : '',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error al reemplazar archivo' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Elimina un archivo del servidor
   * @param url - URL del archivo a eliminar
   * @returns Confirmación de eliminación
   */
  async deleteFile(url: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/storage', { url });
    return response.data || { message: 'Archivo eliminado' };
  }

  /**
   * Sube múltiples archivos en paralelo
   * @param files - Array de archivos a subir
   * @param carpeta - Carpeta base para todos los archivos
   * @returns Array con información de todos los archivos subidos
   */
  async uploadMultipleFiles(files: File[], carpeta?: string): Promise<UploadResponse[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, carpeta));
    return Promise.all(uploadPromises);
  }

  /**
   * Valida si un archivo es de tipo imagen
   * @param file - Archivo a validar
   * @returns true si es imagen
   */
  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  /**
   * Valida si un archivo es de tipo video
   * @param file - Archivo a validar
   * @returns true si es video
   */
  isVideoFile(file: File): boolean {
    return file.type.startsWith('video/');
  }

  /**
   * Valida el tamaño de un archivo
   * @param file - Archivo a validar
   * @param maxSizeMB - Tamaño máximo en MB
   * @returns true si el archivo es válido
   */
  validateFileSize(file: File, maxSizeMB: number = 10): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }

  /**
   * Obtiene la extensión de un archivo
   * @param file - Archivo
   * @returns Extensión del archivo
   */
  getFileExtension(file: File): string {
    return file.name.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Formatea el tamaño de un archivo en formato legible
   * @param bytes - Tamaño en bytes
   * @returns Tamaño formateado
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Instancia singleton del servicio
export const storageService = new StorageService();
