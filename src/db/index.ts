import { drizzle } from "drizzle-orm/bun-sql";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { SQL } from "bun";

import { env } from "#/env";
import * as schema from "./schema";

export const client = new SQL(env.DATABASE_URL, {
  // Quota guards against the bun defaults (unbounded idle/lifetime, no statement timeout), so
  // one runaway query cannot pin a slot and dev HMR cannot leak connections to max_connections.
  max: 10,
  idleTimeout: 30,
  maxLifetime: 1800,
  connection: {
    statement_timeout: 5000,
    idle_in_transaction_session_timeout: 10000,
  },
});

export const db = drizzle({
  client,
  schema,
});

/**
 * The seam the handlers type against: the driver-agnostic base drizzle instance both this
 * module's Bun-SQL instance and the node-postgres instances the tests and the seed build.
 */
export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;
