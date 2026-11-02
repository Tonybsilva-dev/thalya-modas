"use client";
import * as React from "react";
import { IconButton as TrinketIconButton, type IconButtonProps as TrinketIconButtonProps } from "@trinketos/ui/icon-button";
import { cn } from "../lib/utils";
export type IconButtonProps = Omit<TrinketIconButtonProps, "icon"> & { children: React.ReactNode };
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({ children, className, asChild, ...props }, ref) {
  return <TrinketIconButton ref={ref} {...props} asChild={asChild} icon={asChild ? undefined : children} className={cn("pointer-coarse:min-h-11 pointer-coarse:min-w-11", className)}>{asChild ? children : undefined}</TrinketIconButton>;
});
