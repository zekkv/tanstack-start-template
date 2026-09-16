import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { VerifyOtpPage } from "#/features/auth/components/verify-otp-page";
import { createSeoHead } from "#/lib/seo";

const searchSchema = z.object({
  email: z.email(),
  flow: z.enum(["sign-in", "sign-up"]),
});

export const Route = createFileRoute("/verify-otp")({
  head: () =>
    createSeoHead({
      title: "Verify Code — TanStack Start Template",
      noindex: true,
    }),
  validateSearch: searchSchema,
  component: VerifyOtpPage,
});
