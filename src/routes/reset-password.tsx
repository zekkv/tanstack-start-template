import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ResetPasswordPage } from "#/features/auth/components/reset-password-page";
import { createSeoHead } from "#/lib/seo";

const searchSchema = z.object({
  token: z.string().optional(),
  error: z.string().optional(),
});

export const Route = createFileRoute("/reset-password")({
  head: () =>
    createSeoHead({
      title: "Reset Password — TanStack Start Template",
      noindex: true,
    }),
  validateSearch: searchSchema,
  component: ResetPasswordPage,
});
