import { getRouteApi } from "@tanstack/react-router";
import { Page } from "#/components/custom/page";
import { SignupForm } from "#/features/auth/components/signup-form";

const routeApi = getRouteApi("/signup");

export function SignupPage() {
  const { google } = routeApi.useLoaderData();

  return (
    <Page width="sm" className="py-20 md:py-28">
      <SignupForm googleEnabled={google} />
    </Page>
  );
}
