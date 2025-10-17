import type { Table } from '@tanstack/react-table';
import { X, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTableFacetedFilter } from './data-table-faceted-filter';
import { DataTableViewOptions } from './data-table-view-options';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  eventTitles: { label: string; value: string }[];
  dates: { label: string; value: string }[];
  periods: { label: string; value: string }[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function DataTableToolbar<TData>({
  table,
  eventTitles,
  dates,
  periods,
  onRefresh,
  isRefreshing
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Input
          placeholder="Filtrar cursos..."
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={event => table.getColumn('name')?.setFilterValue(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn('eventTitle') && (
          <DataTableFacetedFilter column={table.getColumn('eventTitle')} title="Evento" options={eventTitles} />
        )}
        {table.getColumn('periodTime') && (
          <DataTableFacetedFilter column={table.getColumn('periodTime')} title="Período" options={periods} />
        )}
        {table.getColumn('date') && (
          <DataTableFacetedFilter column={table.getColumn('date')} title="Data" options={dates} />
        )}
        {isFiltered && (
          <Button variant="ghost" size="sm" onClick={() => table.resetColumnFilters()} className="h-8 px-2 lg:px-3">
            Limpar
            <X />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <DataTableViewOptions table={table} />
        <Button size="sm" onClick={onRefresh} disabled={isRefreshing} className="h-8">
          <RefreshCw className={isRefreshing ? 'animate-spin' : ''} />
          Atualizar
        </Button>
      </div>
    </div>
  );
}
