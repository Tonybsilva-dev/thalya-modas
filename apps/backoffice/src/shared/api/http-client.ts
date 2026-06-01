export type ApiErrorPayload = {
  error?: string;
  message?: string;
  userMessage?: string;
  traceId?: string;
};

export class ApiRequestError extends Error {
  readonly payload: ApiErrorPayload;
  readonly status: number;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.userMessage ?? payload.message ?? "Unable to complete request.");
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
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const contentType = response.headers.get("content-type");
  const payload = contentType?.includes("application/json")
    ? ((await response.json()) as unknown)
    : undefined;

  if (!response.ok) {
    throw new ApiRequestError(response.status, normalizeErrorPayload(payload));
  }

  return payload as TResponse;
}

function normalizeErrorPayload(payload: unknown): ApiErrorPayload {
  if (!payload || typeof payload !== "object") {
    return { message: "Unable to complete request." };
  }

  return payload as ApiErrorPayload;
}
