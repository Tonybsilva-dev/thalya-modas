import type { Page } from "./backoffice-api";
import { apiRequest } from "@/src/shared/api/http-client";
export type Flags = Record<string, boolean>;
export type FeatureModule = {
  key: string;
  label: string;
  description: string;
  features: { key: string; label: string; available: boolean }[];
};
export type Plan = {
  id: string;
  name: string;
  description: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  priceCents: number | null;
  flags: Flags;
  updatedAt: string;
};
export type Controls = {
  disabledKeys: string[];
  maintenance: boolean;
  updatedAt: string;
};
export type Resolution = {
  plan: Plan | null;
  overrides: Flags;
  controls: Controls;
  features: {
    key: string;
    module: string;
    label: string;
    enabled: boolean;
    reason: string | null;
  }[];
};
export type Audit = {
  id: string;
  actorId: string;
  actorName?: string;
  action: string;
  targetId: string;
  reason: string;
  createdAt: string;
  changes: unknown;
};
export type AuditFilters = { page?: number; action?: string; actorId?: string; targetId?: string; from?: string; to?: string };
export type AuditPage = { items: Audit[]; total: number; page: number; perPage: number; totalPages: number };
export const auditKeys = ["platform", "audit"] as const;
export const getAuditActors = () => apiRequest<{ id: string; name: string }[]>("/admin/audit/actors");
export const getAuditPage = (filters: AuditFilters) => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) query.set(key, String(value));
  return apiRequest<AuditPage>(`/admin/audit?${query}`);
};
export const planKeys = ["platform", "plans"] as const;
export const controlKeys = ["platform", "controls"] as const;
export const catalogKey = ["platform", "feature-catalog"] as const;
export const getCatalog = () => apiRequest<FeatureModule[]>("/admin/features");
export const getPlans = (page=1,filter="",status="") => apiRequest<Page<Plan>>(`/admin/plans?${new URLSearchParams({page:String(page),perPage:"20",filter,...(status ? {status}: {})})}`);
export const getPlan = (id:string) => apiRequest<Plan>(`/admin/plans/${encodeURIComponent(id)}`);
export const getControls = () => apiRequest<Controls>("/admin/controls");
export const getAudit = () => apiRequest<Audit[]>("/admin/plan-audit");
export const savePlan = (
  input: Omit<Plan, "id" | "updatedAt"> & { id?: string; reason: string },
) => {
  const { id, ...body } = input;
  return apiRequest<Plan>(`/admin/plans${id ? `/${id}` : ""}`, {
    method: id ? "PATCH" : "POST",
    body: JSON.stringify(body),
  });
};
export const saveControls = (
  input: Omit<Controls, "updatedAt"> & { reason: string },
) =>
  apiRequest<Controls>("/admin/controls", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
export const getTenantPlan = (id: string) =>
  apiRequest<Resolution>(`/admin/tenants/${id}/plan`);
export const saveTenantPlan = (
  id: string,
  input: { planId: string; overrides: Flags; reason: string },
) =>
  apiRequest<Resolution>(`/admin/tenants/${id}/plan`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
