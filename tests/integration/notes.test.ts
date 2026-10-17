// oxlint-disable node/no-process-env
import { describe, expect, it, beforeAll, afterAll, beforeEach } from "vitest";
import { inArray } from "drizzle-orm";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "#/db/schema";
import {
  handleListNotes,
  handleCreateNote,
  handleDeleteNote,
} from "#/features/notes/records.server";
import type { SessionUser } from "#/features/auth/session";

const testUser: SessionUser = {
  id: "test-user-1",
  email: "john.doe@example.com",
};

const otherUser: SessionUser = {
  id: "test-user-2",
  email: "jane.doe@example.com",
};

describe("Notes Server Logic (Database Integration)", () => {
  let pool: Pool;
  let db: ReturnType<typeof drizzle<typeof schema>>;

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool, { schema });
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  beforeEach(async () => {
    // Scoped to the two fixture users: the shared seed owns its own rows, and this file must not
    // delete state it does not own.
    await db.delete(schema.notes).where(inArray(schema.notes.userId, [testUser.id, otherUser.id]));
  });

  describe("handleListNotes", () => {
    it("returns user notes ordered by createdAt desc and filters other users", async () => {
      const note1 = await handleCreateNote({ title: "First Note" }, testUser, db);
      const note2 = await handleCreateNote({ title: "Second Note" }, testUser, db);

      // Create note for another user
      await handleCreateNote({ title: "Other User Note" }, otherUser, db);

      const result = await handleListNotes(testUser, db);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(note2.id);
      expect(result[0].title).toBe("Second Note");
      expect(result[1].id).toBe(note1.id);
      expect(result[1].title).toBe("First Note");
    });
  });

  describe("handleCreateNote", () => {
    it("validates and rejects empty title", async () => {
      await expect(handleCreateNote({ title: "   " }, testUser, db)).rejects.toThrow(
        "Title is required"
      );
    });

    it("validates and rejects title over 255 characters", async () => {
      await expect(handleCreateNote({ title: "a".repeat(256) }, testUser, db)).rejects.toThrow(
        "Title must be 255 characters or fewer"
      );
    });

    it("accepts a title of exactly 255 characters", async () => {
      const title255 = "a".repeat(255);
      const created = await handleCreateNote({ title: title255 }, testUser, db);
      expect(created).toBeDefined();
      expect(created.title).toBe(title255);
      expect(created.userId).toBe(testUser.id);
    });

    it("inserts note with trimmed title and returns the new note", async () => {
      const result = await handleCreateNote({ title: "  Feed the cat  " }, testUser, db);
      expect(result).toBeDefined();
      expect(result.title).toBe("Feed the cat");
      expect(result.userId).toBe(testUser.id);
      expect(result.id).toBeTypeOf("number");
    });
  });

  describe("handleDeleteNote", () => {
    it("rejects a note that does not exist", async () => {
      await expect(handleDeleteNote({ id: 999999 }, testUser, db)).rejects.toThrow(
        "Note not found"
      );
    });

    it("rejects a note that belongs to another user without deleting it", async () => {
      const otherNote = await handleCreateNote({ title: "Other Note" }, otherUser, db);

      await expect(handleDeleteNote({ id: otherNote.id }, testUser, db)).rejects.toThrow(
        "Note not found"
      );

      const otherNotes = await handleListNotes(otherUser, db);
      expect(otherNotes).toHaveLength(1);
      expect(otherNotes[0].id).toBe(otherNote.id);
    });

    it("deletes note and returns success: true when matched", async () => {
      const note = await handleCreateNote({ title: "Old note" }, testUser, db);

      const result = await handleDeleteNote({ id: note.id }, testUser, db);
      expect(result).toEqual({ success: true });

      const remaining = await handleListNotes(testUser, db);
      expect(remaining).toHaveLength(0);
    });
  });
});
