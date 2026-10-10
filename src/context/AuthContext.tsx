import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import * as authService from "../services/authenticationService";
import type { LoginRequest } from "../services/authenticationService";
import { queryClient } from "../services/queryClient";
import { setUnauthorizedHandler } from "../services/serviceWrapper";
import { AuthContext, type AuthState } from "./useAuth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    // StrictMode runs effects twice in dev; `ignore` drops the stale response.
    let ignore = false;
    // The HttpOnly cookie is invisible to JS, so ask the server who we are.
    // This also restores the session after a page refresh.
    authService
      .getCurrentUser()
      .then((user) => {
        if (!ignore) setState({ status: "authenticated", user });
      })
      .catch(() => {
        if (!ignore) setState({ status: "unauthenticated" });
      });

    // Any 401 later on (e.g. the cookie expired) logs the user out everywhere.
    setUnauthorizedHandler(() => setState({ status: "unauthenticated" }));

    return () => {
      ignore = true;
      setUnauthorizedHandler(null);
    };
  }, []);

  const signIn = useCallback(async (credentials: LoginRequest) => {
    const user = await authService.signIn(credentials);
    setState({ status: "authenticated", user });
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authService.signOut();
    } finally {
      // Even if the request fails, don't leave the UI looking logged in, and drop
      // cached data (e.g. trips) so the next user can't see it.
      queryClient.clear();
      setState({ status: "unauthenticated" });
    }
  }, []);

  const value = useMemo(() => ({ ...state, signIn, signOut }), [state, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
