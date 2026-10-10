export async function fetchWrapper(call: any) {
  try {
    const response = await call();
    if(!response.ok) {
      if(response.status == 401) {
        throw new Error("UnAuthorized")
      }
      if (response.status === 403) {
        throw new Error("Forbidden");
      }

      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || "Request failed");

    }
  return await response.json();
  } catch (e: any) {
    throw e;
  }
}