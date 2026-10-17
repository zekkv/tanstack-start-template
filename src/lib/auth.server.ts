import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { emailOTP } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { createElement } from "react";

import { db } from "#/db";
import * as schema from "#/db/schema";
import { env } from "#/env";
import { sendEmail } from "#/lib/mailer.server";
import { OtpEmail } from "#/features/emails/components/otp-email";
import { ResetPasswordEmail } from "#/features/emails/components/reset-password-email";
import { VerificationEmail } from "#/features/emails/components/verification-email";
import { logger } from "#/lib/logger";
import { PasswordSchema } from "#/features/auth/schema/password";
import { maskEmail } from "#/lib/utils";

/**
 * Comma-separated IPs/CIDRs of the reverse proxies in front of this app. Enabled, Better Auth
 * walks the forwarded-IP chain right-to-left, skips trusted hops, and keys rate limits (and
 * session tracking) on the first untrusted address. Unset, its default applies: only a
 * single-value `X-Forwarded-For` header is trusted, so a client-supplied chain is rejected and a
 * direct client address is used as-is. Client IP headers default to `x-forwarded-for`; we keep
 * that default and only refine who that header may be trusted from.
 */
const trustedProxies = env.TRUSTED_PROXIES?.split(",")
  .map(entry => entry.trim())
  .filter(Boolean);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,

  hooks: {
    // The forms enforce the password policy (8+ chars, a number, a symbol) in the browser; these
    // paths are the only ones that set a password server-side, so this closes the direct HTTP way
    // around it. /sign-in/email is deliberately not checked: an existing weak password must
    // still authenticate.
    before: createAuthMiddleware(async ctx => {
      const PASSWORD_PATHS = ["/sign-up/email", "/reset-password", "/email-otp/reset-password"];
      if (!PASSWORD_PATHS.includes(ctx.path)) return;

      const password = ctx.body?.password ?? ctx.body?.newPassword;
      if (typeof password !== "string") return;

      const parsed = PasswordSchema.safeParse(password);
      if (!parsed.success) {
        throw new APIError("BAD_REQUEST", {
          message: parsed.error.issues[0]?.message ?? "Invalid password",
        });
      }
    }),
  },

  // A password reset revokes every session the account holds, so a hijacker who reset the
  // password cannot inherit the legitimate user's existing sessions.
  emailAndPassword: {
    enabled: true,
    revokeSessionsOnPasswordReset: true,
    async sendResetPassword({ user, url }) {
      logger.info("Sending password reset email", { email: maskEmail(user.email) });
      await sendEmail(
        user.email,
        "Reset your password",
        createElement(ResetPasswordEmail, { url, user: { email: user.email } })
      );
    },
  },

  user: {
    // The settings page calls authClient.deleteUser(); without this it 404s.
    deleteUser: {
      enabled: true,
    },
  },

  // Password sign-ups start unverified, and an email-OTP sign-in by an unverified user makes
  // Better Auth revoke every account it holds (its account-takeover defence) — which would drop
  // the password the user just set. Sending a verification link on sign-up closes that window.
  emailVerification: {
    sendOnSignUp: true,
    async sendVerificationEmail({ user, url }) {
      logger.info("Sending verification email", { email: maskEmail(user.email) });
      await sendEmail(user.email, "Verify your email", createElement(VerificationEmail, { url }));
    },
  },

  socialProviders:
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            prompt: "select_account consent",
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            getUserInfo: async token => {
              const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
                headers: {
                  Authorization: `Bearer ${token.accessToken}`,
                },
              });
              if (!response.ok) {
                throw new Error(
                  `Google userinfo request failed: ${response.status} ${response.statusText}`
                );
              }
              const profile = await response.json();
              return {
                user: {
                  id: profile.id,
                  name: profile.name,
                  email: profile.email,
                  image: profile.picture,
                  emailVerified: profile.verified_email,
                },
                data: profile,
              };
            },
          },
        }
      : {},
  rateLimit: {
    window: 60,
    max: 20,
    storage: "memory",
  },

  advanced: {
    ipAddress: { trustedProxies },
  },

  plugins: [
    passkey({
      rpName: "TanStack Start Template",
      rpID: new URL(env.BETTER_AUTH_URL).hostname,
      origin: env.BETTER_AUTH_URL,
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        const subject = type === "email-verification" ? "Verify your email" : "Your sign-in code";
        // Raw email addresses do not ship to Sentry via the LogTape sink (PII off by default).
        logger.info("Sending OTP email", { type });
        await sendEmail(email, subject, createElement(OtpEmail, { otp, type }));
      },
      expiresIn: 600,
    }),
    tanstackStartCookies(),
  ],
});
