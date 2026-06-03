import { apiRequest } from "@/src/shared/api/http-client";
import type { DashboardListQuery } from "../../shared/application/dashboard-api";

import type {
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

export function listSuppliers(query?: DashboardListQuery) {
  return apiRequest<Supplier[]>(withCatalogQuery("/suppliers", query));
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
      ...input,
      phone: normalizeDigits(input.phone),
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
        ...input,
        phone: normalizeDigits(input.phone),
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
