import * as React from 'react';
import type { InfoesteEvent } from '@infoeste/core';
import { EventsTable } from '@/components/events-table';

interface ApiResponse {
  success: boolean;
  data?: InfoesteEvent[];
  error?: string;
  message?: string;
}
/*
interface HealthResponse {
  success: boolean;
  status: string;
  schemaValidation?: {
    isValid: boolean;
    errors: string[];
  };
}
*/
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [events, setEvents] = React.useState<InfoesteEvent[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);

  //const [isServiceHealthy, setIsServiceHealthy] = React.useState<boolean>(true);

  const fetchEvents = React.useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(`${API_BASE_URL}/events`, { signal });
      if (!response.ok) {
        throw new Error(`Falha ao carregar eventos (status: ${response.status})`);
      }
      const apiResponse = (await response.json()) as ApiResponse;
      console.info({ apiResponse });
      if (!apiResponse.success || !apiResponse.data) {
        throw new Error(apiResponse.message ?? 'Erro ao carregar eventos');
      }
      setEvents(apiResponse.data);
      setError(null);
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return;
      }
      setError((err as Error).message);
    }
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();
    /*
    const checkHealth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`, { signal: controller.signal });
        const data = (await response.json()) as HealthResponse;
        setIsServiceHealthy(data.success && data.status === 'healthy');
        return data.success;
      } catch {
        setIsServiceHealthy(false);
        return false;
      }
    };
    */
    (async () => {
      try {
        /*
        // Verificar saúde do serviço primeiro
        const isHealthy = await checkHealth();
        if (!isHealthy) {
          throw new Error('O serviço de cursos está temporariamente indisponível');
        }
        */
        await fetchEvents(controller.signal);
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return;
        }
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [fetchEvents]);

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchEvents();
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchEvents]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Carregando eventos...</div>
      </div>
    );
  }
  /*
  if (!isServiceHealthy) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-yellow-600 mb-2">⚠️ Serviço Temporariamente Indisponível</div>
          <p className="text-muted-foreground">O sistema de cursos está fora do ar ou em manutenção.</p>
        </div>
      </div>
    );
  }
  */
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg text-red-500">Erro: {error}</div>
      </div>
    );
  }

  return (
    <div className="hidden h-full flex-1 flex-col gap-8 p-8 md:flex">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight">Programação de Cursos e Palestras</h2>
          <p className="text-muted-foreground">Eventos, cursos e palestras disponíveis para inscrição</p>
        </div>
      </div>
      <EventsTable events={events} onRefresh={handleRefresh} isRefreshing={isRefreshing} />
    </div>
  );
}

export { App };
