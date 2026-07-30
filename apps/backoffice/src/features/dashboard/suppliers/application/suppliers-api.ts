import { apiRequest } from "@/src/shared/api/http-client";
import type { DashboardListQuery } from "../../shared/application/dashboard-api";

import type {
  PurchaseOrderFormInput,
  SupplierFormInput,
  SupplierResponsibleInput,
} from "../domain/supplier-flow-schemas";

export type Supplier = {
  category?: SupplierFormInput["category"];
  createdAt: string;
  deliveryTerm?: SupplierFormInput["deliveryTerm"];
  document?: string;
  email?: string;
  id: string;
  minimumOrder?: string;
  name: string;
  notes?: string;
  paymentTerm?: SupplierFormInput["paymentTerm"];
  phone?: string;
  responsibles: SupplierResponsible[];
  status: "active" | "inactive";
  updatedAt: string;
  userId: string;
};

export type SupplierResponsible = SupplierResponsibleInput & {
  createdAt: string;
  id: string;
  supplierId: string;
  updatedAt: string;
  userId: string;
};

export type SupplierOperationalSummary = {
  activeSuppliers: number;
  delayedOrders: number;
  delayedReceivings: number;
  dueReceivings: number;
  openOrderValue: number;
  openOrders: number;
  suppliersWithResponsible: number;
  totalSuppliers: number;
};

export type PurchaseOrderStatus =
  | "draft"
  | "confirmed"
  | "receiving"
  | "completed"
  | "cancelled"
  | "delayed"
  | "payable";

export type PurchaseOrder = {
  code: string;
  createdAt: string;
  expectedDeliveryAt: string;
  id: string;
  invoiceNumber?: string;
  items: Array<{
    id: string;
    name: string;
    productId?: string;
    purchaseOrderId: string;
    quantity: number;
    sku: string;
    totalCost: number;
    unitCost: number;
  }>;
  notes?: string;
  paymentTerm?: SupplierFormInput["paymentTerm"];
  status: PurchaseOrderStatus;
  supplierId: string;
  totalCost: number;
  totalItems: number;
  updatedAt: string;
  userId: string;
};

export type ReceivingStatus = "scheduled" | "checking" | "completed" | "delayed";

export type Receiving = {
  createdAt: string;
  discrepancies?: string;
  dock?: string;
  expectedAt: string;
  id: string;
  invoiceNumber: string;
  itemsCount: number;
  purchaseOrderId?: string;
  receivedAt?: string;
  receiverName?: string;
  status: ReceivingStatus;
  supplierId: string;
  updatedAt: string;
  userId: string;
  volumes: number;
};

type SupplierCatalogListQuery = DashboardListQuery & {
  supplierId?: string;
};

export function listSuppliers(query?: DashboardListQuery) {
  return apiRequest<Supplier[]>(withCatalogQuery("/suppliers", query));
}

export async function listAllSuppliers(
  query: Omit<DashboardListQuery, "page" | "perPage"> = {},
) {
  const suppliers: Supplier[] = [];
  let page = 1;

  while (true) {
    const currentPage = await listSuppliers({ ...query, page, perPage: 100 });
    suppliers.push(...currentPage);
    if (currentPage.length < 100) return suppliers;
    page += 1;
  }
}

export function getSupplierOperationalSummary() {
  return apiRequest<SupplierOperationalSummary>("/suppliers/operational-summary");
}

export function listPurchaseOrders(query?: SupplierCatalogListQuery) {
  return apiRequest<PurchaseOrder[]>(withCatalogQuery("/purchase-orders", query));
}

export function createPurchaseOrder(input: PurchaseOrderFormInput) {
  return apiRequest<PurchaseOrder>("/purchase-orders", {
    body: JSON.stringify({
      expectedDeliveryAt: new Date(input.expectedDeliveryAt).toISOString(),
      invoiceNumber: input.invoiceNumber,
      items: input.items.map((item) => ({
        name: item.name,
        productId: item.productId,
        quantity: item.quantity,
        sku: item.sku,
        unitCost: item.unitCost,
      })),
      notes: input.notes,
      paymentTerm: input.paymentTerm,
      status: input.status,
      supplierId: input.supplierId,
    }),
    method: "POST",
  });
}

export function listReceivings(query?: SupplierCatalogListQuery) {
  return apiRequest<Receiving[]>(withCatalogQuery("/receivings", query));
}

export function getSupplier(supplierId: string) {
  return apiRequest<Supplier>(`/suppliers/${supplierId}`);
}

export function createSupplier(input: SupplierFormInput) {
  return apiRequest<Supplier>("/suppliers", {
    body: JSON.stringify({
      category: input.category,
      deliveryTerm: input.deliveryTerm,
      document: normalizeDigits(input.document),
      email: input.email,
      minimumOrder: input.minimumOrder,
      name: input.name,
      notes: input.notes,
      paymentTerm: input.paymentTerm,
      phone: normalizeDigits(input.phone),
      status: input.status,
    }),
    method: "POST",
  });
}

export function updateSupplier(input: SupplierFormInput & { supplierId: string }) {
  return apiRequest<Supplier>(`/suppliers/${input.supplierId}`, {
    body: JSON.stringify({
      category: input.category,
      deliveryTerm: input.deliveryTerm,
      document: normalizeDigits(input.document),
      email: input.email,
      minimumOrder: input.minimumOrder,
      name: input.name,
      notes: input.notes,
      paymentTerm: input.paymentTerm,
      phone: normalizeDigits(input.phone),
      status: input.status,
    }),
    method: "PATCH",
  });
}

export function updateSupplierStatus(
  supplierId: string,
  status: Supplier["status"],
) {
  return apiRequest<Supplier>(`/suppliers/${supplierId}`, {
    body: JSON.stringify({ status }),
    method: "PATCH",
  });
}

export function deleteSupplier(supplierId: string) {
  return apiRequest<void>(`/suppliers/${supplierId}`, {
    method: "DELETE",
  });
}

export function listSupplierResponsibles(supplierId: string) {
  return apiRequest<SupplierResponsible[]>(`/suppliers/${supplierId}/responsibles`);
}

export function createSupplierResponsible(
  supplierId: string,
  input: SupplierResponsibleInput,
) {
  return apiRequest<SupplierResponsible>(`/suppliers/${supplierId}/responsibles`, {
    body: JSON.stringify({
      contactType: input.contactType,
      email: input.email,
      isPrimary: input.isPrimary,
      name: input.name,
      phone: normalizeDigits(input.phone),
      role: input.role,
      status: input.status,
    }),
    method: "POST",
  });
}

export function updateSupplierResponsible(
  supplierId: string,
  responsibleId: string,
  input: SupplierResponsibleInput,
) {
  return apiRequest<SupplierResponsible>(
    `/suppliers/${supplierId}/responsibles/${responsibleId}`,
    {
      body: JSON.stringify({
        contactType: input.contactType,
        email: input.email,
        isPrimary: input.isPrimary,
        name: input.name,
        phone: normalizeDigits(input.phone),
        role: input.role,
        status: input.status,
      }),
      method: "PATCH",
    },
  );
}

export function deleteSupplierResponsible(
  supplierId: string,
  responsibleId: string,
) {
  return apiRequest<void>(`/suppliers/${supplierId}/responsibles/${responsibleId}`, {
    method: "DELETE",
  });
}

function normalizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

function withCatalogQuery(path: string, query?: DashboardListQuery) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      value !== "all"
    ) {
      params.set(key, String(value));
    }
  }

  const search = params.toString();
  return search ? `${path}?${search}` : path;
}
