import type { ReactNode } from "react";
import { EmptyState } from "./EmptyState";

type Column<T> = {
  header: string;
  cell: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  empty?: string;
};

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  empty,
}: DataTableProps<T>) {
  if (!rows.length) return <EmptyState title={empty ?? "Nothing here yet"} />;

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            {columns.map((column) => (
              <th key={column.header} className="px-3 py-2 font-medium">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-t">
              {columns.map((column) => (
                <td key={column.header} className="px-3 py-2">
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
