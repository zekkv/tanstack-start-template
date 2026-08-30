import { createServerFn } from "@tanstack/react-start";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";

import { db } from "#/db";
import { notes } from "#/db/schema";
import { getCurrentUser } from "#/features/auth/session";
import { validateNoteTitle } from "./notes-model";

export const listNotes = createServerFn({ method: "GET" }).handler(async () => {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  return db.select().from(notes).where(eq(notes.userId, user.id)).orderBy(desc(notes.createdAt));
});

const CreateNoteInput = z.object({ title: z.string() });

export const createNote = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof CreateNoteInput>) => CreateNoteInput.parse(data))
  .handler(async ({ data }) => {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const error = validateNoteTitle(data.title);
    if (error) throw new Error(error);

    const [note] = await db
      .insert(notes)
      .values({ title: data.title.trim(), userId: user.id })
      .returning();
    return note;
  });

const DeleteNoteInput = z.object({ id: z.number() });

export const deleteNote = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof DeleteNoteInput>) => DeleteNoteInput.parse(data))
  .handler(async ({ data }) => {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const [deleted] = await db
      .delete(notes)
      .where(and(eq(notes.id, data.id), eq(notes.userId, user.id)))
      .returning();

    if (!deleted) throw new Error("Note not found");
    return { success: true };
  });
