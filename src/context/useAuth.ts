import { createContext, useContext } from "react";
import type { LoginRequest, User } from "../services/authenticationService";

// One status field instead of `user` + `isLoading` makes impossible combinations
// unrepresentable, and narrows `user` to non-null when authenticated.
export type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; user: User };

export type AuthContextValue = AuthState & {
  signIn: (credentials: LoginRequest) => Promise<void>;
  signOut: () => Promise<void>;
};

// Lives outside AuthContext.tsx because Fast Refresh needs component files to export only components.
export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
