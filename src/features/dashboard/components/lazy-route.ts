import { createLazyFileRoute } from "@tanstack/react-router";

import { DashboardPageSkeleton, DashboardRoutePage } from "#/features/dashboard/components/page";

/**
 * The dashboard view lives behind a dynamic import so its components (dialogs, table,
 * upload widget) do not ride in the entry chunk every visitor downloads. The route file
 * keeps the loader and head; these options merge in when the chunk arrives.
 */
export const dashboardLazyRoute = createLazyFileRoute("/_authenticated/dashboard")({
  pendingComponent: DashboardPageSkeleton,
  component: DashboardRoutePage,
});
