import { getRouteApi, useNavigate, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form-start";
import { useState } from "react";
import { BadgeCheck, CircleAlert, KeyRound, Link, MailCheck, Trash2 } from "lucide-react";
import type { Passkey } from "@better-auth/passkey";
import { toast } from "sonner";
import { z } from "zod";

import { authClient } from "#/lib/auth-client";
import { accountOptions } from "#/features/auth/accounts";
import { PasswordInput } from "#/features/auth/components/password-input";
import { PasswordSchema } from "#/features/auth/schema/password";
import { Button } from "#/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "#/components/ui/field";
import { Skeleton } from "#/components/ui/skeleton";
import { FormError } from "#/components/custom/form-error";
import { Page } from "#/components/custom/page";

const routeApi = getRouteApi("/_authenticated/settings");

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  "email-otp": "Email OTP",
  credential: "Password",
};

function getProviderLabel(providerId: string) {
  return PROVIDER_LABELS[providerId] ?? providerId.charAt(0).toUpperCase() + providerId.slice(1);
}

export function SettingsPage() {
  const { user } = routeApi.useRouteContext();
  const navigate = useNavigate();
  const router = useRouter();

  async function handleDeleteAccount() {
    const { error } = await authClient.deleteUser({});
    if (error) {
      toast.error(error.message ?? "Failed to delete account");
      return;
    }
    await navigate({ to: "/" });
  }

  const { data: passkeys, isPending: passkeysPending } = authClient.useListPasskeys();
  const { data: accounts, status } = useQuery(accountOptions(user.id));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const sendVerification = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.sendVerificationEmail({
        email: user.email,
        callbackURL: "/settings",
      });
      if (error) {
        throw Object.assign(new Error(error.message ?? "Failed to send the verification email"), {
          code: error.code,
        });
      }
    },
    onSuccess: () => toast.success("Verification email sent. Check your inbox."),
    onError: error => {
      toast.error(error.message);
      // A different tab may already have verified the address; refresh the status in this one.
      if ("code" in error && error.code === "EMAIL_ALREADY_VERIFIED") {
        void router.invalidate();
      }
    },
  });
  const deletePasskey = useMutation({
    mutationFn: async (passkeyId: string) => {
      const { error } = await authClient.passkey.deletePasskey({ id: passkeyId });
      if (error) throw new Error(error.message ?? "Failed to delete passkey");
    },
    onError: error => toast.error(error.message),
  });

  return (
    <Page width="md" eyebrow="Settings" title="Account">
      <div className="mt-12 space-y-10">
        {/* Identity */}
        <SettingsSection title="Profile">
          <Row label="Email" value={user.email} />
          <div className="flex items-center justify-between gap-4 py-1">
            <span className="text-sm text-muted-foreground">Email status</span>
            {user.emailVerified ? (
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <BadgeCheck className="size-4 text-muted-foreground" />
                Verified
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <CircleAlert className="size-4 text-muted-foreground" />
                Not verified
              </span>
            )}
          </div>
          {!user.emailVerified && (
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={sendVerification.isPending}
                onClick={() => sendVerification.mutate()}
              >
                <MailCheck className="size-4" />
                {sendVerification.isPending ? "Sending..." : "Verify email"}
              </Button>
              <FieldDescription>We will email you a link to confirm this address.</FieldDescription>
            </div>
          )}
          {user.name && <Row label="Name" value={user.name} />}
        </SettingsSection>

        {/* Linked providers */}
        <SettingsSection title="Linked providers">
          {status === "pending" ? (
            <div className="space-y-2" aria-busy="true">
              <IconRowSkeleton />
              <IconRowSkeleton />
            </div>
          ) : status === "error" ? (
            <p className="text-sm text-destructive" role="alert">
              Could not load linked providers.
            </p>
          ) : accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No linked providers.</p>
          ) : (
            <ul className="space-y-2">
              {accounts.map(acct => (
                <li key={acct.id} className="flex items-center gap-2">
                  <Link className="size-4 text-muted-foreground" />
                  <span className="text-sm">{getProviderLabel(acct.providerId)}</span>
                </li>
              ))}
            </ul>
          )}
        </SettingsSection>

        {/* Password */}
        <SettingsSection title="Password">
          {status === "pending" ? (
            <div className="space-y-3" aria-busy="true">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : (
            <ChangePasswordForm
              email={user.email}
              hasPassword={
                status === "success"
                  ? accounts.some(account => account.providerId === "credential")
                  : undefined
              }
            />
          )}
        </SettingsSection>

        {/* Passkeys */}
        <SettingsSection title="Passkeys">
          {passkeysPending ? (
            <div className="space-y-2" aria-busy="true">
              <IconRowSkeleton />
            </div>
          ) : !passkeys || passkeys.length === 0 ? (
            <p className="text-sm text-muted-foreground">No passkeys registered.</p>
          ) : (
            <ul className="space-y-2">
              {passkeys.map((pk: Passkey) => (
                <li key={pk.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="size-4 text-muted-foreground" />
                    <span className="text-sm">{pk.name ?? "Passkey"}</span>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-sm"
                    disabled={deletePasskey.isPending && deletePasskey.variables === pk.id}
                    aria-label={`Delete passkey: ${pk.name ?? "Passkey"}`}
                    onClick={() => deletePasskey.mutate(pk.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() =>
                void (async () => {
                  const { error } = await authClient.passkey.addPasskey();
                  if (error) toast.error(error.message ?? "Failed to add passkey");
                })()
              }
            >
              <KeyRound className="size-4" />
              Add passkey
            </Button>
          </div>
        </SettingsSection>

        {/* Danger zone */}
        <SettingsSection title="Danger zone">
          {confirmDelete ? (
            <div className="space-y-3">
              <p className="text-sm text-destructive">
                This permanently deletes your account and all data. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button variant="destructive" size="sm" onClick={() => void handleDeleteAccount()}>
                  Yes, delete my account
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="size-4" />
              Delete account
            </Button>
          )}
        </SettingsSection>
      </div>
    </Page>
  );
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: PasswordSchema,
});

/** Change the password with the current one, or fall back to the emailed reset link. */
function ChangePasswordForm({
  email,
  hasPassword,
}: {
  email: string;
  hasPassword: boolean | undefined;
}) {
  const requestReset = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });
      if (error) throw new Error(error.message ?? "Failed to send the reset link");
    },
    onSuccess: () =>
      toast.success(
        hasPassword
          ? "Reset link sent. Check your inbox."
          : "Set-password link sent. Check your inbox."
      ),
    onError: error => toast.error(error.message),
  });

  const form = useForm({
    defaultValues: { currentPassword: "", newPassword: "" },
    validators: { onSubmit: changePasswordSchema },
    onSubmit: async ({ value, formApi }) => {
      const { error } = await authClient.changePassword({
        currentPassword: value.currentPassword,
        newPassword: value.newPassword,
        revokeOtherSessions: true,
      });
      if (error) {
        formApi.setErrorMap({
          onSubmit: {
            form: error.message ?? "Could not change your password.",
            fields: {},
          },
        });
        return;
      }
      form.reset();
      toast.success("Password updated. Your other sessions were signed out.");
    },
  });

  if (hasPassword !== true) {
    return (
      <div className="space-y-2">
        <FieldDescription>
          {hasPassword === false
            ? "This account has no password. We can email you a link to set one."
            : "We could not load your linked accounts. You can still email a link to set or reset your password."}
        </FieldDescription>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={requestReset.isPending}
          onClick={() => requestReset.mutate()}
        >
          {requestReset.isPending ? "Sending..." : "Email me a set-password link"}
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={event => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div className="space-y-4">
        <form.Field name="currentPassword">
          {field => (
            <Field>
              <FieldLabel htmlFor="current-password">Current password</FieldLabel>
              <PasswordInput
                id="current-password"
                autoComplete="current-password"
                value={field.state.value}
                onChange={event => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                aria-invalid={field.state.meta.errors.length > 0}
              />
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>

        <form.Field name="newPassword">
          {field => (
            <Field>
              <FieldLabel htmlFor="new-password">New password</FieldLabel>
              <PasswordInput
                id="new-password"
                autoComplete="new-password"
                value={field.state.value}
                onChange={event => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                aria-invalid={field.state.meta.errors.length > 0}
              />
              <FieldError errors={field.state.meta.errors} />
              <FieldDescription>
                At least 8 characters, including a number and a symbol.
              </FieldDescription>
            </Field>
          )}
        </form.Field>

        <form.Subscribe selector={state => state.errorMap.onSubmit}>
          {formError => <FormError error={formError} />}
        </form.Subscribe>

        <div className="flex flex-wrap items-center gap-2">
          <form.Subscribe selector={state => state.isSubmitting}>
            {isSubmitting => (
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update password"}
              </Button>
            )}
          </form.Subscribe>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={requestReset.isPending}
            onClick={() => requestReset.mutate()}
          >
            {requestReset.isPending ? "Sending..." : "Email me a reset link"}
          </Button>
        </div>

        <FieldDescription>
          Do not know your current password? Send yourself a reset link instead. Updating your
          password here signs out your other sessions; resetting it from the emailed link signs you
          out everywhere.
        </FieldDescription>
      </div>
    </form>
  );
}

/**
 * Route-level pending view (`/settings` prefetches the linked accounts): the same sections and
 * row shapes as skeletons, so the swap to real data does not shift the layout.
 */
export function SettingsPageSkeleton() {
  return (
    <Page width="md" eyebrow="Settings" title="Account">
      <output className="sr-only">Loading account settings</output>
      <div className="mt-12 space-y-10" aria-busy="true">
        <SettingsSection title="Profile">
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </SettingsSection>

        <SettingsSection title="Linked providers">
          <IconRowSkeleton />
          <IconRowSkeleton />
        </SettingsSection>

        <SettingsSection title="Password">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-8 w-32" />
        </SettingsSection>

        <SettingsSection title="Passkeys">
          <IconRowSkeleton />
          <Skeleton className="mt-3 h-8 w-32" />
        </SettingsSection>

        <SettingsSection title="Danger zone">
          <Skeleton className="h-8 w-36" />
        </SettingsSection>
      </div>
    </Page>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border pt-6">
      <h2 className="font-mono text-xs tracking-caps text-muted-foreground uppercase">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="truncate text-sm font-medium">{value}</span>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <Skeleton className="h-5 w-16" />
      <Skeleton className="h-5 w-40" />
    </div>
  );
}

function IconRowSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="size-4" />
      <Skeleton className="h-5 w-24" />
    </div>
  );
}
