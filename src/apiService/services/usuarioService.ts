import { apiClient } from '../client';
import type { Usuario, UsuarioCreate, UsuarioUpdate, QueryParams } from '../types';

export class UsuarioService {
  // Obtener todos los usuarios con paginación
  async getUsuarios(params?: QueryParams) {
    return apiClient.getPaginated<Usuario>('/usuarios', params);
  }

  // Obtener un usuario por ID
  async getUsuario(id: string): Promise<Usuario> {
    const response = await apiClient.get<Usuario>(`/usuarios/${id}`);
    return response.data!;
  }

  // Crear un nuevo usuario
  async createUsuario(usuarioData: UsuarioCreate): Promise<Usuario> {
    const response = await apiClient.post<Usuario>('/usuarios', usuarioData);
    return response.data!;
  }

  // Actualizar un usuario
  async updateUsuario(id: string, usuarioData: UsuarioUpdate): Promise<Usuario> {
    const response = await apiClient.patch<Usuario>(`/usuarios/${id}`, usuarioData);
    return response.data!;
  }

  // Eliminar un usuario
  async deleteUsuario(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/usuarios/${id}`);
    return response.data || { success: false, message: 'Error al eliminar usuario' };
  }

  // Buscar usuarios por término de búsqueda
  async searchUsuarios(searchTerm: string, params?: QueryParams) {
    return apiClient.getPaginated<Usuario>('/usuarios/search', {
      ...params,
      q: searchTerm,
    });
  }

  // Obtener usuarios por tipo
  async getUsuariosByTipo(tipoUsuario: 'personal' | 'dueño' | 'admin', params?: QueryParams) {
    return apiClient.getPaginated<Usuario>('/usuarios', {
      ...params,
      tipoUsuario,
    });
  }

  // Cambiar rol de usuario
  async changeUserRole(id: string, newRole: 'personal' | 'dueño' | 'admin'): Promise<Usuario> {
    const response = await apiClient.patch<Usuario>(`/usuarios/${id}/role`, { tipoUsuario: newRole });
    return response.data!;
  }

  // Activar/desactivar usuario
  async toggleUsuarioStatus(id: string, activo: boolean): Promise<Usuario> {
    const response = await apiClient.patch<Usuario>(`/usuarios/${id}/status`, { activo });
    return response.data!;
  }

  // Obtener estadísticas de usuarios
  async getUsuarioStats() {
    const response = await apiClient.get<{
      totalUsuarios: number;
      usuariosPorTipo: Record<string, number>;
      usuariosActivos: number;
      usuariosInactivos: number;
    }>('/usuarios/stats');
    return response.data!;
  }

  // Verificar si un email está disponible
  async checkEmailAvailability(email: string): Promise<{ available: boolean }> {
    const response = await apiClient.get<{ available: boolean }>(`/usuarios/check-email/${email}`);
    return response.data!;
  }

  // Verificar si un username está disponible
  async checkUsernameAvailability(username: string): Promise<{ available: boolean }> {
    const response = await apiClient.get<{ available: boolean }>(`/usuarios/check-username/${username}`);
    return response.data!;
  }
}

// Instancia singleton del servicio
export const usuarioService = new UsuarioService();
