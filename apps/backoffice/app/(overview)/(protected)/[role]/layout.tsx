import { OperationalContext } from "@/src/features/dashboard/shared/presentation/operational-context";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireSession } from "@/src/features/backoffice/application/server-session";
import { getBackofficeDestination,roleSegments } from "@/src/shared/auth/role-destination";
export default async function RoleLayout({children,params}:{children:ReactNode;params:Promise<{role:string}>}) {
 const user=await requireSession();const {role}=await params;
 if(role!==roleSegments[user.role] || user.role==="ROLE_SUPER_ADMIN") redirect(getBackofficeDestination(user.role));
 return user.role==="ROLE_CUSTOMER" ? children : <OperationalContext>{children}</OperationalContext>;
}
