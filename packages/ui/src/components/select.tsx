"use client";
import * as React from "react";
import { SelectTrigger as TrinketSelectTrigger } from "@trinketos/ui/select";
import { cn } from "../lib/utils";
export { SelectRoot as Select, SelectGroup, SelectContent, SelectLabel, SelectItem, SelectSeparator } from "@trinketos/ui/select";
export const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<typeof TrinketSelectTrigger>>(function SelectTrigger({ className, ...props }, ref) {
  return <TrinketSelectTrigger ref={ref} className={cn("h-[var(--sf-control-height)] w-full rounded-full bg-background text-sm pointer-coarse:min-h-11", className)} {...props} />;
});

import { SelectValue as TrinketSelectValue } from "@trinketos/ui/select";
export function SelectValue({ placeholder, ...props }: Omit<React.ComponentProps<typeof TrinketSelectValue>, "placeholder"> & { placeholder?: React.ReactNode }) {
  return <TrinketSelectValue {...props} placeholder={typeof placeholder === "string" ? placeholder : undefined}>{props.children}</TrinketSelectValue>;
}
