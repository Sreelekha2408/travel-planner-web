import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../services/serviceWrapper";
import { renderWithProviders } from "../../test/renderWithProviders";
import SignInForm from "./SignInForm";

// Queries use labels and roles (what a user sees), not CSS classes or test ids.
const emailInput = () => screen.getByLabelText("Email address");
const passwordInput = () => screen.getByLabelText("Password");
const submitButton = () => screen.getByRole("button", { name: "Sign in" });

describe("SignInForm", () => {
  it("shows required-field errors and doesn't call signIn when submitted empty", async () => {
    const user = userEvent.setup();
    const { authValue } = renderWithProviders(<SignInForm />);

    await user.click(submitButton());

    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(authValue.signIn).not.toHaveBeenCalled();
  });

  it("rejects an invalid email address", async () => {
    const user = userEvent.setup();
    const { authValue } = renderWithProviders(<SignInForm />);

    await user.type(emailInput(), "not-an-email");
    await user.type(passwordInput(), "secret123");
    await user.click(submitButton());

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(authValue.signIn).not.toHaveBeenCalled();
  });

  it("calls signIn with the email, password and 'Keep me signed in' choice", async () => {
    const user = userEvent.setup();
    const { authValue } = renderWithProviders(<SignInForm />);

    await user.type(emailInput(), "maya@example.com");
    await user.type(passwordInput(), "secret123");
    await user.click(screen.getByLabelText("Keep me signed in on this device"));
    await user.click(submitButton());

    expect(authValue.signIn).toHaveBeenCalledWith({ email: "maya@example.com", password: "secret123", rememberMe: true });
  });

  it("shows a friendly message when the server rejects the credentials (401)", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignInForm />, { signIn: vi.fn().mockRejectedValue(new ApiError(401, "Invalid email or password")) });

    await user.type(emailInput(), "maya@example.com");
    await user.type(passwordInput(), "wrong-password");
    await user.click(submitButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password.");
  });

  it("shows a connection message when the request fails without a response", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignInForm />, { signIn: vi.fn().mockRejectedValue(new TypeError("Failed to fetch")) });

    await user.type(emailInput(), "maya@example.com");
    await user.type(passwordInput(), "secret123");
    await user.click(submitButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("Can't reach the server");
  });
});
