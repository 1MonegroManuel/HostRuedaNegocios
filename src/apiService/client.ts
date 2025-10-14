import type { ApiResponse, PaginatedResponse } from './types';

// Configuración base de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Clase para manejar las peticiones HTTP
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.loadToken();
  }

  // Cargar token desde localStorage
  private loadToken(): void {
    this.token = localStorage.getItem('auth_token');
  }

  // Establecer token de autenticación
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  // Limpiar token
  clearToken(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // Obtener headers por defecto
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Manejar respuesta de la API
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    // Si es 304 (Not Modified), devolver datos vacíos
    if (response.status === 304) {
      return { data: null } as ApiResponse<T>;
    }

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || `HTTP error! status: ${response.status}`) as any;
      error.response = {
        status: response.status,
        data: data
      };
      throw error;
    }

    // Si la respuesta es un objeto directo (sin wrapper), envolverlo en { data }
    if (data && typeof data === 'object' && !data.data && !data.items && !data.total) {
      return { data } as ApiResponse<T>;
    }

    return data;
  }

  // Manejar respuesta paginada
  private async handlePaginatedResponse<T>(response: Response): Promise<PaginatedResponse<T>> {
    const data = await response.json();
    
    console.log('🌐 API Response Data:', data);

    if (!response.ok) {
      const error = new Error(data.message || `HTTP error! status: ${response.status}`) as any;
      error.response = {
        status: response.status,
        data: data
      };
      throw error;
    }

    return data;
  }

  // Método GET
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseURL}${endpoint}`);
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key].toString());
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  // Método GET para respuestas paginadas
  async getPaginated<T>(endpoint: string, params?: Record<string, any>): Promise<PaginatedResponse<T>> {
    const url = new URL(`${this.baseURL}${endpoint}`);
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key].toString());
        }
      });
    }

    console.log('🌐 API Request - URL:', url.toString());
    console.log('🌐 API Request - Headers:', this.getHeaders());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
    });

    console.log('🌐 API Response - Status:', response.status);
    console.log('🌐 API Response - Headers:', Object.fromEntries(response.headers.entries()));

    return this.handlePaginatedResponse<T>(response);
  }

  // Método POST
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  // Método PUT
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  // Método PATCH
  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  // Método DELETE
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  // Método para subir archivos
  async uploadFile<T>(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    const headers: HeadersInit = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return this.handleResponse<T>(response);
  }
}

// Instancia singleton del cliente
export const apiClient = new ApiClient(API_BASE_URL);

// Función helper para manejar errores de API
export const handleApiError = (error: any): string => {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'Error desconocido en la API';
};

// Función helper para verificar si el usuario está autenticado
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('auth_token');
};

// Función helper para obtener el token
export const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};
