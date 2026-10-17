import { createLazyFileRoute } from "@tanstack/react-router";

import { SettingsPageSkeleton, SettingsRoutePage } from "#/features/auth/components/settings-page";

/**
 * Settings is behind a dynamic import for the same reason as the dashboard: its dialogs and
 * account panels should not ride in the entry chunk. The route file keeps the loader and head.
 */
export const settingsLazyRoute = createLazyFileRoute("/_authenticated/settings")({
  pendingComponent: SettingsPageSkeleton,
  component: SettingsRoutePage,
});
