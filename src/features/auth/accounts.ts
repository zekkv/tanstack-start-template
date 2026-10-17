import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";

import { requireSession, withSession } from "#/features/auth/session";

export const listAccounts = createServerFn({ method: "GET" })
  .middleware([requireSession])
  .handler(async () => {
    const [{ getRequest }, { auth }] = await Promise.all([
      import("@tanstack/react-start/server"),
      import("#/lib/auth.server"),
    ]);

    return auth.api.listUserAccounts({ headers: getRequest().headers });
  });

/**
 * Session-optional: the login page asks this before anyone signs in, so a signed-out visitor is
 * the caller, not a refusal case.
 */
export const getAuthProviders = createServerFn({ method: "GET" })
  .middleware([withSession])
  .handler(async () => {
    const { env } = await import("#/env");
    return { google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) };
  });

export function accountOptions(userId: string) {
  return queryOptions({
    // userId only scopes the cache key — the server derives the list from the session.
    queryKey: ["auth", "accounts", userId],
    queryFn: () => listAccounts(),
    retry: false,
  });
}
