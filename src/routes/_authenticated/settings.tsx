import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "#/features/auth/components/settings-page";
import { accountOptions } from "#/features/auth/accounts";
import { createSeoHead } from "#/lib/seo";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () =>
    createSeoHead({
      title: "Settings — TanStack Start Template",
      noindex: true,
    }),
  loader: async ({ context }) => {
    // Secondary content: prefetch for SSR, but let the component own load failures.
    await context.queryClient.query(accountOptions(context.user.id)).catch(() => undefined);
  },
  component: SettingsPage,
});
