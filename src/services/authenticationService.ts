import { API_BASE_URL, fetchWrapper } from "./serviceWrapper";

// Frontend-defined contract; the Java backend will implement it.
export type LoginRequest = {
  email: string;
  password: string;
};

// Placeholder: Phase 2 replaces this with the cookie-based auth contract.
export async function signIn(credentials: LoginRequest) {
  return fetchWrapper<string | undefined>(() =>
    fetch(`${API_BASE_URL}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    }),
  );
}
