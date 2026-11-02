import * as React from "react";
import type { ComponentProps, ReactNode } from "react";
import { PageHeader as TrinketPageHeader, type PageHeaderProps as TrinketPageHeaderProps } from "@trinketos/ui/page-header";
import { cn } from "../lib/utils";

export function PageLayout({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("grid min-w-0 content-start gap-[var(--sf-region-gap)]", className)} {...props} />;
}

export type PageHeaderProps = TrinketPageHeaderProps;
export function PageHeader({ actions, primaryAction, className, ...props }: PageHeaderProps) {
  // Store Flow keeps actions in the document flow; forms use their own sticky footer.
  return <TrinketPageHeader {...props} actions={actions || primaryAction ? <>{actions}{primaryAction}</> : undefined}
    className={cn("gap-3 [&_h1]:text-[length:var(--sf-page-title-size)] [&_h1]:leading-8 [&_h1]:font-medium [&_h1]:tracking-tight [&_h1]:[font-family:var(--font-primary)] [&_[data-slot=page-header-actions]]:flex-wrap [&_[data-slot=page-header-actions]_button]:h-[var(--sf-control-height)] [&_[data-slot=page-header-actions]_a]:min-h-[var(--sf-control-height)]", className)} />;
}

export function PageToolbar({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex min-w-0 flex-wrap items-end gap-3 border-b border-border/50 px-5 py-4 [&>form]:w-full", className)} {...props} />;
}

export function PageSection({ title, description, children, className, id }: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return <section id={id} className={cn("grid min-w-0 content-start gap-3 rounded-[var(--radius-card)] border border-border/40 bg-card p-5", className)}>
    <header className="space-y-1"><h2 className="text-base font-semibold text-foreground">{title}</h2>{description && <p className="text-sm text-muted-foreground">{description}</p>}</header>
    {children}
  </section>;
}

export function FormActions({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-border/50 bg-background px-4 py-3", className)} {...props} />;
}
