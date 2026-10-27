"use client";
import * as React from "react";
import { Input as TrinketInput, type InputProps } from "@trinketos/ui/input";
import { cn } from "../lib/utils";
export type { InputProps } from "@trinketos/ui/input";
export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input({ className, classNames, size, ...props }, ref) {
  const standard = !size || size === "md" || size === "middle";
  return <TrinketInput ref={ref} size={size} className={cn(standard && "h-10 text-sm", "pointer-coarse:min-h-11", className)} classNames={{ ...classNames, root: cn(standard && "h-10", "pointer-coarse:min-h-11", classNames?.root), input: cn(standard && "text-sm", classNames?.input) }} {...props} />;
});

/** Uses the published Input's prefix slot; currency is never a decorative dollar icon. */
export const CurrencyInput = React.forwardRef<HTMLInputElement, Omit<InputProps, "prefix">>(function CurrencyInput(props, ref) {
  return <Input inputMode="decimal" placeholder="0,00" {...props} prefix={<span aria-hidden="true">R$</span>} ref={ref} />;
});
