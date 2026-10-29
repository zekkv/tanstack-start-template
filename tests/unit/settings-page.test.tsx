import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SettingsPage } from "#/features/auth/components/settings-page";
import type { SessionUser } from "#/features/auth/session";

const mockNavigate = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
const mockInvalidate = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
let mockUser: SessionUser = {
  id: "usr_1",
  email: "alice@example.com",
  emailVerified: false,
};
let mockAccounts: Array<{ id: string; providerId: string }> = [
  { id: "acc_1", providerId: "credential" },
];
let mockAccountsError = false;

vi.mock("@tanstack/react-router", () => ({
  getRouteApi: () => ({
    useRouteContext: () => ({ user: mockUser }),
  }),
  useNavigate: () => mockNavigate,
  useRouter: () => ({ invalidate: mockInvalidate }),
}));

vi.mock("#/features/auth/accounts", () => ({
  accountOptions: () => ({
    queryKey: ["auth", "accounts", "test"],
    queryFn: async () => {
      if (mockAccountsError) throw new Error("Could not load accounts");
      return mockAccounts;
    },
    retry: false,
  }),
}));

vi.mock("#/lib/auth-client", () => ({
  authClient: {
    useListPasskeys: () => ({ data: [], isPending: false }),
    sendVerificationEmail: vi
      .fn<() => Promise<{ data: null; error: null }>>()
      .mockResolvedValue({ data: null, error: null }),
    changePassword: vi
      .fn<() => Promise<{ data: null; error: null }>>()
      .mockResolvedValue({ data: null, error: null }),
    requestPasswordReset: vi
      .fn<() => Promise<{ data: null; error: null }>>()
      .mockResolvedValue({ data: null, error: null }),
    deleteUser: vi
      .fn<() => Promise<{ data: null; error: null }>>()
      .mockResolvedValue({ data: null, error: null }),
    passkey: {
      deletePasskey: vi
        .fn<() => Promise<{ data: null; error: null }>>()
        .mockResolvedValue({ data: null, error: null }),
    },
  },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn<() => void>(), error: vi.fn<() => void>() } }));

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <SettingsPage />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUser = { id: "usr_1", email: "alice@example.com", emailVerified: false };
  mockAccounts = [{ id: "acc_1", providerId: "credential" }];
  mockAccountsError = false;
});

describe("SettingsPage component", () => {
  it("shows an unverified email and sends a verification link", async () => {
    const { authClient } = await import("#/lib/auth-client");
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText("Not verified")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Verify email" }));

    await waitFor(() => {
      expect(authClient.sendVerificationEmail).toHaveBeenCalledWith({
        email: "alice@example.com",
        callbackURL: "/settings",
      });
    });
  });

  it("shows a verified email without the verification button", () => {
    mockUser = { ...mockUser, emailVerified: true };
    renderPage();

    expect(screen.getByText("Verified")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Verify email" })).toBeNull();
  });

  it("refreshes a stale verification status", async () => {
    const { authClient } = await import("#/lib/auth-client");
    const { toast } = await import("sonner");
    vi.mocked(authClient.sendVerificationEmail).mockResolvedValueOnce({
      data: null,
      error: {
        message: "Email is already verified",
        code: "EMAIL_ALREADY_VERIFIED",
        status: 400,
      } as never,
    });

    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Verify email" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Email is already verified");
    });
    expect(mockInvalidate).toHaveBeenCalled();
  });

  it("changes the password with the current one", async () => {
    const { authClient } = await import("#/lib/auth-client");
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    renderPage();

    await user.type(await screen.findByLabelText("Current password"), "OldPassword1!");
    await user.type(screen.getByLabelText("New password"), "NewPassword2!");
    await user.click(screen.getByRole("button", { name: "Update password" }));

    await waitFor(() => {
      expect(authClient.changePassword).toHaveBeenCalledWith({
        currentPassword: "OldPassword1!",
        newPassword: "NewPassword2!",
        revokeOtherSessions: true,
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Password updated. Your other sessions were signed out."
      );
    });
  });

  it("shows the server error when the current password is wrong", async () => {
    const { authClient } = await import("#/lib/auth-client");
    vi.mocked(authClient.changePassword).mockResolvedValueOnce({
      data: null,
      error: { message: "Invalid password", status: 400 } as never,
    });

    const user = userEvent.setup();
    renderPage();

    await user.type(await screen.findByLabelText("Current password"), "WrongPassword1!");
    await user.type(screen.getByLabelText("New password"), "NewPassword2!");
    await user.click(screen.getByRole("button", { name: "Update password" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid password")).toBeTruthy();
    });
  });

  it("enforces the password policy before calling the server", async () => {
    const { authClient } = await import("#/lib/auth-client");
    const user = userEvent.setup();
    renderPage();

    await user.type(await screen.findByLabelText("Current password"), "OldPassword1!");
    await user.type(screen.getByLabelText("New password"), "short");
    await user.click(screen.getByRole("button", { name: "Update password" }));

    await waitFor(() => {
      expect(screen.getByText("Password must be at least 8 characters")).toBeTruthy();
    });
    expect(authClient.changePassword).not.toHaveBeenCalled();
  });

  it("emails a reset link when the current password is unknown", async () => {
    const { authClient } = await import("#/lib/auth-client");
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: "Email me a reset link" }));

    await waitFor(() => {
      expect(authClient.requestPasswordReset).toHaveBeenCalledWith({
        email: "alice@example.com",
        redirectTo: "/reset-password",
      });
    });
  });

  it("offers a set-password link to accounts without a password", async () => {
    mockAccounts = [{ id: "acc_google", providerId: "google" }];
    const { authClient } = await import("#/lib/auth-client");
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    renderPage();

    const button = await screen.findByRole("button", { name: "Email me a set-password link" });
    expect(screen.queryByLabelText("Current password")).toBeNull();

    await user.click(button);

    await waitFor(() => {
      expect(authClient.requestPasswordReset).toHaveBeenCalledWith({
        email: "alice@example.com",
        redirectTo: "/reset-password",
      });
      expect(toast.success).toHaveBeenCalledWith("Set-password link sent. Check your inbox.");
    });
  });

  it("falls back to the set-password link when linked accounts fail to load", async () => {
    mockAccountsError = true;
    renderPage();

    expect(
      await screen.findByRole("button", { name: "Email me a set-password link" })
    ).toBeTruthy();
    expect(screen.getByText(/could not load your linked accounts/i)).toBeTruthy();
    expect(screen.queryByLabelText("Current password")).toBeNull();
  });
});
