import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { authClient } from "#/lib/auth-client";

/** The OTP entry points: /login requests a sign-in flow, /signup a sign-up flow. */
export type OtpFlow = "sign-in" | "sign-up";

/**
 * The "email me a code" path shared by /login and /signup: the address the form collected is
 * validated before the server sees it (the button is reachable with an empty form), the code is
 * sent, and the visit lands on /verify-otp with the flow, so only sign-ups see the passkey
 * prompt afterwards. Both flows send a `sign-in` type — the user signs in first and verifies
 * email ownership from the panel they are handed next.
 */
export function useOtpCode(flow: OtpFlow, onError: (message: string) => void) {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (email: string) => {
      if (!z.email().safeParse(email).success) {
        throw new Error("Enter a valid email address to receive a code.");
      }
      const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
      if (error) throw new Error(error.message ?? "Failed to send code. Try again.");
    },
    onSuccess: (_data, email) => navigate({ to: "/verify-otp", search: { email, flow } }),
    onError: error => onError(error.message),
  });
}
