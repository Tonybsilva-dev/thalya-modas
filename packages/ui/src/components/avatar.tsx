"use client";
import * as React from "react";
import { Avatar as TrinketAvatar, type AvatarProps } from "@trinketos/ui/avatar";
import { cn } from "../lib/utils";
export type { AvatarProps } from "@trinketos/ui/avatar";
export function Avatar({ className, ...props }: AvatarProps) {
  return <TrinketAvatar {...props} className={cn("rounded-2xl [&>span]:rounded-2xl! [&_img]:rounded-2xl [&_img]:object-contain", className)} />;
}
