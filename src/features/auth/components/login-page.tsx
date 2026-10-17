import { getRouteApi } from "@tanstack/react-router";
import { Page } from "#/components/custom/page";
import { LoginForm } from "#/features/auth/components/login-form";

const routeApi = getRouteApi("/login");

export function LoginPage() {
  const { google } = routeApi.useLoaderData();

  return (
    <Page width="sm" className="py-20 md:py-28">
      <LoginForm googleEnabled={google} />
    </Page>
  );
}
