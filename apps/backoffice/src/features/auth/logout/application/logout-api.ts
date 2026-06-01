import { apiRequest } from "@/src/shared/api/http-client";

export type LogoutResponse = {
  success: true;
};

export function logout() {
  return apiRequest<LogoutResponse>("/auth/logout", {
    method: "POST",
  });
}
