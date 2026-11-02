"use client";
import * as React from "react";
import { TextArea } from "@trinketos/ui/textarea";
import { cn } from "../lib/utils";
export type TextareaProps = React.ComponentPropsWithoutRef<typeof TextArea>;
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ className, ...props }, ref) {
  return <TextArea ref={ref} className={cn("min-h-24 rounded-2xl bg-background text-sm", className)} {...props} />;
});
