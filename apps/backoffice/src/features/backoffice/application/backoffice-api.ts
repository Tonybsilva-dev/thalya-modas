import { apiRequest } from "@/src/shared/api/http-client";
import type { CurrentUser } from "@/src/features/auth/session/application/current-user-api";
export type Tenant = {
  id: string;
  ownerId: string;
  branchCount: number;
  name: string;
  slug: string;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  updatedAt: string;
};
export type Branch = {
  id: string;
  tenantId: string;
  ownerId: string;
  name: string;
  logoUrl?: string | null;
  phone: string;
  document: string;
  segment: string;
  status: string;
  createdAt: string;
};
export type UserPage = {
  items: CurrentUser[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};
export const platformKeys = {
  tenants: ["platform", "tenants"] as const,
  branches: ["platform", "branches"] as const,
  users: ["platform", "users"] as const,
};
export type Page<T> = {items:T[];total:number;page:number;perPage:number;totalPages:number};
export const listTenants = (page=1, filter="", status="", perPage=20) => apiRequest<Page<Tenant>>(`/tenants?${new URLSearchParams({page:String(page),perPage:String(perPage),filter,...(status ? {status}: {})})}`);
export const listBranches = (page=1,perPage=20) => apiRequest<Page<Branch>>(`/admin/stores?page=${page}&perPage=${perPage}`);
export const getTenant = (id: string) =>
  apiRequest<Tenant>(`/tenants/${encodeURIComponent(id)}`);
export const listTenantBranches = (id: string, page=1) =>
  apiRequest<Page<Branch>>(`/tenants/${encodeURIComponent(id)}/stores?page=${page}&perPage=20`);
export const listUsers = (page = 1, filter = "") =>
  apiRequest<UserPage>(
    `/users?page=${page}&perPage=20&filter=${encodeURIComponent(filter)}`,
  );
export const countUsers = () => apiRequest<{ count: number }>("/users/count");
export async function listOwners() {
  const owners: CurrentUser[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const result = await apiRequest<UserPage>(
      `/users?page=${page}&perPage=100`,
    );
    owners.push(
      ...result.items.filter(
        (user) => user.role === "ROLE_ADMIN" && user.accountStatus === "ACTIVE",
      ),
    );
    totalPages = result.totalPages;
    page++;
  } while (page <= totalPages);
  return owners;
}
export const createTenant = (input: { name: string; ownerId: string }) =>
  apiRequest<Tenant>("/tenants", {
    method: "POST",
    body: JSON.stringify(input),
  });
export const updateTenant = (
  id: string,
  input: { name?: string; status?: Tenant["status"]; reason?: string },
) =>
  apiRequest<Tenant>(`/tenants/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
export const createBranch = (
  id: string,
  input: { name: string; phone: string; document: string; segment: string },
) =>
  apiRequest<Branch>(`/tenants/${encodeURIComponent(id)}/stores`, {
    method: "POST",
    body: JSON.stringify(input),
  });
export const updateUser = (
  id: string,
  input: {
    name?: string;
    email?: string;
    role?: string;
    accountStatus?: string;
  },
) =>
  apiRequest<CurrentUser>(`/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
export const createAdmin = (input: {
  name: string;
  email: string;
  password: string;
}) =>
  apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({ ...input, role: "ROLE_ADMIN" }),
  });
