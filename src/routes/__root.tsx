import { Suspense } from "react";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";

import { Devtools } from "#/components/devtools";
import { Header } from "#/components/layout/header";
import { RootDocument } from "#/components/layout/root-document";
import { RootErrorPage, RootNotFoundPage } from "#/components/pages/error";
import { getCurrentUser } from "#/features/auth/session";
import { logger } from "#/lib/logger";
// oxlint-disable-next-line import/no-unassigned-import
import "../globals.css";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  /**
   * The one place the session is resolved, once per navigation, for every route — `_authenticated`
   * narrows what lands here rather than fetching it again. The header reads it from context, so
   * the signed-in nav is part of the SSR markup instead of appearing a moment after hydration.
   * A failed lookup is not a sign-out: public routes keep running with a signed-out nav, and the
   * `sessionLookupFailed` flag lets `_authenticated` fail loudly instead of redirecting to a
   * /login whose own session lookup would also fail.
   */
  beforeLoad: async () => {
    try {
      return { user: await getCurrentUser() };
    } catch (error) {
      logger.error("Session lookup failed; public routes degrade to signed-out", { error });
      return { user: null, sessionLookupFailed: true };
    }
  },
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        // One tag only: the head manager dedupes metas by `name`, so a media-scoped pair
        // renders as just the last one. Light matches the default theme until next-themes
        // is given a meta-sync of its own.
        name: "theme-color",
        content: "#fcfcfc",
      },
      {
        name: "color-scheme",
        content: "light dark",
      },
      {
        title: "TanStack Start Template",
      },
    ],
    links: [
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
    ],
  }),
  component: () => (
    <RootDocument>
      <Header />
      <Outlet />
      {import.meta.env.DEV && (
        <Suspense fallback={null}>
          <Devtools />
        </Suspense>
      )}
    </RootDocument>
  ),
  errorComponent: RootErrorPage,
  notFoundComponent: RootNotFoundPage,
});
