'use client';

import { Loader2 } from 'lucide-react';
import React from 'react';

export interface ColumnDef<T> {
  /** Column header label or custom node */
  header: React.ReactNode;
  /** Optional key of T to read value from when no custom cell renderer is provided */
  accessorKey?: keyof T;
  /** Custom cell renderer */
  cell?: (item: T, index: number) => React.ReactNode;
  /** Alignment for both header and cell */
  align?: 'left' | 'center' | 'right';
  /** Additional CSS class name for the <th> */
  headerClassName?: string;
  /** Additional CSS class name for the <td> */
  className?: string;
}

export interface DataTableProps<T> {
  /** The data array to display */
  data: T[];
  /** Column configurations */
  columns: ColumnDef<T>[];
  /** Unique key extractor for each row item */
  keyExtractor: (item: T, index: number) => string | number;
  /** Loading state flag */
  isLoading?: boolean;
  /** Loading mode: 'overlay' with blur backdrop or 'inline' with centered spinner */
  loadingVariant?: 'overlay' | 'inline';
  /** Text to show while loading */
  loadingMessage?: string;
  /** Message or component to show when data array is empty */
  emptyMessage?: React.ReactNode;
  /** Click handler for a row */
  onRowClick?: (item: T, index: number) => void;
  /** Custom classes for the outer wrapper */
  className?: string;
  /** Custom classes for the <table> element */
  tableClassName?: string;
  /** Minimum height class for the container */
  minHeight?: string;
  /** Custom row class generator */
  rowClassName?: (item: T, index: number) => string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  loadingVariant = 'overlay',
  loadingMessage = 'Loading data...',
  emptyMessage = 'No records found.',
  onRowClick,
  className = '',
  tableClassName = '',
  minHeight = 'min-h-[300px]',
  rowClassName,
}: DataTableProps<T>) {
  // If loading variant is inline and currently loading with no data yet, show centered spinner
  if (loadingVariant === 'inline' && isLoading && data.length === 0) {
    return (
      <div
        className={`min-h-[220px] flex flex-col items-center justify-center gap-3 text-slate-400 ${className}`}
      >
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <span className="text-xs">{loadingMessage}</span>
      </div>
    );
  }

  const getAlignmentClass = (align?: 'left' | 'center' | 'right') => {
    if (align === 'right') return 'text-right';
    if (align === 'center') return 'text-center';
    return 'text-left';
  };

  return (
    <div
      className={`overflow-x-auto relative ${minHeight} ${className}`.trim()}
    >
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            {loadingMessage && (
              <span className="text-xs text-slate-300 font-medium">{loadingMessage}</span>
            )}
          </div>
        </div>
      )}

      <table
        className={`w-full text-xs border-collapse ${tableClassName}`.trim()}
      >
        <thead>
          <tr className="border-b border-card-border text-slate-400">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`py-2.5 sm:py-3 px-3 sm:px-4 font-bold uppercase ${getAlignmentClass(
                  col.align
                )} ${col.headerClassName || ''}`.trim()}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-8 sm:py-12 text-center text-slate-500 italic"
              >
                {isLoading ? loadingMessage : emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => {
              const rowKey = keyExtractor(item, index);
              const customRowCls = rowClassName ? rowClassName(item, index) : '';
              const clickableCls = onRowClick
                ? 'cursor-pointer hover:bg-slate-950/30'
                : 'hover:bg-slate-950/20';

              return (
                <tr
                  key={rowKey}
                  onClick={() => onRowClick && onRowClick(item, index)}
                  className={`border-b border-card-border/40 text-slate-300 transition-colors ${clickableCls} ${customRowCls}`.trim()}
                >
                  {columns.map((col, colIdx) => {
                    const cellContent = col.cell
                      ? col.cell(item, index)
                      : col.accessorKey
                      ? String(item[col.accessorKey] ?? '')
                      : null;

                    return (
                      <td
                        key={colIdx}
                        className={`py-2.5 sm:py-3 px-3 sm:px-4 ${getAlignmentClass(
                          col.align
                        )} ${col.className || ''}`.trim()}
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

