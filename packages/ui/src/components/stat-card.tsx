"use client";

import * as React from "react";
import { StatCard as TrinketStatCard, type StatCardProps } from "@trinketos/ui/stat-card";
import { cn } from "../lib/utils";

export type { StatCardProps } from "@trinketos/ui/stat-card";

export function StatCard({ className, ...props }: StatCardProps) {
  return <TrinketStatCard {...props} className={cn(
    "h-full min-w-0 gap-2 border-border bg-card p-4 shadow-none [&>div]:min-w-0 [&>div>p:first-child]:break-words [&>div>p:first-child]:font-semibold [&>div>p:first-child]:[font-family:var(--font-primary)] [&>div>p:nth-child(2)]:text-sm [&>div>p:nth-child(2)]:font-medium [&>div>p:nth-child(2)]:text-foreground",
    className,
  )} />;
}
