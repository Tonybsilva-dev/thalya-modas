"use client";
import * as React from "react";
import { Switch as TrinketSwitch, type SwitchProps as TrinketSwitchProps } from "@trinketos/ui/switch";
import { cn } from "../lib/utils";
type SwitchProps = TrinketSwitchProps & { onCheckedChange?: (checked: boolean) => void };
export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(function Switch({ onCheckedChange, onChange, className, ...props }, ref) {
  return <TrinketSwitch {...props} ref={ref} className={cn("min-h-10 pointer-coarse:min-h-11", className)} onChange={(event) => {
    onChange?.(event);
    onCheckedChange?.(event.target.checked);
  }} />;
});
