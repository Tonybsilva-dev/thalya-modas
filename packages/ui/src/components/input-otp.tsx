import * as React from "react";

import { cn } from "../lib/utils";

type InputOTPProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "maxLength" | "onChange" | "value"
> & {
  length?: number;
  value?: string;
  onValueChange?: (value: string) => void;
};

function InputOTP({
  className,
  length = 6,
  value,
  defaultValue,
  onValueChange,
  ...props
}: InputOTPProps) {
  const [internalValue, setInternalValue] = React.useState(
    String(defaultValue ?? "").slice(0, length),
  );
  const currentValue = value ?? internalValue;

  function update(nextValue: string) {
    const sanitized = nextValue.replace(/\s/g, "").slice(0, length);
    if (value === undefined) {
      setInternalValue(sanitized);
    }
    onValueChange?.(sanitized);
  }

  return (
    <input
      className={cn("sr-only", className)}
      inputMode="numeric"
      maxLength={length}
      value={currentValue}
      onChange={(event) => update(event.target.value)}
      {...props}
    />
  );
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex items-center", className)} {...props} />;
}

function InputOTPSlot({
  className,
  char,
  isActive,
  ...props
}: React.ComponentProps<"div"> & {
  char?: string;
  isActive?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex size-10 items-center justify-center border-y border-r border-input bg-card text-sm transition-colors first:border-l",
        isActive && "z-10 border-primary ring-2 ring-primary/20",
        className,
      )}
      {...props}
    >
      {char}
    </div>
  );
}

function InputOTPSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex h-10 items-center px-3 text-muted-foreground", className)}
      {...props}
    >
      •
    </div>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
