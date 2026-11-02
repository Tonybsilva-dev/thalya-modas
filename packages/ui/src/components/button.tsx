import * as React from "react";
import { Button as TrinketButton, type ButtonProps } from "@trinketos/ui/button";
import { cn } from "../lib/utils";
export { buttonVariants } from "@trinketos/ui/button";
export type { ButtonProps } from "@trinketos/ui/button";
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className, size = "default", ...props }, ref) {
  return <TrinketButton ref={ref} size={size} className={cn(size === "default" && "h-[var(--sf-control-height)]", "rounded-full font-medium shadow-none pointer-coarse:min-h-11 pointer-coarse:min-w-11", className)} {...props} />;
});
