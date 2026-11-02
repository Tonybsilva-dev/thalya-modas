"use client";
import * as React from "react";
import { DataTable as TrinketDataTable, type DataTableProps } from "@trinketos/ui/data-table";
import { cn } from "../lib/utils";
export function DataTable<T>({ className, ...props }: DataTableProps<T>) {
  return <TrinketDataTable {...props} className={cn("[&_table]:border-separate [&_table]:border-spacing-y-2 [&_thead]:bg-transparent [&_th]:h-9 [&_th]:px-3 [&_th]:py-2 [&_th]:text-xs [&_td]:border-0 [&_td:first-child]:rounded-l-2xl [&_td:last-child]:rounded-r-2xl [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm [&_td]:tabular-nums [&_tbody_tr]:bg-muted/50 [&_tr]:h-[var(--sf-table-row-height)]", className)} />;
}
export type { DataTableProps, DataTablePagination, DataTableToolbarSlots } from "@trinketos/ui/data-table";
export type { ColumnDef } from "@trinketos/ui/data-table";
