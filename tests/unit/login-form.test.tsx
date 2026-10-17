import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginForm } from "#/features/auth/components/login-form";

// Mock TanStack Router hooks and components
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => vi.fn<() => void>(),
}));

// Toast feedback comes straight from sonner, not the form state
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn<(message: string) => void>(),
    success: vi.fn<(message: string) => void>(),
  },
}));

// Mock better-auth client
vi.mock("#/lib/auth-client", () => ({
  authClient: {
    signIn: {
      email: vi
        .fn<() => Promise<{ data: null; error: null }>>()
        .mockResolvedValue({ data: null, error: null }),
      passkey: vi
        .fn<() => Promise<{ data: null; error: null }>>()
        .mockResolvedValue({ data: null, error: null }),
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

/** The WebAuthn probe the form guards; resolved per test. */
const isConditionalMediationAvailable = vi.fn<() => Promise<boolean>>().mockResolvedValue(false);

// Mock PublicKeyCredential for jsdom environment
if (typeof globalThis.PublicKeyCredential === "undefined") {
  Object.defineProperty(globalThis, "PublicKeyCredential", {
    value: { isConditionalMediationAvailable },
    configurable: true,
  });
}

function renderForm({ googleEnabled = true }: { googleEnabled?: boolean } = {}) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <LoginForm googleEnabled={googleEnabled} />
    </QueryClientProvider>
  );
}

describe("LoginForm component", () => {
  it("renders email and password inputs plus submission controls", () => {
    renderForm();

    expect(screen.getByText("Welcome back")).toBeTruthy();
    expect(screen.getByLabelText(/email/i)).toBeTruthy();
    expect(screen.getByLabelText(/password/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /^sign in$/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /email me a sign-in code/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /sign in with passkey/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeTruthy();
  });

  it("hides the Google option when Google is not configured", () => {
    renderForm({ googleEnabled: false });

    expect(screen.queryByRole("button", { name: /continue with google/i })).toBeNull();
  });

  it("shows validation error for invalid email on submit", async () => {
    renderForm();

    const emailInput = screen.getByLabelText(/email/i);
    // `a@b` passes the browser's own `type="email"` constraint (which blocks submission in a
    // browser), and fails the app's Zod schema — the error the form is expected to surface.
    fireEvent.change(emailInput, { target: { value: "a@b" } });

    fireEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() => {
      expect(emailInput.getAttribute("aria-invalid")).toBe("true");
      expect(screen.getByText("Enter a valid email address")).toBeTruthy();
    });
  });

  it("signs in with email and password", async () => {
    const { authClient } = await import("#/lib/auth-client");
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "correct-horse");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() => {
      expect(authClient.signIn.email).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "correct-horse",
      });
    });
  });

  it("displays server error when password sign-in fails", async () => {
    const { authClient } = await import("#/lib/auth-client");
    vi.mocked(authClient.signIn.email).mockResolvedValueOnce({
      data: null,
      error: { message: "Invalid email or password", status: 401 } as never,
    });

    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrong-password");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password")).toBeTruthy();
    });
  });

  it("calls sendVerificationOtp when requesting a sign-in code", async () => {
    const { authClient } = await import("#/lib/auth-client");
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.click(screen.getByRole("button", { name: /email me a sign-in code/i }));

    await waitFor(() => {
      expect(authClient.emailOtp.sendVerificationOtp).toHaveBeenCalledWith({
        email: "test@example.com",
        type: "sign-in",
      });
    });
  });

  it("does not request a code without a valid email", async () => {
    const { authClient } = await import("#/lib/auth-client");
    vi.mocked(authClient.emailOtp.sendVerificationOtp).mockClear();
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/email/i), "nope");
    await user.click(screen.getByRole("button", { name: /email me a sign-in code/i }));

    await waitFor(() => {
      expect(screen.getByText(/enter a valid email address to receive a code/i)).toBeTruthy();
    });
    expect(authClient.emailOtp.sendVerificationOtp).not.toHaveBeenCalled();
  });

  it("displays server error when requesting a sign-in code fails", async () => {
    const { authClient } = await import("#/lib/auth-client");
    vi.mocked(authClient.emailOtp.sendVerificationOtp).mockResolvedValueOnce({
      data: null,
      error: {
        message: "Too many requests",
        status: 429,
        statusText: "Too Many Requests",
      } as never,
    });

    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.click(screen.getByRole("button", { name: /email me a sign-in code/i }));

    await waitFor(() => {
      expect(screen.getByText("Too many requests")).toBeTruthy();
    });
  });

  it("reports a refused Google sign-in as a toast instead of dropping it", async () => {
    const { authClient } = await import("#/lib/auth-client");
    vi.mocked(authClient.signIn.social).mockResolvedValueOnce({
      data: null,
      error: {
        message: "Provider not configured",
        status: 503,
        statusText: "Unavailable",
      } as never,
    });

    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: /continue with google/i }));

    expect(authClient.signIn.social).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/",
    });
    const { toast } = await import("sonner");
    expect(toast.error).toHaveBeenCalledWith("Provider not configured");
  });

  it("starts passkey autofill only after the email field is first focused", async () => {
    const { authClient } = await import("#/lib/auth-client");
    isConditionalMediationAvailable.mockResolvedValue(true);
    const user = userEvent.setup();
    renderForm();

    // Nothing fires on a bare page view: the passkey endpoint is only touched on engagement.
    expect(authClient.signIn.passkey).not.toHaveBeenCalled();

    await user.click(screen.getByLabelText(/email/i));

    await waitFor(() => {
      expect(authClient.signIn.passkey).toHaveBeenCalledWith(
        expect.objectContaining({ autoFill: true })
      );
    });

    // One-shot: focussing again does not re-poll.
    await user.click(screen.getByLabelText(/email/i));
    await waitFor(() => {
      expect(authClient.signIn.passkey).toHaveBeenCalledTimes(1);
    });
  });
});
