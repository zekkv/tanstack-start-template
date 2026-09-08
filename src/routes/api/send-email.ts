import { createFileRoute } from "@tanstack/react-router";
import { getRequest } from "@tanstack/react-start/server";
import * as React from "react";
import { sendEmail } from "#/lib/mailer";
import { VerificationEmail } from "#/features/emails/components/verification-email";
import { ResetPasswordEmail } from "#/features/emails/components/reset-password-email";
import { z } from "zod";
import { env } from "#/env";
import { logger } from "#/lib/logger";

export const EmailSchema = z.object({
  type: z.enum(["verification", "reset-password"]),
  to: z.email(),
  subject: z.string().min(1),
  data: z.object({
    url: z.url(),
  }),
});

export type EmailRequest = z.infer<typeof EmailSchema>;

export interface CanSendEmailOptions {
  serverSecret?: string;
  configuredSecret?: string;
}

export function canSendEmail({ serverSecret, configuredSecret }: CanSendEmailOptions): boolean {
  if (!serverSecret || !configuredSecret) return false;
  return serverSecret === configuredSecret;
}

export const Route = createFileRoute("/api/send-email")({
  server: {
    handlers: {
      POST: async () => {
        const request = getRequest();

        const serverSecret = request.headers.get("x-email-secret") ?? undefined;

        if (
          !canSendEmail({
            serverSecret,
            configuredSecret: env.EMAIL_API_SECRET,
          })
        ) {
          logger.warn("Rejected unauthenticated email request");
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const result = EmailSchema.safeParse(body);

        if (!result.success) {
          logger.warn("Invalid email request payload", { errors: result.error });
          return Response.json(
            { error: "Invalid request data", details: result.error },
            { status: 400 }
          );
        }

        const { to, subject, type, data } = result.data;
        logger.info("Processing email request", { type, to });

        try {
          let emailComponent: React.ReactElement;

          switch (type) {
            case "verification":
              emailComponent = React.createElement(VerificationEmail, { url: data.url });
              break;
            case "reset-password":
              emailComponent = React.createElement(ResetPasswordEmail, {
                url: data.url,
                user: { email: to },
              });
              break;
            default:
              throw new Error(`Unhandled email type: ${type as string}`);
          }

          const sendResult = await sendEmail(to, subject, emailComponent);
          logger.info("Email API request successful", { to });
          return Response.json({ success: true, data: sendResult });
        } catch (error: unknown) {
          logger.error("Failed to process email api request", { error, type, to });
          return Response.json({ error: "Internal server error" }, { status: 500 });
        }
      },
    },
  },
});
