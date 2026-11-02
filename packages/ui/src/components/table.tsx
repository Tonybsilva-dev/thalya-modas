"use client";
import * as React from "react";
import { Table as PublishedTable, TableHead as PublishedHead, TableCell as PublishedCell, TableRow as PublishedRow, TableHeader as PublishedHeader } from "@trinketos/ui/table";
import { cn } from "../lib/utils";
export { TableBody, TableFooter, TableCaption } from "@trinketos/ui/table";
export const Table = React.forwardRef<HTMLTableElement, React.ComponentPropsWithoutRef<typeof PublishedTable>>(function Table({ className, ...props }, ref) {
  return <PublishedTable {...props} ref={ref} className={cn("border-separate border-spacing-x-0 border-spacing-y-2 px-3", className)} />;
});
export const TableHeader = React.forwardRef<HTMLTableSectionElement, React.ComponentPropsWithoutRef<typeof PublishedHeader>>(function TableHeader({ className, ...props }, ref) {
  return <PublishedHeader {...props} ref={ref} className={cn("bg-transparent", className)} />;
});
export const TableHead = React.forwardRef<HTMLTableCellElement, React.ComponentPropsWithoutRef<typeof PublishedHead>>(function TableHead({ className, ...props }, ref) {
  return <PublishedHead {...props} ref={ref} className={cn("h-9 border-0 px-3 py-2 text-xs font-medium text-muted-foreground", className)} />;
});
export const TableRow = React.forwardRef<HTMLTableRowElement, React.ComponentPropsWithoutRef<typeof PublishedRow>>(function TableRow({ className, ...props }, ref) {
  return <PublishedRow {...props} ref={ref} className={cn("h-[var(--sf-table-row-height)] border-0 bg-muted/50 hover:bg-accent/60 data-[state=selected]:bg-accent", className)} />;
});
export const TableCell = React.forwardRef<HTMLTableCellElement, React.ComponentPropsWithoutRef<typeof PublishedCell>>(function TableCell({ className, ...props }, ref) {
  return <PublishedCell {...props} ref={ref} className={cn("border-0 px-3 py-2 text-sm leading-5 tabular-nums first:rounded-l-2xl last:rounded-r-2xl", className)} />;
});
