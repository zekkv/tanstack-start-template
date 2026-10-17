import { createFileRoute } from "@tanstack/react-router";
import { noteOptions } from "#/features/notes/server-fns";
import { createSeoHead } from "#/lib/seo";

export const Route = createFileRoute("/_authenticated/dashboard")({
  // Prefetch notes into the query cache so the SSR markup ships with data; a failed fetch
  // surfaces here (same as awaiting the server fn directly) instead of blank content.
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(noteOptions());
  },
  head: () =>
    createSeoHead({
      title: "Dashboard — TanStack Start Template",
      noindex: true,
    }),
  // The view is a dynamic import: see src/features/dashboard/components/lazy-route.ts.
}).lazy(() =>
  import("#/features/dashboard/components/lazy-route").then(module => module.dashboardLazyRoute)
);
