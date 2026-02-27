import axios, { AxiosError } from "axios";
import { API_BASE_URL } from "@/config/api";
import type { ApiFailure, ApiResponse } from "@/contracts";

const TRANSIENT_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

export interface ApiError extends Error {
  code: string;
  status: number;
  safeMessage: string;
  retryable: boolean;
  details?: unknown;
}

interface ApiRequestOptions<TBody> {
  path: string;
  method?: "get" | "post" | "put" | "patch" | "delete";
  data?: TBody;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  retries?: number;
  retryUnsafe?: boolean;
}

interface ApiClientHandlers {
  onUnauthorized?: (error: ApiError) => void;
  onRequestError?: (error: ApiError) => void;
}

let handlers: ApiClientHandlers = {};

const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 12_000,
});

function isApiFailure(payload: unknown): payload is ApiFailure {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      "success" in payload &&
      (payload as { success?: boolean }).success === false,
  );
}

function isApiSuccess<T>(payload: unknown): payload is { success: true; data: T } {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      "success" in payload &&
      (payload as { success?: boolean }).success === true &&
      "data" in (payload as Record<string, unknown>),
  );
}

function toSafeMessage(status: number, fallback: string) {
  if (status === 401) {
    return "Your session has expired. Please log in again.";
  }

  if (status >= 500) {
    return "Service is temporarily unavailable. Please try again shortly.";
  }

  if (status === 0) {
    return "Network connection issue. Please check your connection and retry.";
  }

  return fallback;
}

function toApiError(error: unknown): ApiError {
  if (error instanceof Error && "code" in error && "status" in error && "safeMessage" in error) {
    return error as ApiError;
  }

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse<unknown> | Record<string, unknown>>;
    const status = axiosError.response?.status ?? 0;
    const payload = axiosError.response?.data;
    const fallbackMessage = "Request failed";

    let code = "REQUEST_FAILED";
    let message = fallbackMessage;

    if (isApiFailure(payload)) {
      code = payload.error.code;
      message = payload.error.message;
    } else if (payload && typeof payload === "object" && "message" in payload) {
      const maybeMessage = (payload as { message?: unknown }).message;
      if (typeof maybeMessage === "string" && maybeMessage.trim().length > 0) {
        message = maybeMessage;
      }
    } else if (axiosError.message) {
      message = axiosError.message;
    }

    const retryable = status === 0 || TRANSIENT_STATUS_CODES.has(status);

    return Object.assign(new Error(message), {
      code,
      status,
      safeMessage: toSafeMessage(status, message),
      retryable,
      details: payload,
    } satisfies Omit<ApiError, "name" | "message">);
  }

  const message = error instanceof Error ? error.message : "Unexpected request error";
  return Object.assign(new Error(message), {
    code: "UNEXPECTED_ERROR",
    status: 0,
    safeMessage: toSafeMessage(0, message),
    retryable: true,
    details: undefined,
  } satisfies Omit<ApiError, "name" | "message">);
}

function isIdempotentMethod(method: string) {
  return method === "get" || method === "head" || method === "options";
}

function shouldRetry(error: ApiError, attempt: number, maxRetries: number) {
  return attempt < maxRetries && error.retryable;
}

function waitFor(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function parseResponse<TResponse>(payload: unknown): Promise<TResponse> {
  if (isApiFailure(payload)) {
    throw Object.assign(new Error(payload.error.message), {
      code: payload.error.code,
      status: 400,
      safeMessage: toSafeMessage(400, payload.error.message),
      retryable: false,
      details: payload,
    } satisfies Omit<ApiError, "name" | "message">);
  }

  if (isApiSuccess<TResponse>(payload)) {
    return payload.data;
  }

  return payload as TResponse;
}

async function request<TResponse, TBody = unknown>(
  options: ApiRequestOptions<TBody>,
): Promise<TResponse> {
  const method = options.method ?? "get";
  const maxRetries =
    options.retries ?? (isIdempotentMethod(method) || options.retryUnsafe ? 2 : 0);

  let attempt = 0;

  while (true) {
    try {
      const response = await http.request({
        method,
        url: options.path,
        data: options.data,
        params: options.params,
        headers: options.headers,
        signal: options.signal,
      });

      return await parseResponse<TResponse>(response.data);
    } catch (error) {
      const parsed = toApiError(error);

      if (parsed.status === 401 && parsed.code === "UNAUTHORIZED" && handlers.onUnauthorized) {
        handlers.onUnauthorized(parsed);
      }

      if (!shouldRetry(parsed, attempt, maxRetries)) {
        if (handlers.onRequestError) {
          handlers.onRequestError(parsed);
        }
        throw parsed;
      }

      attempt += 1;
      await waitFor(250 * attempt);
    }
  }
}

export function configureApiClient(nextHandlers: ApiClientHandlers) {
  handlers = { ...nextHandlers };

  return () => {
    handlers = {};
  };
}

export function parseApiError(error: unknown): ApiError {
  return toApiError(error);
}

export const apiClient = {
  request,
  get: <TResponse>(path: string, params?: Record<string, unknown>) =>
    request<TResponse>({ path, method: "get", params }),
  post: <TResponse, TBody = unknown>(path: string, data?: TBody) =>
    request<TResponse, TBody>({ path, method: "post", data }),
  put: <TResponse, TBody = unknown>(path: string, data?: TBody) =>
    request<TResponse, TBody>({ path, method: "put", data }),
  patch: <TResponse, TBody = unknown>(path: string, data?: TBody) =>
    request<TResponse, TBody>({ path, method: "patch", data }),
  delete: <TResponse>(path: string) => request<TResponse>({ path, method: "delete" }),
};
