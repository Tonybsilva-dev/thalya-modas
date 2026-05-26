"use client";

import { GlobalErrorScreen } from "@/src/shared/ui/global-status-screen";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <GlobalErrorScreen onRetry={reset} />;
}
