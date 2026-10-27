import type { ReactNode } from "react";
import { requireSuperAdmin } from "@/src/features/backoffice/application/server-session";
import { BackofficeShell } from "@/src/features/backoffice/presentation/backoffice-shell";
export default async function Layout({ children }: { children: ReactNode }) {
  const user = await requireSuperAdmin();
  return <BackofficeShell user={user}>{children}</BackofficeShell>;
}
