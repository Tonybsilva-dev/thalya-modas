import { DashboardOverviewRoute } from "@/src/features/dashboard/overview/presentation/dashboard-overview-route";

import { Card, CardContent, CardHeader, CardTitle } from "@store-flow/ui";
import { requireSession } from "@/src/features/backoffice/application/server-session";
export default async function DashboardPage() {
 const user=await requireSession();
 if(user.role==="ROLE_CUSTOMER") return <main className="p-6"><Card><CardHeader><CardTitle>Minha conta</CardTitle></CardHeader><CardContent><p>{user.name}</p><p>{user.email}</p></CardContent></Card></main>;
  return <DashboardOverviewRoute />;
}
