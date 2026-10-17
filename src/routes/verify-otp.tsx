import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { VerifyOtpPage } from "#/features/auth/components/verify-otp-page";
import { createSeoHead } from "#/lib/seo";

export const Route = createFileRoute("/verify-otp")({
  // Optional here, enforced in `beforeLoad`: validation that throws dumps raw Zod JSON onto the
  // error page, so the schema accepts anything and exactness is checked where a redirect is
  // still a normal navigation.
  validateSearch: z.object({
    email: z.email().optional(),
    flow: z.enum(["sign-in", "sign-up"]).optional(),
  }),
  beforeLoad: ({ search }) => {
    if (!search.email || !search.flow) {
      throw redirect({ to: "/login" });
    }
  },
  head: () =>
    createSeoHead({
      title: "Verify Code — TanStack Start Template",
      noindex: true,
    }),
  component: VerifyOtpPage,
});
