import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import { authService } from '../apiService/services/authService';
import type { Usuario, LoginRequest, RegisterRequest } from '../apiService/types';
import { apiClient } from '../apiService';

type Rol = 'personal' | 'encargado' | 'admin';

interface AuthContextType {
  user: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;      // spinner de login
  loading: boolean;        // carga inicial (verificando sesión)
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<{ success: boolean; user?: Usuario; message?: string }>;
  logout: () => void;
  updateUser: (userData: Partial<Usuario>) => void;
  hasRole: (role: Rol | Rol[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // spinner en login()
  const [loading, setLoading] = useState(true);      // verificación /auth/me al arrancar

  // ---- normalizador tolerante a diferentes formas de respuesta ----
  function normalizeAuthPayload(raw: any): { user: Usuario; accessToken: string; refreshToken?: string | null } {
    const base = raw?.data ?? raw;
    const tokens = base?.tokens ?? {};
    const accessToken = base?.accessToken ?? base?.token ?? tokens?.accessToken ?? null;
    const refreshToken = base?.refreshToken ?? tokens?.refreshToken ?? null;
    const user = base?.user ?? base?.data?.user ?? null;

    if (!accessToken || !user) throw new Error('Respuesta inválida del servidor');
    return { user, accessToken, refreshToken };
  }

  // ---- cargar sesión guardada + verificar token ----
  useEffect(() => {
  (async () => {
    try {
      const savedAccess = localStorage.getItem('accessToken');
      const savedUser = localStorage.getItem('currentUser');
      if (savedAccess && savedUser) {
        apiClient.setToken(savedAccess);        // <<< importante
        setToken(savedAccess);
        setUser(JSON.parse(savedUser));
        const valid = await authService.verifyToken().catch(() => false);
        if (!valid) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('currentUser');
          setToken(null);
          setUser(null);
          apiClient.clearToken();
        }
      }
    } finally {
      setLoading(false);
    }
  })();
}, []);

  // ---- login ----
  const login = useCallback(async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const raw = await authService.login(credentials); // puede devolver {data:{...}} o plano
      const payload = normalizeAuthPayload(raw);

      // persistir
      localStorage.setItem('accessToken', payload.accessToken);
      if (payload.refreshToken) localStorage.setItem('refreshToken', payload.refreshToken);
      localStorage.setItem('currentUser', JSON.stringify(payload.user));

      setToken(payload.accessToken);
      setUser(payload.user);
      
      // Configurar token en el cliente API
      apiClient.setToken(payload.accessToken);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ---- register ----
  const register = useCallback(async (userData: RegisterRequest) => {
    try {
      const user = await authService.register(userData);
      return {
        success: true,
        user: user,
        message: 'Usuario creado exitosamente'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.message || 'Error al crear el usuario'
      };
    }
  }, []);

  // ---- logout ----
  const logout = useCallback(async () => {
    try { await authService.logout(); } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    setToken(null);
    setUser(null);
    apiClient.clearToken();
  }, []);

  // ---- actualizar user local ----
  const updateUser = (userData: Partial<Usuario>) => {
    if (!user) return;
    const updated = { ...user, ...userData };
    setUser(updated);
    localStorage.setItem('currentUser', JSON.stringify(updated));
  };

  const hasRole = useCallback((role: Rol | Rol[]) => {
    if (!user) return false;
    return Array.isArray(role) ? role.includes(user.tipoUsuario) : user.tipoUsuario === role;
  }, [user]);

  const value = useMemo<AuthContextType>(() => ({
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    loading,
    login,
    register,
    logout,
    updateUser,
    hasRole,
  }), [user, token, isLoading, loading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  return ctx;
};

export default AuthContext;
