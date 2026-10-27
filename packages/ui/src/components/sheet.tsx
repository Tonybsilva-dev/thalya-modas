"use client";
import * as React from "react";
import { SheetContent as TrinketSheetContent, type SheetContentProps } from "@trinketos/ui/sheet";
import { cn } from "../lib/utils";
export { Sheet, SheetTrigger, SheetClose, SheetHeader, SheetBody, SheetFooter, SheetTitle, SheetDescription } from "@trinketos/ui/sheet";
export function SheetContent({ className, ...props }: SheetContentProps) {
  return <TrinketSheetContent data-store-flow-sheet="" className={cn("w-full gap-0 bg-card shadow-none sm:max-w-3xl data-[state=open]:duration-200 data-[state=closed]:duration-150", className)} {...props} />;
}
