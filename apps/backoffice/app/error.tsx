"use client";

import { GlobalErrorScreen } from "@/src/shared/ui/global-status-screen";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <GlobalErrorScreen incidentId={error.digest} onRetry={reset} />;
}
