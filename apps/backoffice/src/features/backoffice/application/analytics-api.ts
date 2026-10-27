import { apiRequest } from "@/src/shared/api/http-client";

export type PlatformAnalytics = {
  summary: { tenants: number; activeTenants: number; suspendedTenants: number; branches: number; activeBranches: number; tenantsWithoutBranches: number };
  plans: { items: { id: string; name: string; status: string; priceCents: number | null; tenants: number }[]; total: number; page: number; perPage: number; totalPages: number };
  controls: { maintenance: boolean; disabledKeys: string[] };
  generatedAt: string;
};
export const analyticsKey = ["platform", "analytics"] as const;
export const getAnalytics = (page = 1) => apiRequest<PlatformAnalytics>(`/admin/analytics?page=${page}&perPage=20`);
