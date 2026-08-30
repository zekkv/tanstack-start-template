import { createServerFn } from "@tanstack/react-start";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";

import { db } from "#/db";
import { notes } from "#/db/schema";
import { getCurrentUser } from "#/features/auth/session";
import type { SessionUser } from "#/features/auth/session-model";
import { validateNoteTitle } from "./notes-model";

export async function handleListNotes(user: SessionUser | null, database = db) {
  if (!user) throw new Error("Unauthorized");

  return database
    .select()
    .from(notes)
    .where(eq(notes.userId, user.id))
    .orderBy(desc(notes.createdAt));
}

export const listNotes = createServerFn({ method: "GET" }).handler(async () => {
  const user = await getCurrentUser();
  return handleListNotes(user);
});

export const CreateNoteInput = z.object({ title: z.string() });

export async function handleCreateNote(
  data: { title: string },
  user: SessionUser | null,
  database = db
) {
  if (!user) throw new Error("Unauthorized");

  const error = validateNoteTitle(data.title);
  if (error) throw new Error(error);

  const [note] = await database
    .insert(notes)
    .values({ title: data.title.trim(), userId: user.id })
    .returning();
  return note;
}

export const createNote = createServerFn({ method: "POST" })
  .validator(CreateNoteInput)
  .handler(async ({ data }) => {
    const user = await getCurrentUser();
    return handleCreateNote(data, user);
  });

export const DeleteNoteInput = z.object({ id: z.number() });

export async function handleDeleteNote(
  data: { id: number },
  user: SessionUser | null,
  database = db
) {
  if (!user) throw new Error("Unauthorized");

  const [deleted] = await database
    .delete(notes)
    .where(and(eq(notes.id, data.id), eq(notes.userId, user.id)))
    .returning();

  if (!deleted) throw new Error("Note not found");
  return { success: true };
}

export const deleteNote = createServerFn({ method: "POST" })
  .validator(DeleteNoteInput)
  .handler(async ({ data }) => {
    const user = await getCurrentUser();
    return handleDeleteNote(data, user);
  });
