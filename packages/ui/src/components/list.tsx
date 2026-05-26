import * as React from "react";

import { cn } from "../lib/utils";

function List({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("grid gap-1", className)} {...props} />;
}

function ListTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("px-3 py-2 text-xs font-semibold text-muted-foreground", className)}
      {...props}
    />
  );
}

function ListItem({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex min-h-10 items-center justify-between gap-3 px-3 py-2 text-sm text-foreground transition-colors duration-fast ease-nitro hover:bg-accent",
        className,
      )}
      {...props}
    />
  );
}

function ListItemContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)} {...props} />
  );
}

function ListItemMeta({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex shrink-0 items-center gap-2 text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

function ListDivider({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("my-1 h-px bg-border", className)} {...props} />;
}

export {
  List,
  ListTitle,
  ListItem,
  ListItemContent,
  ListItemMeta,
  ListDivider,
};
