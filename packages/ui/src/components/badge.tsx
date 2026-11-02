"use client";
import * as React from "react";
import { Badge as TrinketBadge, type BadgeProps } from "@trinketos/ui/badge";
import { cn } from "../lib/utils";
export { badgeVariants } from "@trinketos/ui/badge";
export type { BadgeProps } from "@trinketos/ui/badge";
export function Badge({ className, ...props }: BadgeProps) {
  return <TrinketBadge {...props} className={cn("rounded-full px-2.5 py-1 font-medium", className)} />;
}
