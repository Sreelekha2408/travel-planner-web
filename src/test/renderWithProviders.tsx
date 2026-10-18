import { ThemeProvider } from "@mui/material";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { theme } from "../common/theme";
import { AuthContext, type AuthContextValue, type AuthState } from "../context/useAuth";

type Options = {
  auth?: AuthState;
  route?: string;
  signIn?: AuthContextValue["signIn"]; // e.g. a mock that rejects, to test error handling
};

// Renders a component with the app's theme, an in-memory router and a fake auth
// context. signIn/signOut are Vitest mocks, so tests can assert how they were called
// (or make them fail) without any network.
export function renderWithProviders(
  ui: ReactElement,
  { auth = { status: "unauthenticated" }, route = "/", signIn = vi.fn().mockResolvedValue(undefined) }: Options = {},
) {
  const authValue: AuthContextValue = {
    ...auth,
    signIn,
    signOut: vi.fn().mockResolvedValue(undefined),
  };

  const result = render(
    <ThemeProvider theme={theme}>
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </AuthContext.Provider>
    </ThemeProvider>,
  );
  return { ...result, authValue };
}
