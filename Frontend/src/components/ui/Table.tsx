import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  selectedId?: string;
  getId?: (item: T) => string;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  loading = false,
  error = null,
  emptyMessage = 'NO CONTACTS OR ANOMALIES FOUND',
  onRowClick,
  selectedId,
  getId = (item: any) => item.id || '',
  className = '',
}: TableProps<T>) {
  return (
    <div className={`sonar-panel overflow-hidden rounded-lg border border-cyan-500/20 ${className}`}>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-left font-mono text-xs">
          {/* Header */}
          <thead className="border-b border-cyan-500/30 bg-cyan-950/40 text-[11px] uppercase tracking-wider text-cyan-300">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={`px-4 py-3 font-semibold ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-cyan-500/10 text-slate-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center">
                  <div className="flex items-center justify-center gap-2 text-cyan-400">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>FETCHING TELEMETRY DATA...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-rose-400">
                  <div className="flex items-center justify-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <span>{error}</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, idx) => {
                const id = getId(item);
                const isSelected = selectedId && selectedId === id;
                return (
                  <tr
                    key={id || idx}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={`transition-colors duration-150 ${onRowClick ? 'cursor-pointer hover:bg-cyan-500/10' : ''} ${isSelected ? 'bg-cyan-500/20 border-l-4 border-l-cyan-400' : ''}`}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={`px-4 py-3 ${col.className || ''}`}>
                        {col.render ? col.render(item) : (item as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Table;
