import { redirect } from "next/navigation";
export default async function SupplierActionPage({ params, searchParams }: { params: Promise<{ role: string; supplierId: string }>; searchParams?: Promise<{ section?: string; modal?: string }> }) {
  const { role, supplierId } = await params;
  const query = searchParams ? await searchParams : {};
  const action = query.modal === "delete" ? "delete" : query.section === "contacts" || query.modal === "responsible" ? "contacts" : "edit";
  redirect(`/${role}/dashboard/suppliers?supplierAction=${action}&supplier=${encodeURIComponent(supplierId)}`);
}
