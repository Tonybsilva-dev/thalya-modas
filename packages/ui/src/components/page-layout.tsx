import * as React from "react";
import type { ComponentProps, ReactNode } from "react";
import { PageHeader as TrinketPageHeader, type PageHeaderProps as TrinketPageHeaderProps } from "@trinketos/ui/page-header";
import { cn } from "../lib/utils";

export function PageLayout({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("grid min-w-0 content-start gap-3", className)} {...props} />;
}

export type PageHeaderProps = TrinketPageHeaderProps;
export function PageHeader({ actions, primaryAction, className, ...props }: PageHeaderProps) {
  // Store Flow keeps actions in the document flow; forms use their own sticky footer.
  return <TrinketPageHeader {...props} actions={actions || primaryAction ? <>{actions}{primaryAction}</> : undefined}
    className={cn("gap-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:[font-family:var(--font-primary)] [&_[data-slot=page-header-actions]]:flex-wrap [&_[data-slot=page-header-actions]_button]:h-10 [&_[data-slot=page-header-actions]_a]:min-h-10", className)} />;
}

export function PageToolbar({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex min-w-0 flex-wrap items-end gap-3 border-b border-border px-4 py-3", className)} {...props} />;
}

export function PageSection({ title, description, children, className, id }: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return <section id={id} className={cn("grid min-w-0 content-start gap-3 border-b border-border pb-4 last:border-b-0", className)}>
    <header className="space-y-1"><h2 className="text-base font-semibold text-foreground">{title}</h2>{description && <p className="text-sm text-muted-foreground">{description}</p>}</header>
    {children}
  </section>;
}

export function FormActions({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-2 border-t border-border bg-card px-4 py-3", className)} {...props} />;
}
