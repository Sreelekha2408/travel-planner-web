import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./serviceWrapper";

// One shared cache for the whole app. Exported (not created inside a component) so
// AuthProvider can clear it on sign-out and the next user never sees cached data.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retrying a 4xx (not found, unauthorized, validation) can't succeed; retry
      // network errors and 5xx once.
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status < 500) && failureCount < 1,
      staleTime: 30_000,
    },
  },
});
