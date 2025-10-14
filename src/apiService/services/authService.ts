import { apiClient } from '../client';
import type { LoginRequest, RegisterRequest, Usuario } from '../types';

type AuthPayload = {
  accessToken: string;
  refreshToken?: string | null;
  user: Usuario;
};

// --- helpers ---
const unwrap = <T = any>(res: any): T => (res && 'data' in res ? res.data : res) as T;

const pickAuth = (raw: any): AuthPayload => {
  const base = raw?.data ?? raw;
  const tokens = base?.tokens ?? {};

  const accessToken =
    base?.accessToken ??
    base?.token ??
    tokens?.accessToken ??
    null;

  const refreshToken =
    base?.refreshToken ??
    tokens?.refreshToken ??
    null;

  const user: Usuario | undefined =
    base?.user ??
    base?.data?.user ??
    undefined;

  if (!accessToken || !user) {
    throw new Error('Respuesta inválida del servidor');
  }
  return { accessToken, refreshToken, user };
};

export class AuthService {
  // Iniciar sesión
  async login(credentials: LoginRequest): Promise<AuthPayload> {
    const res = await apiClient.post('/auth/login', credentials);
    const payload = pickAuth(unwrap(res));
    // Guarda el token para siguientes requests
    apiClient.setToken(payload.accessToken);
    return payload;
  }

  // Registrar usuario
  async register(userData: RegisterRequest): Promise<Usuario> {
    const res = await apiClient.post('/auth/register', userData);
    const base = unwrap(res);
    // acepta {user} o plano
    return base?.user ?? base;
  }

  // Cerrar sesión
  async logout(): Promise<void> {
    try { await apiClient.post('/auth/logout'); } catch {}
    finally { apiClient.clearToken(); }
  }

  // Perfil del usuario actual
  async getProfile(): Promise<Usuario> {
    try {
      // Tu backend expone /auth/me
      const r1 = await apiClient.get('/auth/me');
      const b1 = unwrap(r1);
      return b1?.user ?? b1; // acepta {user} o plano
    } catch (e: any) {
      // fallback si tuvieras /auth/profile en otro entorno
      const status = e?.response?.status ?? e?.status;
      if (status === 404) {
        const r2 = await apiClient.get('/auth/profile');
        const b2 = unwrap(r2);
        return b2?.user ?? b2;
      }
      throw e;
    }
  }

  // Actualizar perfil
  async updateProfile(userData: Partial<Usuario>): Promise<Usuario> {
    const res = await apiClient.patch('/auth/profile', userData);
    const base = unwrap(res);
    return base?.user ?? base;
  }

  // Cambiar contraseña
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.patch('/auth/change-password', { currentPassword, newPassword });
    const base = unwrap(res);
    return { success: base?.success ?? true, message: base?.message ?? 'OK' };
  }

  // Solicitar reset de contraseña
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.post('/auth/forgot-password', { email });
    const base = unwrap(res);
    return { success: base?.success ?? true, message: base?.message ?? 'OK' };
  }

  // Resetear contraseña
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.post('/auth/reset-password', { token, newPassword });
    const base = unwrap(res);
    return { success: base?.success ?? true, message: base?.message ?? 'OK' };
  }

  // Verificar token
  async verifyToken(): Promise<boolean> {
    try {
      const u = await this.getProfile();
      return !!u && !!u._id;
    } catch {
      return false;
    }
  }

  // Refrescar token
  async refreshToken(): Promise<AuthPayload> {
    const res = await apiClient.post('/auth/refresh');
    const payload = pickAuth(unwrap(res));
    apiClient.setToken(payload.accessToken);
    return payload;
  }

  // Crear empleado con credenciales automáticas
  async createEmployee(employeeData: {
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string | null;
  }): Promise<{ user: Usuario; credentials: { username: string; password: string } }> {
    const res = await apiClient.post('/auth/create-employee', employeeData);
    const base = unwrap(res);
    return {
      user: base?.user ?? base,
      credentials: base?.credentials ?? { username: '', password: '' }
    };
  }

  // Obtener usuarios por IDs
  async getUsersByIds(ids: string[]): Promise<Usuario[]> {
    const res = await apiClient.post('/auth/get-users-by-ids', { ids });
    const base = unwrap(res);
    return base?.users ?? [];
  }
}

// Instancia singleton del servicio
export const authService = new AuthService();
