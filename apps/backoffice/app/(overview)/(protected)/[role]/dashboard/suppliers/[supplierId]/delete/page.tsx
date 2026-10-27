import { redirect } from "next/navigation";
export default async function SupplierActionPage({ params }: { params: Promise<{ role: string; supplierId: string }> }) {
  const { role, supplierId } = await params;
  redirect(`/${role}/dashboard/suppliers?supplierAction=delete&supplier=${encodeURIComponent(supplierId)}`);
}
