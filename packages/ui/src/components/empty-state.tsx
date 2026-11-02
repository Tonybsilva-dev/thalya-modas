"use client";
import * as React from "react";
import { Empty, EmptyContent, EmptyMedia } from "@trinketos/ui/empty";
import { cn } from "../lib/utils";
export { EmptyTitle as EmptyStateTitle, EmptyDescription as EmptyStateDescription } from "@trinketos/ui/empty";
export function EmptyState({ className, ...props }: React.ComponentProps<typeof Empty>) {
  return <Empty className={cn("min-h-64 border border-dashed border-border bg-card p-8", className)} {...props} />;
}
export function EmptyStateContent({ className, ...props }: React.ComponentProps<typeof EmptyContent>) {
  return <EmptyContent className={cn("mx-auto grid max-w-sm justify-items-center gap-4", className)} {...props} />;
}
export function EmptyStateIcon({ className, ...props }: React.ComponentProps<typeof EmptyMedia>) {
  return <EmptyMedia variant="icon" className={cn("size-12 border border-border bg-muted text-muted-foreground", className)} {...props} />;
}
export function EmptyStateActions({ className, ...props }: React.ComponentProps<typeof EmptyContent>) {
  return <EmptyContent className={cn("flex flex-col-reverse gap-2 sm:flex-row", className)} {...props} />;
}
