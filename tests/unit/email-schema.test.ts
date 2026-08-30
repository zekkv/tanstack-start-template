import { describe, expect, test } from "vitest";
import { z } from "zod";
import { EmailSchema } from "#/features/emails/schema/email";

describe("EmailSchema", () => {
  test("accepts valid verification email payload", () => {
    const valid = {
      type: "verification",
      to: "user@example.com",
      subject: "Verify your email",
      data: {
        url: "https://example.com/verify?token=abc123xyz",
      },
    };

    const parsed = EmailSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    expect(z.validate(EmailSchema, valid)).toBe(true);
  });

  test("accepts valid reset-password email payload", () => {
    const valid = {
      type: "reset-password",
      to: "user@example.com",
      subject: "Reset your password",
      data: {
        url: "https://example.com/reset?token=abc123xyz",
      },
    };

    const parsed = EmailSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    expect(z.validate(EmailSchema, valid)).toBe(true);
  });

  test("rejects invalid email address", () => {
    const invalid = {
      type: "verification",
      to: "not-an-email",
      subject: "Verify",
      data: {
        url: "https://example.com",
      },
    };

    const parsed = EmailSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
    expect(z.validate(EmailSchema, invalid)).toBe(false);
  });

  test("rejects invalid URL in data", () => {
    const invalid = {
      type: "verification",
      to: "user@example.com",
      subject: "Verify",
      data: {
        url: "not-a-url",
      },
    };

    const parsed = EmailSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
    expect(z.validate(EmailSchema, invalid)).toBe(false);
  });

  test("rejects unsupported email type", () => {
    const invalid = {
      type: "marketing",
      to: "user@example.com",
      subject: "Newsletter",
      data: {
        url: "https://example.com",
      },
    };

    const parsed = EmailSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
    expect(z.validate(EmailSchema, invalid)).toBe(false);
  });
});
