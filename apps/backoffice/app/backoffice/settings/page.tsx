import { requireSuperAdmin } from "@/src/features/backoffice/application/server-session";
import { SettingsPage } from "@/src/features/backoffice/presentation/settings-page";
export default async function Page() {
  const user = await requireSuperAdmin();
  return <SettingsPage user={user} />;
}
