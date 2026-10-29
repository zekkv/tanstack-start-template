import { describe, expect, it } from "vitest";
import { PasswordSchema } from "#/features/auth/schema/password";

const messages = (password: string) =>
  PasswordSchema.safeParse(password).error?.issues.map(i => i.message) ?? [];

describe("PasswordSchema", () => {
  it("accepts a password with mixed case, a number, and a symbol", () => {
    expect(PasswordSchema.safeParse("Correct-horse1!").success).toBe(true);
  });

  it("rejects a password with no number", () => {
    expect(messages("No-digits-here!")).toContain("Password must contain at least one number");
  });

  it("rejects a password with no symbol", () => {
    expect(messages("NoSymbols123")).toContain("Password must contain at least one symbol");
  });

  it("rejects a password with no uppercase letter", () => {
    expect(messages("nouppercase1!")).toContain("Password must contain an uppercase letter");
  });

  it("rejects a password with no lowercase letter", () => {
    expect(messages("NOLOWERCASE1!")).toContain("Password must contain a lowercase letter");
  });

  it("rejects a password shorter than 8 characters", () => {
    expect(messages("Aa1!")).toContain("Password must be at least 8 characters");
  });

  it("rejects a password longer than 128 characters", () => {
    expect(messages(`${"Aa1!".repeat(50)}x`)).toContain("Password must be at most 128 characters");
  });

  it("counts any non-alphanumeric character as a symbol", () => {
    for (const password of ["Spaced out 1", "emoji-pass1dYZ%", "Under_score1"]) {
      expect(PasswordSchema.safeParse(password).success).toBe(true);
    }
  });
});
