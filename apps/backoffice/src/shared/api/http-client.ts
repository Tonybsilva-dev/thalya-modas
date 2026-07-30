import { type NormalizedApiError, normalizeApiErrorPayload } from "./api-error";
import {
  clearLastStoreCookie,
  getLastStoreFromCookie,
  saveLastStoreCookie,
  type LastStore,
} from "../store/last-store-cookie";

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
const activeStoreHeaderName = "X-Store-Id";

export async function apiRequest<TResponse>(
  path: string,
  init: RequestInit = {},
): Promise<TResponse> {
  const headers = new Headers(init.headers);
  const activeStore = getActiveStore();

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!headers.has(activeStoreHeaderName) && activeStore) {
    headers.set(activeStoreHeaderName, activeStore.id);
  }

  let response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });
  let payload = await readResponsePayload(response);

  if (
    activeStore &&
    headers.has(activeStoreHeaderName) &&
    isStaleStoreResponse(response, payload, activeStore.id)
  ) {
    const retryHeaders = new Headers(headers);
    retryHeaders.delete(activeStoreHeaderName);
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      credentials: "include",
      headers: retryHeaders,
    });
    payload = await readResponsePayload(response);

    if (response.ok) {
      synchronizeActiveStore(response, activeStore);
    } else {
      clearLastStoreCookie();
    }
  }

  if (!response.ok) {
    throw new ApiRequestError(response.status, normalizeApiErrorPayload(response.status, payload));
  }

  return payload as TResponse;
}

async function readResponsePayload(response: Response) {
  const contentType = response.headers.get("content-type");
  return contentType?.includes("application/json")
    ? ((await response.json()) as unknown)
    : undefined;
}

function getActiveStore() {
  if (typeof document === "undefined") {
    return null;
  }

  return getLastStoreFromCookie(document.cookie);
}

function isStaleStoreResponse(
  response: Response,
  payload: unknown,
  activeStoreId: string,
) {
  if (response.status !== 403 || !payload || typeof payload !== "object") {
    return false;
  }

  const problem = payload as {
    details?: { storeId?: unknown };
    error?: unknown;
  };
  return (
    problem.error === "ForbiddenError" &&
    problem.details?.storeId === activeStoreId
  );
}

function synchronizeActiveStore(response: Response, activeStore: LastStore) {
  const resolvedStoreId = response.headers.get(activeStoreHeaderName);
  if (resolvedStoreId) {
    saveLastStoreCookie({ ...activeStore, id: resolvedStoreId });
  } else {
    clearLastStoreCookie();
  }
}
