"use client";

import type { ComponentProps } from "react";
import { DropdownMenuContent, cn } from "@store-flow/ui";

export const sidebarDropdownTriggerClassName = "group flex w-full cursor-pointer items-center gap-3 border border-transparent p-2 text-left text-sidebar-foreground transition-colors hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function SidebarDropdownContent({ className, align = "end", ...props }: ComponentProps<typeof DropdownMenuContent>) {
  return <DropdownMenuContent align={align} side="right" sideOffset={12} collisionPadding={12} className={cn("max-h-[calc(100vh-2rem)] w-[min(320px,calc(100vw-2rem))] overflow-y-auto p-1.5", className)} {...props} />;
}
