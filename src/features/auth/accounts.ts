import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";

export const listAccounts = createServerFn({ method: "GET" }).handler(async () => {
  const [{ getRequest }, { auth }] = await Promise.all([
    import("@tanstack/react-start/server"),
    import("#/lib/auth"),
  ]);

  return auth.api.listUserAccounts({ headers: getRequest().headers });
});

export function accountOptions(userId: string) {
  return queryOptions({
    // userId only scopes the cache key — the server derives the list from the session.
    queryKey: ["auth", "accounts", userId],
    queryFn: () => listAccounts(),
    retry: false,
  });
}
