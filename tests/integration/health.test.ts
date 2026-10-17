import { afterEach, describe, expect, it, vi } from "vitest";
import { Route } from "#/routes/api/health";

// The vitest `bun` shim stands in for Bun's SQL client, so the real database is never
// reachable under Node; stub `#/db` and assert the handler's status/body mapping instead.
// Live connectivity is exercised by probing /api/health against a running deployment.
const execute = vi.hoisted(() => vi.fn<() => Promise<unknown>>());

vi.mock("#/db", () => ({ db: { execute } }));

const getHandler = (): (() => Promise<Response>) => {
  const handlers = Route.options.server?.handlers as { GET?: () => Promise<Response> } | undefined;
  if (!handlers?.GET) {
    throw new Error("GET handler is not defined on /api/health");
  }
  return handlers.GET;
};

interface HealthBody {
  status: string;
  database: string;
  timestamp: string;
}

describe("GET /api/health", () => {
  afterEach(() => {
    execute.mockReset();
  });

  it("returns ok when the database answers", async () => {
    execute.mockResolvedValueOnce([]);
    const response = await getHandler()();
    expect(response.status).toBe(200);

    const json = (await response.json()) as HealthBody;
    expect(json).toMatchObject({ status: "ok", database: "ok" });
    expect(Number.isNaN(Date.parse(json.timestamp))).toBe(false);
  });

  it("returns 503 with database unreachable when the query fails", async () => {
    execute.mockRejectedValueOnce(new Error("connection refused"));
    const response = await getHandler()();
    expect(response.status).toBe(503);

    const json = (await response.json()) as HealthBody;
    expect(json).toMatchObject({ status: "error", database: "unreachable" });
    expect(Number.isNaN(Date.parse(json.timestamp))).toBe(false);
  });
});
