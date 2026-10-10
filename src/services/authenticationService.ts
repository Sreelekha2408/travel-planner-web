import { apiFetch } from "./serviceWrapper";

// Frontend-defined contract; the Java backend implements it (see docs/AUTH.md).
export type User = {
  id: number;
  email: string;
  name: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

// On success the server sets the HttpOnly auth cookie and returns the user.
export function signIn(credentials: LoginRequest) {
  return apiFetch<User>("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

// The cookie is unreadable from JS, so "am I logged in?" is answered by the server.
export function getCurrentUser() {
  return apiFetch<User>("/auth/me");
}

// Only the server can clear an HttpOnly cookie.
export function signOut() {
  return apiFetch<void>("/auth/logout", { method: "POST" });
}
