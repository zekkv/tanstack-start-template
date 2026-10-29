import { z } from "zod";

const HAS_UPPERCASE = /[A-Z]/;
const HAS_LOWERCASE = /[a-z]/;
const HAS_NUMBER = /\d/;
const HAS_SYMBOL = /[^a-zA-Z0-9]/;

/** Mirrors the checks in `PasswordSchema` for the sign-up checklist. */
export const PASSWORD_REQUIREMENTS = [
  { label: "Uppercase letter", test: (value: string) => HAS_UPPERCASE.test(value) },
  { label: "Lowercase letter", test: (value: string) => HAS_LOWERCASE.test(value) },
  { label: "Number", test: (value: string) => HAS_NUMBER.test(value) },
  {
    label: "Special character (e.g. !?<>@#$%)",
    test: (value: string) => HAS_SYMBOL.test(value),
  },
  { label: "8 characters or more", test: (value: string) => value.length >= 8 },
] as const;

export const PASSWORD_HINT =
  "At least 8 characters, including uppercase and lowercase letters, a number, and a symbol.";

/** Shared by the sign-up, reset-password, and settings change-password forms. */
export const PasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(HAS_LOWERCASE, "Password must contain a lowercase letter")
  .regex(HAS_UPPERCASE, "Password must contain an uppercase letter")
  .regex(HAS_NUMBER, "Password must contain at least one number")
  .regex(HAS_SYMBOL, "Password must contain at least one symbol");
