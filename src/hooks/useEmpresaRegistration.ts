import { useState } from 'react';
import { empresaService } from '../apiService/services/empresaService';
import { eventoService } from '../apiService/services/eventoService';
import type { EmpresaCreate, Evento } from '../apiService/types';

export interface CompanyRegistrationData {
  nombre: string;
  rubro: string;
  rubroOtro?: string;
  descripcion: string;
  intereses: string[];
  isVirtual: boolean;
  eventoId: string;
  nit?: string;
  representante?: string;
  telefono?: string;
  email?: string;
  sitio_web?: string;
}

export interface EmployeeRegistrationData {
  nombre: string;
  apellido: string;
  email: string;
  cargo: string;
  telefono: string;
}

export const useEmpresaRegistration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerEmpresa = async (data: CompanyRegistrationData): Promise<{ success: boolean; empresaId?: string }> => {
    setLoading(true);
    setError(null);
    
    try {
      const empresaData: EmpresaCreate = {
        eventoId: data.eventoId,
        nombre: data.nombre,
        rubro: data.rubro === '__OTRO__' ? data.rubroOtro : data.rubro,
        descripcion: data.descripcion,
        representante: data.representante,
        telefono: data.telefono,
        email: data.email,
        sitio_web: data.sitio_web,
        nit: data.nit,
      };

      const empresa = await empresaService.createEmpresa(empresaData);
      
      return { success: true, empresaId: empresa._id };
    } catch (err: any) {
      const errorMessage = err?.message || 'Error al registrar la empresa';
      setError(errorMessage);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const uploadLogo = async (empresaId: string, file: File): Promise<{ success: boolean }> => {
    setLoading(true);
    setError(null);
    
    try {
      await empresaService.uploadEmpresaLogo(empresaId, file);
      return { success: true };
    } catch (err: any) {
      const errorMessage = err?.message || 'Error al subir el logo';
      setError(errorMessage);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const getEventosActivos = async (): Promise<Evento[]> => {
    try {
      const response = await eventoService.getEventosActivos();
      return response.data || [];
    } catch (err: any) {
      console.error('Error al obtener eventos:', err);
      return [];
    }
  };

  return {
    loading,
    error,
    registerEmpresa,
    uploadLogo,
    getEventosActivos,
    clearError: () => setError(null),
  };
};
