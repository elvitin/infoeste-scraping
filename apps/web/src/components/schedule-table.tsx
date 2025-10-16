import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import type { Course, Event } from "@infoeste/core";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type CourseEntry = Course & { eventTitle: string };

interface ScheduleRow {
  time: string;
  entries: Record<string, CourseEntry[]>;
}

interface ScheduleTableProps {
  events: Event[];
  isLoading?: boolean;
  error?: string | null;
}

const parseDateKey = (date: string): number => {
  const [day, month, year] = date.split("/").map((value) => Number.parseInt(value, 10));
  return new Date(year, month - 1, day).getTime();
};

const parseTimeKey = (timeRange: string): number => {
  const [start] = timeRange.split("às");
  const [hours = "0", minutes = "0", seconds = "0"] = start.trim().split(":");
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
};

const createSchedule = (events: Event[]): { rows: ScheduleRow[]; dates: string[] } => {
  const datesSet = new Set<string>();
  const timeMap = new Map<string, Map<string, CourseEntry[]>>();

  events.forEach((event) => {
    if (!event.date) {
      return;
    }

    datesSet.add(event.date);

    event.courses.forEach((course) => {
      const time = course.time || "Horário não informado";
      const byDate = timeMap.get(time) ?? new Map<string, CourseEntry[]>();
      const entries = byDate.get(event.date) ?? [];

      entries.push({ ...course, eventTitle: event.title });
      byDate.set(event.date, entries);
      timeMap.set(time, byDate);
    });
  });

  const dates = Array.from(datesSet).sort((a, b) => parseDateKey(a) - parseDateKey(b));
  const rows = Array.from(timeMap.entries())
    .sort((a, b) => parseTimeKey(a[0]) - parseTimeKey(b[0]))
    .map(([time, byDate]) => {
      const entries: Record<string, CourseEntry[]> = {};
      dates.forEach((date) => {
        const sortedEntries = [...(byDate.get(date) ?? [])].sort((courseA, courseB) =>
          courseA.name.localeCompare(courseB.name, "pt-BR"),
        );
        entries[date] = sortedEntries;
      });

      return { time, entries } satisfies ScheduleRow;
    });

  return { rows, dates };
};

const renderCourse = (course: CourseEntry): React.ReactNode => {
  return (
    <div
      key={`${course.id}-${course.eventTitle}-${course.name}`}
      className="rounded-lg border border-border bg-card/70 p-3 shadow-sm"
    >
      <p className="text-sm font-semibold leading-tight text-foreground">{course.name}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Código: {course.id} · Evento: {course.eventTitle}
      </p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Vagas: {course.vacanciesLeft} / {course.vacancies}
      </p>
    </div>
  );
};

export const ScheduleTable: React.FC<ScheduleTableProps> = ({ events, isLoading = false, error = null }) => {
  const { rows, dates } = React.useMemo(() => createSchedule(events), [events]);

  const columns = React.useMemo<ColumnDef<ScheduleRow>[]>(() => {
    const baseColumn: ColumnDef<ScheduleRow>[] = [
      {
        accessorKey: "time",
        header: "Horário",
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.time}</span>,
      },
    ];

    const dateColumns = dates.map<ColumnDef<ScheduleRow>>((date) => ({
      id: date,
      header: date,
      cell: ({ row }) => {
        const entries = row.original.entries[date] ?? [];
        if (entries.length === 0) {
          return <span className="text-sm text-muted-foreground">Nenhum curso neste horário.</span>;
        }
        return <div className="flex flex-col gap-3">{entries.map((course) => renderCourse(course))}</div>;
      },
    }));

    return [...baseColumn, ...dateColumns];
  }, [dates]);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-muted">
        <p className="text-muted-foreground">Carregando eventos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-destructive/40 bg-destructive/10">
        <p className="text-sm font-medium text-destructive">
          Ocorreu um erro ao carregar os cursos: <span className="font-normal">{error}</span>
        </p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-muted">
        <p className="text-muted-foreground">Nenhum curso encontrado para exibição.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xl">
      <div className="overflow-x-auto">
        <Table>
          <TableCaption className="text-left text-sm">
            Visualização da programação por horário. Os dados são provenientes da coleta automatizada pelo scraper.
          </TableCaption>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn("min-w-[220px] bg-muted/60 text-base font-semibold", {
                      "sticky left-0 z-10 w-52 bg-muted": header.index === 0,
                    })}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="bg-card">
                {row.getVisibleCells().map((cell, index) => (
                  <TableCell
                    key={cell.id}
                    className={cn("align-top", {
                      "sticky left-0 z-10 w-52 bg-background": index === 0,
                    })}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
