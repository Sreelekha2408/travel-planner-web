import { fetchWrapper } from "./serviceWrapper";

export async function signIn(data: any) {
  return fetchWrapper(async () => {
    return fetch("/signIn", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  });
}
