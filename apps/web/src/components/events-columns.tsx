import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import type { Event } from '@infoeste/core';
import { DataTableColumnHeader } from './data-table-column-header';

export const eventsColumns: ColumnDef<Event & { eventTitle: string }>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={(value: boolean) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar todos"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: 'id',
    header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
    cell: ({ row }) => <div className="w-[80px]">{row.getValue('id')}</div>,
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: 'eventTitle',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Evento" />,
    cell: ({ row }) => {
      return (
        <div className="flex gap-2">
          <Badge variant="outline">{row.getValue('eventTitle')}</Badge>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    }
  },
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nome do Curso" />,
    cell: ({ row }) => {
      return (
        <div className="flex gap-2">
          <span className="max-w-[500px] truncate font-medium">{row.getValue('name')}</span>
        </div>
      );
    }
  },
  {
    accessorKey: 'date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Data" />,
    cell: ({ row }) => {
      const date = row.getValue('date') as string;
      return (
        <div className="flex w-[100px] items-center">
          <span>{date}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    }
  },
  {
    accessorKey: 'periodTime',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Período" />,
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          <span>{row.getValue('periodTime')}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    }
  },
  {
    accessorKey: 'startTime',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Horário Início" />,
    cell: ({ row }) => {
      return (
        <div className="flex w-[100px] items-center">
          <span>{row.getValue('startTime')}</span>
        </div>
      );
    }
  },
  {
    accessorKey: 'endTime',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Horário Fim" />,
    cell: ({ row }) => {
      return (
        <div className="flex w-[100px] items-center">
          <span>{row.getValue('endTime')}</span>
        </div>
      );
    }
  },
  {
    accessorKey: 'vacanciesLeft',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Vagas Disponíveis" />,
    cell: ({ row }) => {
      const vacanciesLeft = row.getValue('vacanciesLeft') as number;
      const vacancies = row.original.vacancies;
      const percentage = (vacanciesLeft / vacancies) * 100;

      let variant: 'default' | 'secondary' | 'destructive' = 'default';
      if (percentage < 25) {
        variant = 'destructive';
      } else if (percentage < 50) {
        variant = 'secondary';
      }

      return (
        <div className="flex items-center gap-2">
          <Badge variant={variant}>
            {vacanciesLeft} / {vacancies}
          </Badge>
        </div>
      );
    }
  }
];
