import { apiFetch } from "./serviceWrapper";

// Subset of UserResponseDTO in travel-planner-api (see docs/AUTH.md).
export type User = {
  userId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

// On success the server sets the HttpOnly auth cookie and returns the user.
export function signIn(credentials: LoginRequest) {
  return apiFetch<User>("/users/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

// The cookie is unreadable from JS, so "am I logged in?" is answered by the server.
export function getCurrentUser() {
  return apiFetch<User>("/users/me");
}

// Only the server can clear an HttpOnly cookie.
export function signOut() {
  return apiFetch<void>("/users/logout", { method: "POST" });
}
