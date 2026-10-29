import { createAuthClient } from "better-auth/react";
import { emailOTPClient, lastLoginMethodClient } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";

export const authClient = createAuthClient({
  plugins: [emailOTPClient(), lastLoginMethodClient(), passkeyClient()],
});
