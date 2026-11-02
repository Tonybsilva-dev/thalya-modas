"use client";
import * as React from "react";
import { Progress as TrinketProgress, type ProgressProps } from "@trinketos/ui/progress";
export function Progress(props: ProgressProps) {
  return <TrinketProgress showInfo={false} {...props} />;
}
