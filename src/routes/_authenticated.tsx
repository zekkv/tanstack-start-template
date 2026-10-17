import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  /**
   * `__root.tsx` resolved the session for this navigation already, so the boundary is just the
   * refusal now. The re-emit narrows `SessionUser | null` to `SessionUser`: every route beneath
   * this one reads `context.user` and never repeats the check.
   *
   * A failed session lookup is not a sign-out — redirecting to /login would send the user to a
   * page whose own session lookup is equally down (a silent redirect loop), so the failure
   * surfaces into the error boundary instead.
   */
  beforeLoad: ({ context }) => {
    if (context.sessionLookupFailed) {
      throw new Error(
        "Sign-in is temporarily unavailable: the session service could not be reached. Please try again in a moment."
      );
    }

    if (!context.user) {
      throw redirect({ to: "/login" });
    }

    return { user: context.user };
  },
});
