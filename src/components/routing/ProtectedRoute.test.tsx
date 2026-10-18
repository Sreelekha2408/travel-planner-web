import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { AuthState } from "../../context/useAuth";
import { renderWithProviders } from "../../test/renderWithProviders";
import ProtectedRoute from "./ProtectedRoute";

// A tiny route tree: /signin is public, /dashboard sits behind ProtectedRoute.
function renderAt(route: string, auth: AuthState) {
  return renderWithProviders(
    <Routes>
      <Route path="/signin" element={<h1>Sign-in page</h1>} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<h1>Dashboard page</h1>} />
      </Route>
    </Routes>,
    { route, auth },
  );
}

describe("ProtectedRoute", () => {
  it("shows a spinner, not the page or a redirect, while the session is being checked", () => {
    renderAt("/dashboard", { status: "loading" });

    expect(screen.getByRole("progressbar", { name: "Checking your session" })).toBeInTheDocument();
    expect(screen.queryByText("Dashboard page")).not.toBeInTheDocument();
    expect(screen.queryByText("Sign-in page")).not.toBeInTheDocument();
  });

  it("redirects to /signin when the user is signed out", () => {
    renderAt("/dashboard", { status: "unauthenticated" });

    expect(screen.getByRole("heading", { name: "Sign-in page" })).toBeInTheDocument();
    expect(screen.queryByText("Dashboard page")).not.toBeInTheDocument();
  });

  it("renders the page when the user is signed in", () => {
    renderAt("/dashboard", {
      status: "authenticated",
      user: { userId: 1, username: "maya", email: "maya@example.com", firstName: "Maya", lastName: "Rao" },
    });

    expect(screen.getByRole("heading", { name: "Dashboard page" })).toBeInTheDocument();
  });
});
