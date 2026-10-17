import { createMiddleware, createServerFn } from "@tanstack/react-start";

import { HttpError, UnauthorizedError } from "#/lib/http-errors";

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

export function getSessionUser(
  session: {
    user?: { id: string; email: string; name?: string | null; image?: string | null };
  } | null
): SessionUser | null {
  if (!session?.user) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  };
}

function loadAuthServer() {
  return Promise.all([import("@tanstack/react-start/server"), import("#/lib/auth.server")]);
}

/**
 * Resolves the Better Auth session once per request and puts the sanitised user — or `null` —
 * on the server function's context.
 *
 * Refusals are plain thrown errors, the behaviour TanStack Start documents: a server function
 * that throws rejects the caller, and an in-app caller catches the error and reads `message`.
 * The catch below only sets the HTTP status first (`setResponseStatus`) so a direct HTTP caller
 * sees the real status instead of a 500. It wraps the whole downstream chain, so a
 * `requireSession` refusal is converted the same way a handler's is.
 */
export const withSession = createMiddleware({ type: "function" }).server(async ({ next }) => {
  try {
    const [{ getRequest }, { auth }] = await loadAuthServer();
    const session = await auth.api.getSession({ headers: getRequest().headers });
    return await next({ context: { user: getSessionUser(session) } });
  } catch (error) {
    if (error instanceof HttpError) {
      const { setResponseStatus } = await import("@tanstack/react-start/server");
      setResponseStatus(error.status);
    }
    throw error;
  }
});

/** `withSession` plus the refusal when nobody is signed in. */
export const requireSession = createMiddleware({ type: "function" })
  .middleware([withSession])
  .server(({ next, context }) => {
    if (!context.user) {
      throw new UnauthorizedError();
    }

    // Re-emitted non-null: `next()` merges context, so everything downstream sees a
    // `SessionUser` and never repeats the check.
    return next({ context: { user: context.user } });
  });

export const getCurrentUser = createServerFn({ method: "GET" })
  .middleware([withSession])
  .handler(({ context }) => context.user);
