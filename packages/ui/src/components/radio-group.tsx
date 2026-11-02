"use client";
import * as React from "react";
import { RadioGroup as TrinketRadioGroup, Radio, type RadioGroupProps } from "@trinketos/ui/radio";
import { cn } from "../lib/utils";
export function RadioGroup({ onValueChange, onChange, className, ...props }: RadioGroupProps & { onValueChange?: (value: string) => void }) {
  return <TrinketRadioGroup {...props} className={cn("grid gap-2", className)} onChange={(event) => {
    onChange?.(event);
    onValueChange?.(event.target.value);
  }} />;
}
export const RadioGroupItem = Radio;
