import * as React from "react";

import { cn } from "../lib/utils";

function EmptyState({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "grid min-h-64 place-items-center rounded-none border border-dashed border-border bg-card p-8 text-center animate-nitro-fade-in",
        className,
      )}
      {...props}
    />
  );
}

function EmptyStateContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mx-auto grid max-w-sm justify-items-center gap-4", className)}
      {...props}
    />
  );
}

function EmptyStateIcon({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex size-12 items-center justify-center rounded-none border border-border bg-muted text-muted-foreground animate-nitro-scale-in [&_svg]:size-5",
        className,
      )}
      {...props}
    />
  );
}

function EmptyStateTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-semibold leading-none tracking-normal", className)}
      {...props}
    />
  );
}

function EmptyStateDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm leading-6 text-muted-foreground", className)} {...props} />
  );
}

function EmptyStateActions({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col-reverse gap-2 sm:flex-row", className)}
      {...props}
    />
  );
}

export {
  EmptyState,
  EmptyStateActions,
  EmptyStateContent,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
};
