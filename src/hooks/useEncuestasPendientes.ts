import { useState, useEffect } from 'react';
import { encuestaService } from '../apiService/services/encuestaService';
import type { EncuestaPendiente } from '../apiService/services/encuestaService';

interface UseEncuestasPendientesReturn {
  encuestasPendientes: EncuestaPendiente[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasEncuestasPendientes: boolean;
}

export function useEncuestasPendientes(empresaId: string | null): UseEncuestasPendientesReturn {
  const [encuestasPendientes, setEncuestasPendientes] = useState<EncuestaPendiente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEncuestasPendientes = async () => {
    if (!empresaId) {
      console.log('🔍 useEncuestasPendientes: No hay empresaId');
      setEncuestasPendientes([]);
      return;
    }

    console.log(`🔍 useEncuestasPendientes: Verificando encuestas para empresa: ${empresaId}`);
    setLoading(true);
    setError(null);

    try {
      const response = await encuestaService.getEncuestasPendientes(empresaId);
      console.log(`📋 useEncuestasPendientes: Respuesta recibida:`, response);
      console.log(`📋 useEncuestasPendientes: response.pendientes:`, response.pendientes);
      
      // El servicio devuelve los datos directamente, no en .data
      const pendientes = response.pendientes || [];
      setEncuestasPendientes(pendientes);
    } catch (err: any) {
      console.error('❌ useEncuestasPendientes: Error:', err);
      setError(err?.message || 'Error al cargar encuestas pendientes');
      setEncuestasPendientes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEncuestasPendientes();
  }, [empresaId]);

  return {
    encuestasPendientes,
    loading,
    error,
    refetch: fetchEncuestasPendientes,
    hasEncuestasPendientes: encuestasPendientes.length > 0,
  };
}
