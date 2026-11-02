"use client";
import * as React from "react";
import { Banner } from "@trinketos/ui/banner";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const alertVariants = cva("w-full rounded-none border-l-2", {
  variants: { variant: {
    default: "border-primary bg-info text-info-foreground",
    success: "border-success-foreground bg-success text-success-foreground",
    warning: "border-warning-foreground bg-warning text-warning-foreground",
    destructive: "border-error-foreground bg-error text-error-foreground",
  } }, defaultVariants: { variant: "default" },
});
type AlertProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>;
const toneByVariant = { default: "info", success: "success", warning: "warning", destructive: "danger" } as const;
function Alert({ className, variant, children, role = "alert", ...props }: AlertProps) {
  return <Banner {...props} role={role} tone={toneByVariant[variant ?? "default"]} className={cn(alertVariants({ variant }), className)}>
    <div className="grid grid-cols-[auto_1fr] gap-x-3 [&>svg]:mt-0.5 [&>svg]:size-4">{children}</div>
  </Banner>;
}
function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 {...props} className={cn("mb-1 font-semibold leading-tight", className)} />;
}
function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("col-start-2 text-sm leading-6", className)} />;
}
export { Alert, AlertTitle, AlertDescription, alertVariants };
export type { AlertProps };
