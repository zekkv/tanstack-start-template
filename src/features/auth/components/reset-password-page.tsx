import { getRouteApi } from "@tanstack/react-router";
import { Page } from "#/components/custom/page";
import { ResetPasswordForm } from "#/features/auth/components/reset-password-form";

const routeApi = getRouteApi("/reset-password");

/** Router-facing: `token`/`error` arrive from the emailed reset link. */
export function ResetPasswordPage() {
  const { token, error } = routeApi.useSearch();

  return <ResetPasswordView token={token} error={error} />;
}

/** Presentational: takes what it needs; renders without a router. */
export function ResetPasswordView({ token, error }: { token?: string; error?: string }) {
  return (
    <Page width="sm" className="py-20 md:py-28">
      <ResetPasswordForm token={token} error={error} />
    </Page>
  );
}
