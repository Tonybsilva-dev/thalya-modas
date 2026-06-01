import { apiRequest } from "@/src/shared/api/http-client";

export type LoginInput = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export type LoginResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    accountStatus: string;
  };
  expiresIn: number;
  token: string;
};

export function login(input: LoginInput) {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
