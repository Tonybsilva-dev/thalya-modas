"use client";
import * as React from "react";
import { TabsRoot, type TabsRootProps } from "@trinketos/ui/tabs";
export { TabsList, TabsTrigger, TabsContent } from "@trinketos/ui/tabs";
type TabsProps = Omit<TabsRootProps, "value" | "onChange"> & { value?: string; defaultValue?: string; onValueChange?: (value: string) => void };
/** Preserve controlled URL tabs and uncontrolled examples. */
export function Tabs({ value, defaultValue = "", onValueChange, ...props }: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  return <TabsRoot {...props} value={value ?? internalValue} onChange={(next) => {
    if (value === undefined) setInternalValue(next);
    onValueChange?.(next);
  }} />;
}
