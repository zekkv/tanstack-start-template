import { createFileRoute, notFound } from "@tanstack/react-router";
import { SentryExamplePage } from "#/components/pages/sentry-example";
import { createSeoHead } from "#/lib/seo";

export const Route = createFileRoute("/sentry-example")({
  head: () =>
    createSeoHead({
      title: "Sentry Test — TanStack Start Template",
      noindex: true,
    }),
  beforeLoad: () => {
    if (import.meta.env.PROD) {
      throw notFound();
    }
  },
  component: SentryExamplePage,
});
