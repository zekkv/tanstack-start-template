import { Link, useNavigate, useRouteContext, useRouter } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { authClient } from "#/lib/auth-client";
import { Button } from "#/components/ui/button";
import { ThemeToggle } from "#/components/ui/theme-toggle";

function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

export function Header() {
  // Resolved in `__root.tsx` beforeLoad, so the signed-in nav is in the server markup.
  const { user } = useRouteContext({ from: "__root__" });
  const navigate = useNavigate();
  const router = useRouter();
  const signOut = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.signOut();
      if (error) throw new Error(error.message ?? "Failed to sign out");
    },
    onSuccess: async () => {
      await navigate({ to: "/" });
      await router.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="flex h-14 w-full items-center justify-between px-6">
        <Link
          to="/"
          aria-label="TanStack Start home"
          className="inline-flex items-center transition-opacity hover:opacity-60"
        >
          <img
            src="/brand/tanstack-landscape-black.svg"
            alt=""
            width={129}
            height={20}
            className="h-5 w-auto dark:hidden"
          />
          <img
            src="/brand/tanstack-landscape-white.svg"
            alt=""
            width={129}
            height={20}
            className="hidden h-5 w-auto dark:block"
          />
        </Link>

        <nav className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            render={
              <a
                href="https://github.com/zek01svg/tanstack-start-template"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub repository"
                title="GitHub repository"
              />
            }
          >
            <GitHubMark />
          </Button>
          {user && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={signOut.isPending}
              onClick={() => signOut.mutate()}
            >
              Sign out
            </Button>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
