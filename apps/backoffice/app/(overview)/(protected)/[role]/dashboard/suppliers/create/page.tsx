import { redirect } from "next/navigation";
export default async function SupplierCreatePage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  redirect(`/${role}/dashboard/suppliers?supplierAction=create`);
}
