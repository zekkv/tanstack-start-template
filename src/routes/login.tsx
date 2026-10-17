import { createFileRoute, redirect } from "@tanstack/react-router";
import { LoginPage } from "#/features/auth/components/login-page";
import { getAuthProviders } from "#/features/auth/accounts";
import { createSeoHead } from "#/lib/seo";

export const Route = createFileRoute("/login")({
  beforeLoad: ({ context }) => {
    if (context.user) {
      throw redirect({ to: "/dashboard" });
    }
  },
  loader: () => getAuthProviders(),
  head: () =>
    createSeoHead({
      title: "Sign In — TanStack Start Template",
      noindex: true,
    }),
  component: LoginPage,
});
