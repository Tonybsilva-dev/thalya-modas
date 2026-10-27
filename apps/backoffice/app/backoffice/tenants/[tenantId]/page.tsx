import { TenantDetailPage } from "@/src/features/backoffice/presentation/tenant-detail-page";
export default async function Page({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  return <TenantDetailPage tenantId={tenantId} />;
}
