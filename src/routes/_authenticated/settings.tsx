import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "#/features/auth/components/settings-page";
import { createSeoHead } from "#/lib/seo";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () =>
    createSeoHead({
      title: "Settings — TanStack Start Template",
      noindex: true,
    }),
  component: SettingsPage,
});
