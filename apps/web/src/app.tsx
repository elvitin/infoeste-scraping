import * as React from "react";
import type { Event } from "@infoeste/core";
import { ScheduleTable } from "@/components/schedule-table";

const App: React.FC = () => {
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
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-wider text-muted-foreground">Infoeste 2025</p>
        <h1 className="text-3xl font-bold">Programação de Cursos e Palestras</h1>
        <p className="text-base text-muted-foreground">
          Visualize os cursos agrupados por dia e horário. Os dados são coletados automaticamente pelo scraper com
          Puppeteer e renderizados via Vite + React + shadcn UI.
        </p>
      </header>

      <ScheduleTable events={events} isLoading={isLoading} error={error} />

      <footer className="pb-6 text-sm text-muted-foreground">
        Atualizado em tempo real pela ferramenta de scraping. Feche esta janela para encerrar o servidor de preview.
      </footer>
    </main>
  );
};

export default App;
