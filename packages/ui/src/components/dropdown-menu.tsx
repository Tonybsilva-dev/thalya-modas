"use client";
import * as React from "react";
import * as Primitive from "@radix-ui/react-dropdown-menu";
import {
  DropdownMenuRoot, DropdownMenuContent as PublishedContent,
  DropdownMenuItem as PublishedItem, DropdownMenuLabel as PublishedLabel,
  DropdownMenuCheckboxItem as PublishedCheckboxItem,
  DropdownMenuRadioItem as PublishedRadioItem,
  DropdownMenuSubTrigger as PublishedSubTrigger,
} from "@trinketos/ui/dropdown-menu";
import { cn } from "../lib/utils";
export { DropdownMenuTrigger, DropdownMenuGroup, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuRadioGroup, DropdownMenuSeparator } from "@trinketos/ui/dropdown-menu";
export { Portal as DropdownMenuPortal } from "@radix-ui/react-dropdown-menu";
export function DropdownMenu({ children, ...props }: Omit<React.ComponentProps<typeof DropdownMenuRoot>, "children"> & { children?: React.ReactNode }) {
  return <DropdownMenuRoot {...props}>{children}</DropdownMenuRoot>;
}
const itemClassName = "min-h-10 gap-2 text-sm pointer-coarse:min-h-11";
const contentProps = new Set(["children", "align", "style"]);
const itemProps = new Set(["children", "disabled", "style"]);
/** The published Content does not yet forward positioning or collision props. */
export const DropdownMenuContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof Primitive.Content>>(function DropdownMenuContent({ className, sideOffset = 4, ...props }, ref) {
  const classes = cn("min-w-40 border border-border bg-popover p-1 text-popover-foreground", className);
  const requiresCompatibility = Object.keys(props).some(key => !contentProps.has(key));
  if (!requiresCompatibility && !ref) {
    return <PublishedContent {...props} className={classes} sideOffset={sideOffset}>{props.children}</PublishedContent>;
  }
  return <Primitive.Portal><Primitive.Content {...props} ref={ref} sideOffset={sideOffset} className={cn("z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] overflow-y-auto shadow-md data-[state=open]:animate-nitro-scale-in data-[state=closed]:animate-nitro-scale-out", classes)} /></Primitive.Portal>;
});
/** Preserve actual anchors, cancelable selection and native metadata until upstream exposes them. */
export const DropdownMenuItem = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof Primitive.Item> & { inset?: boolean }>(function DropdownMenuItem({ className, inset, ...props }, ref) {
  const classes = cn(itemClassName, inset && "pl-8", className);
  const requiresCompatibility = Object.keys(props).some(key => !itemProps.has(key));
  if (!requiresCompatibility && !ref) {
    return <PublishedItem disabled={props.disabled} style={props.style} className={classes}>{props.children}</PublishedItem>;
  }
  return <Primitive.Item {...props} ref={ref} className={cn("relative flex cursor-default select-none items-center rounded-xl px-2 py-2 outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", classes)} />;
});
export function DropdownMenuLabel({ className, ...props }: React.ComponentProps<typeof PublishedLabel>) {
  return <PublishedLabel {...props} className={cn("font-semibold", className)} />;
}
export function DropdownMenuCheckboxItem({ className, ...props }: React.ComponentProps<typeof PublishedCheckboxItem>) {
  return <PublishedCheckboxItem {...props} className={cn(itemClassName, className)} />;
}
export function DropdownMenuRadioItem({ className, ...props }: React.ComponentProps<typeof PublishedRadioItem>) {
  return <PublishedRadioItem {...props} className={cn(itemClassName, className)} />;
}
export const DropdownMenuSubTrigger = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof PublishedSubTrigger>>(function DropdownMenuSubTrigger({ className, ...props }, ref) {
  return <PublishedSubTrigger {...props} ref={ref} className={cn(itemClassName, className)} />;
});
export function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return <span {...props} className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)} />;
}
