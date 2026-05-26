import * as React from "react";

import { cn } from "../lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

function Input({ className, type, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-none border border-input bg-card px-3 py-2 text-sm text-foreground shadow-none outline-none transition-[border-color,box-shadow] duration-base ease-nitro file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      type={type}
      {...props}
    />
  );
}

export { Input };
export type { InputProps };
