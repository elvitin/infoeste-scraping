import * as React from 'react';
import type { InfoesteEvent } from '@infoeste/core';
import { EventsTable } from '@/components/events-table';

function App() {
  const [events, setEvents] = React.useState<InfoesteEvent[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();

    const loadEvents = async () => {
      try {
        const response = await fetch('/events.json', { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Falha ao carregar eventos (status: ${response.status})`);
        }
        const data = (await response.json()) as InfoesteEvent[];
        setEvents(data);
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return;
        }
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadEvents();

    return () => controller.abort();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Carregando eventos...</div>
      </div>
    );
  }

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
      <EventsTable events={events} />
    </div>
  );
}

export { App };
