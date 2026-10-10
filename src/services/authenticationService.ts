import { fetchWrapper } from "./serviceWrapper";

// Matches UserLoginRequest in the Spring Boot API.
export type LoginRequest = {
  username: string;
  password: string;
};

// The API responds with the JWT as plain text. On bad credentials it currently
// returns 200 with an empty body, which parses to undefined.
export async function signIn(credentials: LoginRequest) {
  return fetchWrapper<string | undefined>(() =>
    fetch("/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    }),
  );
}
