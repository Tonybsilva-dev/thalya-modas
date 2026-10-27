import * as React from "react";
import { Card as BaseCard, CardContent as BaseContent } from "@trinketos/ui/card";
import { cn } from "../lib/utils";
export { CardHeader, CardTitle, CardDescription, CardFooter } from "@trinketos/ui/card";

export function Card({ className, children, ...props }: Omit<React.ComponentProps<typeof BaseCard>, "children"> & { children?: React.ReactNode }) {
  return <BaseCard children={children} className={cn("gap-0 border border-border py-0 shadow-none ring-0", className)} {...props} />;
}
export const CardContent = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof BaseContent>>(
  function CardContent({ className, ...props }, ref) {
    return <BaseContent ref={ref} className={cn("p-4", className)} {...props} />;
  },
);
