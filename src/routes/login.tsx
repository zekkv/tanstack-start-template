import { createFileRoute, redirect } from "@tanstack/react-router";
import { LoginForm } from "#/features/auth/components/login-form";
import { getCurrentUser } from "#/features/auth/session";
import { getAuthRouteRedirect } from "#/features/auth/session-model";
import { createSeoHead } from "#/lib/seo";

function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-sm px-6 py-20 md:py-28">
      <LoginForm />
    </div>
  );
}

export const Route = createFileRoute("/login")({
  head: () =>
    createSeoHead({
      title: "Sign In — TanStack Start Template",
      noindex: true,
    }),
  beforeLoad: async () => {
    const redirectTo = getAuthRouteRedirect(await getCurrentUser());

    if (redirectTo) {
      throw redirect({ to: redirectTo });
    }
  },
  component: LoginPage,
});
