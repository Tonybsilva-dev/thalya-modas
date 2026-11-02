"use client";
import * as React from "react";
import { SheetContent, SheetHeader, SheetBody, SheetFooter, SheetClose, SheetTitle, type SheetContentProps } from "@trinketos/ui/sheet";
import { cva } from "class-variance-authority";
import { Button } from "./button";
import { cn } from "../lib/utils";
export { Sheet as Drawer, SheetTrigger as DrawerTrigger, SheetPortal as DrawerPortal, SheetOverlay as DrawerOverlay, SheetClose as DrawerClose, SheetDescription as DrawerDescription } from "@trinketos/ui/sheet";
export const drawerContentVariants = cva("gap-0 bg-card text-card-foreground shadow-none", {
  variants: { side: {
    left: "w-[340px] max-w-[calc(100vw-2rem)] sm:max-w-[340px]",
    right: "w-[340px] max-w-[calc(100vw-2rem)] sm:max-w-[340px]",
    top: "max-h-[85dvh] w-full",
    bottom: "max-h-[85dvh] w-full",
  } }, defaultVariants: { side: "right" },
});
export type DrawerContentProps = SheetContentProps;
export const DrawerTitle = React.forwardRef<HTMLHeadingElement, React.ComponentPropsWithoutRef<typeof SheetTitle>>(function DrawerTitle({ className, ...props }, ref) {
  return <SheetTitle {...props} ref={ref} className={cn("[font-family:var(--font-primary)]", className)} />;
});
export const DrawerContent = React.forwardRef<HTMLDivElement, DrawerContentProps>(function DrawerContent({ className, side = "right", ...props }, ref) {
  return <SheetContent {...props} ref={ref} side={side} hideCloseButton data-store-flow-sheet="" className={cn(drawerContentVariants({ side }), className)} />;
});
export function DrawerHeader({ className, ...props }: React.ComponentProps<typeof SheetHeader>) {
  return <SheetHeader {...props} className={cn("flex-row items-start justify-between gap-3 p-4", className)} />;
}
export function DrawerBody({ className, ...props }: React.ComponentProps<typeof SheetBody>) {
  return <SheetBody {...props} className={cn("grid content-start gap-3 p-4", className)} />;
}
export function DrawerFooter({ className, ...props }: React.ComponentProps<typeof SheetFooter>) {
  return <SheetFooter {...props} className={cn("mt-auto bg-card p-4", className)} />;
}
export const DrawerCloseButton = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<typeof Button>>(function DrawerCloseButton({ "aria-label": label = "Fechar", ...props }, ref) {
  return <SheetClose asChild><Button {...props} ref={ref} type="button" variant="ghost" size="icon" aria-label={label}><svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 6 12 12M18 6 6 18" /></svg></Button></SheetClose>;
});
