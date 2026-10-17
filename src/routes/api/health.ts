import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const timestamp = new Date().toISOString();
        try {
          // Server-only dependency is resolved dynamically inside the handler
          // (house rule) so the probe module stays safe for client compilation.
          const { db } = await import("#/db");
          await db.execute("select 1");
          return Response.json({ status: "ok", database: "ok", timestamp });
        } catch {
          // Database down: readiness must go red, not stay green.
          return Response.json(
            { status: "error", database: "unreachable", timestamp },
            { status: 503 }
          );
        }
      },
    },
  },
});
