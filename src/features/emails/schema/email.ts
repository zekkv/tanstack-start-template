import { z } from "zod";

export const EmailSchema = z.object({
  type: z.enum(["verification", "reset-password"]),
  to: z.email(),
  subject: z.string().min(1),
  data: z.object({
    url: z.url(),
  }),
});

export type EmailRequest = z.infer<typeof EmailSchema>;
