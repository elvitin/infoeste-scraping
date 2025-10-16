import * as React from "react";
import type { Event } from "@infoeste/core";
import { EventsTable } from "@/components/events-table";

function App() {
  const [events, setEvents] = React.useState<Event[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();

    const loadEvents = async () => {
      try {
        const response = await fetch("/events.json", { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Falha ao carregar eventos (status: ${response.status})`);
        }
        const data = (await response.json()) as Event[];
        setEvents(data);
      } catch (err) {
        if ((err as Error).name === "AbortError") {
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

  return (
    <h1>Programação de Cursos e Palestras</h1>
  );
};

export { App };
