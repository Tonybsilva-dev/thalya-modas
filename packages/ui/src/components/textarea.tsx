import * as React from "react";

import { cn } from "../lib/utils";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "flex min-h-24 w-full rounded-none border border-input bg-card px-3 py-2 text-sm text-foreground shadow-none outline-none transition-[border-color,box-shadow] duration-base ease-nitro placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
export type { TextareaProps };
