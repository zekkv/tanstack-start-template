import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SignupForm } from "#/features/auth/components/signup-form";

const mockNavigate = vi.fn<() => void>();

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => mockNavigate,
}));

vi.mock("#/lib/auth-client", () => ({
  authClient: {
    signIn: {
      social: vi
        .fn<() => Promise<{ data: null; error: null }>>()
        .mockResolvedValue({ data: null, error: null }),
    },
    emailOtp: {
      sendVerificationOtp: vi
        .fn<() => Promise<{ data: null; error: null }>>()
        .mockResolvedValue({ data: null, error: null }),
    },
  },
}));

describe("SignupForm component", () => {
  it("renders email input, create account button, and Google OAuth button", () => {
    render(<SignupForm />);

    expect(screen.getByText("Create an account")).toBeTruthy();
    expect(screen.getByLabelText(/email/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /create account/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeTruthy();
  });

  it("shows validation error when submitting an invalid email", async () => {
    render(<SignupForm />);

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });

    const form = emailInput.closest("form");
    expect(form).toBeTruthy();
    fireEvent.submit(form as HTMLFormElement);

    await waitFor(() => {
      expect(emailInput.getAttribute("aria-invalid")).toBe("true");
      expect(screen.getByRole("alert")).toBeTruthy();
    });
  });

  it("submits valid email and navigates to verify-otp page on success", async () => {
    const { authClient } = await import("#/lib/auth-client");
    const user = userEvent.setup();
    render(<SignupForm />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, "newuser@example.com");

    const submitButton = screen.getByRole("button", { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(authClient.emailOtp.sendVerificationOtp).toHaveBeenCalledWith({
        email: "newuser@example.com",
        type: "sign-in",
      });
      expect(mockNavigate).toHaveBeenCalledWith({
        to: "/verify-otp",
        search: { email: "newuser@example.com", flow: "sign-up" },
      });
    });
  });

  it("displays server error message when sendVerificationOtp fails", async () => {
    const { authClient } = await import("#/lib/auth-client");
    vi.mocked(authClient.emailOtp.sendVerificationOtp).mockResolvedValueOnce({
      data: null,
      error: { message: "Account already exists", status: 400, statusText: "Bad Request" } as never,
    });

    const user = userEvent.setup();
    render(<SignupForm />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, "existing@example.com");

    const submitButton = screen.getByRole("button", { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Account already exists")).toBeTruthy();
    });
  });

  it("triggers Google social sign-in when clicking Continue with Google", async () => {
    const { authClient } = await import("#/lib/auth-client");
    const user = userEvent.setup();
    render(<SignupForm />);

    const googleButton = screen.getByRole("button", { name: /continue with google/i });
    await user.click(googleButton);

    await waitFor(() => {
      expect(authClient.signIn.social).toHaveBeenCalledWith({
        provider: "google",
        callbackURL: "/",
      });
    });
  });
});
