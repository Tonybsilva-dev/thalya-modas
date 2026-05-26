import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const toggleButtonVariants = cva(
  "inline-flex h-10 shrink-0 items-center justify-center gap-2 border border-border bg-card px-3.5 py-2.5 text-sm font-semibold text-foreground whitespace-nowrap outline-none transition-[background-color,border-color,color,box-shadow,transform] duration-fast ease-nitro hover:bg-accent active:scale-95 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100 aria-pressed:border-secondary aria-pressed:bg-secondary aria-pressed:text-secondary-foreground [&_svg]:pointer-events-none [&_svg]:size-[15px] [&_svg]:shrink-0",
  {
    variants: {
      size: {
        default: "h-10 px-3.5 py-2.5",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-4",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

type ToggleButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof toggleButtonVariants> & {
    pressed?: boolean;
  };

const ToggleButton = React.forwardRef<HTMLButtonElement, ToggleButtonProps>(
  ({ className, pressed = false, size, type, ...props }, ref) => (
    <button
      ref={ref}
      aria-pressed={pressed}
      className={cn(toggleButtonVariants({ size, className }))}
      type={type ?? "button"}
      {...props}
    />
  ),
);
ToggleButton.displayName = "ToggleButton";

const ToggleButtonGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex items-center gap-1 border border-border bg-muted p-1",
      className,
    )}
    role="group"
    {...props}
  />
));
ToggleButtonGroup.displayName = "ToggleButtonGroup";

export { ToggleButton, ToggleButtonGroup, toggleButtonVariants };
export type { ToggleButtonProps };
