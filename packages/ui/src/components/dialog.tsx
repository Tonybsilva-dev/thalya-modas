"use client";
import * as React from "react";
import { DialogContent as TrinketDialogContent, DialogClose as TrinketDialogClose, DialogTitle as TrinketDialogTitle, DialogDescription as TrinketDialogDescription, type DialogContentProps } from "@trinketos/ui/dialog";
import { Button } from "./button";
import { cn } from "../lib/utils";
export { DialogTrigger, DialogClose, DialogBody } from "@trinketos/ui/dialog";
// Compatibility exports only; published Content owns its portal and overlay.
export { SheetPortal as DialogPortal, SheetOverlay as DialogOverlay } from "@trinketos/ui/sheet";
export function DialogContent({ className, children, size = "default", closeLabel = "Fechar", hideCloseButton, ...props }: DialogContentProps & { size?: "default" | "wide"; closeLabel?: string }) {
  return <TrinketDialogContent {...props} hideCloseButton data-store-flow-dialog="" className={cn("gap-4 overflow-y-auto rounded-[var(--radius-card)] bg-background p-6 text-sm text-card-foreground", size === "wide" && "sm:max-w-3xl", className)}>
    {children}
    {!hideCloseButton && <TrinketDialogClose asChild><Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1" aria-label={closeLabel}>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 6 12 12M18 6 6 18" /></svg>
    </Button></TrinketDialogClose>}
  </TrinketDialogContent>;
}
export function DialogTitle({ className, ...props }: React.ComponentProps<typeof TrinketDialogTitle>) {
  return <TrinketDialogTitle className={cn("text-lg font-semibold", className)} {...props} />;
}
export function DialogDescription({ className, ...props }: React.ComponentProps<typeof TrinketDialogDescription>) {
  return <TrinketDialogDescription className={cn("text-sm", className)} {...props} />;
}

import { DialogHeader as TrinketDialogHeader, DialogFooter as TrinketDialogFooter } from "@trinketos/ui/dialog";
export function DialogHeader({ className, ...props }: React.ComponentProps<typeof TrinketDialogHeader>) {
  return <TrinketDialogHeader className={cn("gap-2 border-0 p-0 pr-6", className)} {...props} />;
}
export function DialogFooter({ className, ...props }: React.ComponentProps<typeof TrinketDialogFooter>) {
  return <TrinketDialogFooter className={cn("border-0 p-0", className)} {...props} />;
}

import { DialogRoot, type DialogRootProps } from "@trinketos/ui/dialog";
export function Dialog({ children, ...props }: Omit<DialogRootProps, "children"> & { children?: React.ReactNode }) {
  return <DialogRoot {...props}>{children}</DialogRoot>;
}
