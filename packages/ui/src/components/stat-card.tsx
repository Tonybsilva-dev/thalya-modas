"use client";
import * as React from "react";
import { StatCard as TrinketStatCard, type StatCardProps as TrinketStatCardProps } from "@trinketos/ui/stat-card";
import { cn } from "../lib/utils";
export type StatCardProps = TrinketStatCardProps & { tone?: "brand" | "mint" | "rose" | "amber" | "sky" | "neutral" };
const tones = {
  brand: "border-primary bg-primary text-primary-foreground [&_p]:text-primary-foreground! [&>div[aria-hidden]]:bg-primary-foreground/15 [&>div[aria-hidden]]:text-primary-foreground",
  mint: "bg-[var(--metric-mint)]", rose: "bg-[var(--metric-rose)]",
  amber: "bg-[var(--metric-amber)]", sky: "bg-[var(--metric-sky)]", neutral: "bg-card",
};
export function StatCard({ className, tone = "neutral", ...props }: StatCardProps) {
  return <TrinketStatCard {...props} className={cn(
    "relative h-full min-w-0 gap-3 rounded-[var(--radius-card)] border-border/30 p-5 shadow-none ring-0 [&>div]:min-w-0 [&>div:not([aria-hidden])]:flex [&>div:not([aria-hidden])]:flex-col [&>div>p:first-child]:break-words [&>div>p:first-child]:text-[28px] [&>div>p:first-child]:font-semibold [&>div>p:first-child]:[font-family:var(--font-primary)] [&>div>p:nth-child(2)]:order-first [&>div>p:nth-child(2)]:mb-4 [&>div>p:nth-child(2)]:text-sm [&>div>p:nth-child(2)]:font-medium [&>div>p:nth-child(2)]:text-foreground [&>div[aria-hidden]]:absolute [&>div[aria-hidden]]:right-4 [&>div[aria-hidden]]:top-4 [&>div[aria-hidden]]:rounded-full",
    tones[tone], className,
  )} />;
}
