// "/api" is proxied to Spring Boot by the Vite dev server. `||` (not `??`) so an
// empty VITE_API_URL also falls back.
export const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

// Double-submit CSRF: the server sets a readable XSRF-TOKEN cookie and expects the same
// value back in this header on state-changing requests. These are Spring Security's defaults.
const CSRF_COOKIE = "XSRF-TOKEN";
const CSRF_HEADER = "X-XSRF-TOKEN";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Lets AuthProvider react to an expired session from any request, without every
// caller handling 401 itself.
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

function readCookie(name: string): string | undefined {
  const match = document.cookie.split("; ").find((cookie) => cookie.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

// Reads the body once as text so empty responses (e.g. 204) don't crash JSON parsing.
async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  const isJson = response.headers.get("Content-Type")?.includes("application/json");
  return isJson ? JSON.parse(text) : text;
}

function getErrorMessage(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const { message } = body as { message?: unknown };
  return typeof message === "string" && message ? message : undefined;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);

  if (typeof init.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!SAFE_METHODS.has(method)) {
    const csrfToken = readCookie(CSRF_COOKIE);
    if (csrfToken) headers.set(CSRF_HEADER, csrfToken);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    method,
    headers,
    // Send and accept cookies. Same-origin requests do this by default; "include" also
    // covers a cross-origin VITE_API_URL. The auth cookie itself is HttpOnly: JS never sees it.
    credentials: "include",
  });
  const body = await parseBody(response);

  if (!response.ok) {
    if (response.status === 401) onUnauthorized?.();
    throw new ApiError(response.status, getErrorMessage(body) ?? "Request failed");
  }
  // Trust boundary: the caller declares the expected shape; there is no runtime validation.
  return body as T;
}
