import { apiRequest } from "@/src/shared/api/http-client";

export type CurrentUser = {
  accountStatus: string;
  createdAt: string;
  email: string;
  id: string;
  name: string;
  role: string;
  updatedAt: string;
};

export function getCurrentUser() {
  return apiRequest<CurrentUser>("/auth/me");
}
