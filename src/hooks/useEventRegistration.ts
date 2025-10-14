import { useState } from 'react';
import { eventoService } from '../apiService/services/eventoService';
import { archivoEventoService } from '../apiService/services/archivoEventoService';
import { storageService } from '../apiService/services/storageService';
import type { Evento, EventoCreate, ArchivoEventoCreate } from '../apiService/types';

export interface EventRegistrationData {
  nombre: string;
  descripcion: string;
  inicio: string;
  fin: string;
  duracion_minutos_reunion: number;
  numero_mesas: number;
  modo_mesas: 'FIJA_POR_EMPRESA' | 'POR_REUNION';
  logo?: File;
  portada?: File;
}

export interface EventRegistrationResult {
  success: boolean;
  evento?: Evento;
  error?: string;
}

export const useEventRegistration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerEvent = async (data: EventRegistrationData): Promise<EventRegistrationResult> => {
    setLoading(true);
    setError(null);
    
    try {
      // Validar fechas antes de proceder
      const fechaInicio = new Date(data.inicio);
      const fechaFin = new Date(data.fin);
      
      if (fechaFin <= fechaInicio) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }
      
      let logoUrl: string | null = null;

      // 1. Subir logo primero (si existe)
      if (data.logo) {
        const logoResult = await storageService.uploadFile(data.logo, 'eventos/logos');
        logoUrl = logoResult.url;
      }

      // 2. Crear el evento con el logo_url
      const eventoData: EventoCreate = {
        nombre: data.nombre,
        descripcion: data.descripcion,
        inicio: new Date(data.inicio).toISOString(),
        fin: new Date(data.fin).toISOString(),
        duracion_minutos_reunion: data.duracion_minutos_reunion,
        numero_mesas: data.numero_mesas,
        modo_mesas: data.modo_mesas,
        logo_url: logoUrl,
      };

      const evento = await eventoService.createEvento(eventoData);

      // 3. Si hay portada, subirla y crear registro en ArchivoEvento
      if (data.portada && evento._id) {
        const portadaResult = await storageService.uploadFile(data.portada, 'eventos/portadas');
        
        const archivoData: ArchivoEventoCreate = {
          eventoId: evento._id,
          tipo: 'OTRO',
          url: portadaResult.url,
          nombre_archivo: data.portada.name,
          mime: data.portada.type,
        };

        await archivoEventoService.createArchivo(archivoData);
      }

      return { success: true, evento };
    } catch (err: any) {
      const errorMessage = err?.message || 'Error al registrar el evento';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (id: string, data: Partial<EventRegistrationData>): Promise<EventRegistrationResult> => {
    setLoading(true);
    setError(null);
    
    try {
      let logoUrl: string | undefined;

      // Si hay un nuevo logo, subirlo primero
      if (data.logo) {
        const logoResult = await storageService.uploadFile(data.logo, 'eventos/logos');
        logoUrl = logoResult.url;
      }

      // Actualizar el evento
      const updateData: Partial<EventoCreate> = {
        nombre: data.nombre,
        descripcion: data.descripcion,
        inicio: data.inicio,
        fin: data.fin,
        duracion_minutos_reunion: data.duracion_minutos_reunion,
        numero_mesas: data.numero_mesas,
        modo_mesas: data.modo_mesas,
        ...(logoUrl && { logo_url: logoUrl }),
      };

      const evento = await eventoService.updateEvento(id, updateData);
      return { success: true, evento };
    } catch (err: any) {
      const errorMessage = err?.message || 'Error al actualizar el evento';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (id: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);
    
    try {
      await eventoService.deleteEvento(id);
      return { success: true };
    } catch (err: any) {
      const errorMessage = err?.message || 'Error al eliminar el evento';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const getEventosActivos = async (): Promise<Evento[]> => {
    try {
      const response = await eventoService.getEventosActivos();
      return response.data || [];
    } catch (err: any) {
      console.error('Error al obtener eventos activos:', err);
      return [];
    }
  };

  const getEvento = async (id: string): Promise<Evento | null> => {
    try {
      return await eventoService.getEvento(id);
    } catch (err: any) {
      console.error('Error al obtener evento:', err);
      return null;
    }
  };

  return {
    loading,
    error,
    registerEvent,
    updateEvent,
    deleteEvent,
    getEventosActivos,
    getEvento,
    clearError: () => setError(null),
  };
};
