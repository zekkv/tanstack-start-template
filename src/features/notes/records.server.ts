import { eq, desc, and } from "drizzle-orm";

import type { Database } from "#/db";
import { notes } from "#/db/schema";
import { NotFoundError } from "#/lib/http-errors";
import type { SessionUser } from "#/features/auth/session";
import type { CreateNotePayload, DeleteNotePayload } from "#/features/notes/schema";
import { parseCreateNote, parseDeleteNote } from "#/features/notes/schema";

/**
 * Server-only on purpose, and named for it: `#/db/schema` is a value import here, which would
 * ship the whole database schema to the browser from any module a route can reach.
 * `server-fns.ts` reaches this through a dynamic `import()` inside `.handler()`.
 *
 * These are pure database operations: the server function's middleware pipeline has already
 * resolved the session before any of them runs.
 */

export async function handleListNotes(user: SessionUser, database: Database) {
  // The tiebreaker on `id` is what makes the `(user_id, created_at)` index able to satisfy the
  // full sort; ordering by a nullable-with-default column alone cannot do it deterministically.
  return database
    .select()
    .from(notes)
    .where(eq(notes.userId, user.id))
    .orderBy(desc(notes.createdAt), desc(notes.id))
    .limit(100);
}

export async function handleCreateNote(
  data: CreateNotePayload,
  user: SessionUser,
  database: Database
) {
  const { title } = parseCreateNote(data);

  const [note] = await database.insert(notes).values({ title, userId: user.id }).returning();
  return note;
}

export async function handleDeleteNote(
  data: DeleteNotePayload,
  user: SessionUser,
  database: Database
) {
  const { id } = parseDeleteNote(data);

  const deleted = await database
    .delete(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, user.id)))
    .returning();

  if (!deleted.length) throw new NotFoundError("Note not found");
  return { success: true };
}
