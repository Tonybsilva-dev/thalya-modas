import { type NormalizedApiError, normalizeApiErrorPayload } from "./api-error";

export class ApiRequestError extends Error {
  readonly payload: NormalizedApiError;
  readonly status: number;

  constructor(status: number, payload: NormalizedApiError) {
    super(payload.userMessage);
    this.name = "ApiRequestError";
    this.payload = payload;
    this.status = status;
  }
}

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export async function apiRequest<TResponse>(
  path: string,
  init: RequestInit = {},
): Promise<TResponse> {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  const contentType = response.headers.get("content-type");
  const payload = contentType?.includes("application/json")
    ? ((await response.json()) as unknown)
    : undefined;

  if (!response.ok) {
    throw new ApiRequestError(response.status, normalizeApiErrorPayload(response.status, payload));
  }

  return payload as TResponse;
}
