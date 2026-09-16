import { useEffect } from "react";
import { Page } from "#/components/custom/page";
import { logger } from "#/lib/logger";

function handleClick() {
  const time = new Date().toISOString();
  logger.info("Button clicked", { time });
}

export function SentryExamplePage() {
  useEffect(() => {
    const time = new Date().toISOString();
    logger.info("Mounted sentry test route", { time });
  }, []);

  return (
    <Page className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 rounded-md border border-border p-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Sentry client test</h1>
          <p className="text-sm text-muted-foreground">
            Open this page, then click the button and watch for a client log.
          </p>
        </div>

        <button
          type="button"
          onClick={handleClick}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Log client event
        </button>
      </div>
    </Page>
  );
}
