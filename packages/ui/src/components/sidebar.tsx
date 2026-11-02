import * as React from "react";
import { Button } from "./button";

import { cn } from "../lib/utils";

function Sidebar({ className, ...props }: React.ComponentProps<"aside">) {
  return (
    <aside
      className={cn(
        "flex h-full w-[var(--sf-sidebar-width)] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        className,
      )}
      {...props}
    />
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("border-b border-sidebar-border p-4", className)} {...props} />
  );
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("min-h-0 flex-1 overflow-y-auto p-2", className)} {...props} />;
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("border-t border-sidebar-border p-3", className)} {...props} />
  );
}

function SidebarSectionTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("px-3 py-2 text-xs font-semibold text-sidebar-foreground", className)}
      {...props}
    />
  );
}

function SidebarItem({
  asChild,
  active,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean;
  active?: boolean;
}) {
  return (
    <Button
      asChild={asChild}
      variant="ghost"
      className={cn(
        "flex h-10 w-full items-center gap-3 rounded-full px-3 text-left text-sm font-medium outline-none transition-[background-color,color,box-shadow] duration-fast ease-nitro hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        active && "bg-sidebar-accent text-sidebar-accent-foreground",
        className,
      )}
      {...props}
    />
  );
}

export {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarSectionTitle,
  SidebarItem,
};
