import { describe, expect, it, vi, beforeEach } from "vitest";
import { handleListNotes, handleCreateNote, handleDeleteNote } from "#/features/notes/notes-fns";
import type { SessionUser } from "#/features/auth/session-model";

const mockNotes = [
  { id: 1, title: "Note 1", userId: "user-1", createdAt: new Date(), updatedAt: new Date() },
  { id: 2, title: "Note 2", userId: "user-1", createdAt: new Date(), updatedAt: new Date() },
];

const mockUser: SessionUser = {
  id: "user-1",
  email: "test@example.com",
};

interface QueryMock {
  from: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
  returning: ReturnType<typeof vi.fn>;
}

interface MockDatabase {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
}

describe("Notes Server Logic", () => {
  let mockDb: MockDatabase;
  let queryMock: QueryMock;

  beforeEach(() => {
    vi.clearAllMocks();

    queryMock = {
      from: vi.fn<() => QueryMock>().mockReturnThis(),
      where: vi.fn<() => QueryMock>().mockReturnThis(),
      orderBy: vi.fn<() => Promise<typeof mockNotes>>().mockResolvedValue(mockNotes),
      values: vi.fn<() => QueryMock>().mockReturnThis(),
      returning: vi.fn<() => Promise<unknown[]>>().mockResolvedValue([]),
    };

    mockDb = {
      select: vi.fn<() => QueryMock>().mockReturnValue(queryMock),
      insert: vi.fn<() => QueryMock>().mockReturnValue(queryMock),
      delete: vi.fn<() => QueryMock>().mockReturnValue(queryMock),
    };
  });

  describe("handleListNotes", () => {
    it("throws Unauthorized if user is not signed in", async () => {
      await expect(handleListNotes(null, mockDb as never)).rejects.toThrow("Unauthorized");
    });

    it("returns user notes ordered by createdAt desc", async () => {
      const result = await handleListNotes(mockUser, mockDb as never);
      expect(result).toEqual(mockNotes);
      expect(mockDb.select).toHaveBeenCalled();
      expect(queryMock.from).toHaveBeenCalled();
      expect(queryMock.where).toHaveBeenCalled();
      expect(queryMock.orderBy).toHaveBeenCalled();
    });
  });

  describe("handleCreateNote", () => {
    it("throws Unauthorized if user is not signed in", async () => {
      await expect(
        handleCreateNote({ title: "Buy groceries" }, null, mockDb as never)
      ).rejects.toThrow("Unauthorized");
    });

    it("validates and rejects empty title", async () => {
      await expect(handleCreateNote({ title: "   " }, mockUser, mockDb as never)).rejects.toThrow(
        "Title is required"
      );
    });

    it("validates and rejects title over 255 characters", async () => {
      await expect(
        handleCreateNote({ title: "a".repeat(256) }, mockUser, mockDb as never)
      ).rejects.toThrow("Title must be 255 characters or fewer");
    });

    it("inserts note with trimmed title and returns the new note", async () => {
      const created = {
        id: 42,
        title: "Feed the cat",
        userId: "user-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      queryMock.returning.mockResolvedValueOnce([created]);

      const result = await handleCreateNote(
        { title: "  Feed the cat  " },
        mockUser,
        mockDb as never
      );
      expect(result).toEqual(created);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(queryMock.values).toHaveBeenCalledWith({
        title: "Feed the cat",
        userId: "user-1",
      });
    });
  });

  describe("handleDeleteNote", () => {
    it("throws Unauthorized if user is not signed in", async () => {
      await expect(handleDeleteNote({ id: 10 }, null, mockDb as never)).rejects.toThrow(
        "Unauthorized"
      );
    });

    it("throws Note not found if note belongs to another user or does not exist", async () => {
      queryMock.returning.mockResolvedValueOnce([]);

      await expect(handleDeleteNote({ id: 999 }, mockUser, mockDb as never)).rejects.toThrow(
        "Note not found"
      );
    });

    it("deletes note and returns success: true when matched", async () => {
      const deletedRow = { id: 10, title: "Old note", userId: "user-1" };
      queryMock.returning.mockResolvedValueOnce([deletedRow]);

      const result = await handleDeleteNote({ id: 10 }, mockUser, mockDb as never);
      expect(result).toEqual({ success: true });
      expect(mockDb.delete).toHaveBeenCalled();
      expect(queryMock.where).toHaveBeenCalled();
      expect(queryMock.returning).toHaveBeenCalled();
    });
  });

  describe("Input Validators", () => {
    it("validates valid and invalid CreateNoteInput", async () => {
      const { CreateNoteInput } = await import("#/features/notes/notes-fns");
      expect(CreateNoteInput.parse({ title: "Valid" })).toEqual({ title: "Valid" });
      expect(() => CreateNoteInput.parse({ title: 123 })).toThrow(/invalid/i);
    });

    it("validates valid and invalid DeleteNoteInput", async () => {
      const { DeleteNoteInput } = await import("#/features/notes/notes-fns");
      expect(DeleteNoteInput.parse({ id: 5 })).toEqual({ id: 5 });
      expect(() => DeleteNoteInput.parse({ id: "invalid" })).toThrow(/invalid/i);
    });
  });
});
