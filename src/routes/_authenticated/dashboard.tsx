import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "#/features/dashboard/components/page";
import { listNotes } from "#/features/notes/server-fns";
import { createSeoHead } from "#/lib/seo";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () =>
    createSeoHead({
      title: "Dashboard — TanStack Start Template",
      noindex: true,
    }),
  loader: async () => {
    const notes = await listNotes();
    return { notes };
  },
  component: DashboardPage,
});
