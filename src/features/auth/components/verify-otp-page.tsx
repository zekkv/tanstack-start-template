import { getRouteApi } from "@tanstack/react-router";
import { Page } from "#/components/custom/page";
import { VerifyOtpForm } from "#/features/auth/components/verify-otp";
import type { OtpFlow } from "#/features/auth/components/use-otp-code";

const routeApi = getRouteApi("/verify-otp");

/**
 * Router-facing: reads the search params the route validated. `/verify-otp` without `email` and
 * `flow` never reaches a render — the route's `beforeLoad` redirects to /login — but the
 * validated type keeps them optional, so the guard stays.
 */
export function VerifyOtpPage() {
  const { email, flow } = routeApi.useSearch();

  if (!email || !flow) return null;

  return <VerifyOtpView email={email} flow={flow} />;
}

/** Presentational: takes what it needs; renders without a router. */
export function VerifyOtpView({ email, flow }: { email: string; flow: OtpFlow }) {
  return (
    <Page width="sm" className="py-20 md:py-28">
      <VerifyOtpForm email={email} flow={flow} />
    </Page>
  );
}
