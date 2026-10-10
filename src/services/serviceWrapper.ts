export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const defaultMessages: Record<number, string> = {
  401: "Unauthorized",
  403: "Forbidden",
};

// Reads the body once as text so empty responses (e.g. 204) don't crash JSON parsing,
// and plain-text responses (the login endpoint returns the raw JWT) still work.
async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  const isJson = response.headers.get("Content-Type")?.includes("application/json");
  return isJson ? JSON.parse(text) : text;
}

// Spring Boot error bodies look like { status, error, message, path }; `message` is often empty.
function getErrorMessage(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const { message, error } = body as { message?: unknown; error?: unknown };
  if (typeof message === "string" && message) return message;
  if (typeof error === "string" && error) return error;
  return undefined;
}

export async function fetchWrapper<T>(call: () => Promise<Response>): Promise<T> {
  const response = await call();
  const body = await parseBody(response);
  if (!response.ok) {
    const message = getErrorMessage(body) ?? defaultMessages[response.status] ?? "Request failed";
    throw new ApiError(response.status, message);
  }
  // Trust boundary: the caller declares the expected shape; there is no runtime validation.
  return body as T;
}
