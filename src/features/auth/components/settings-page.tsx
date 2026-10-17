import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2, KeyRound, Link } from "lucide-react";
import type { Passkey } from "@better-auth/passkey";
import { toast } from "sonner";

import { authClient } from "#/lib/auth-client";
import { accountOptions } from "#/features/auth/accounts";
import type { SessionUser } from "#/features/auth/session";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Skeleton } from "#/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "#/components/ui/alert-dialog";
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

/** The router-facing skin: the only part that touches the route tree. */
export function SettingsRoutePage() {
  const { user } = routeApi.useRouteContext();
  return <SettingsPage user={user} />;
}

interface SettingsPageProps {
  user: SessionUser;
}

/**
 * Presentational account page — everything it renders comes from props, the query cache, and
 * the auth client, so it stays independent of the route that mounts it.
 */
export function SettingsPage({ user }: SettingsPageProps) {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const deleteAccount = useMutation({
    mutationFn: async (value: string) => {
      // The server (better-auth `deleteUser`) verifies this password before deleting; without
      // it the endpoint falls back to fresh-session checks instead.
      const { error } = await authClient.deleteUser({ password: value });
      if (error) throw new Error(error.message ?? "Failed to delete account");
    },
    onSuccess: async () => {
      await navigate({ to: "/" });
    },
    onError: error => toast.error(error.message),
  });

  const { data: passkeys, isPending: passkeysPending } = authClient.useListPasskeys();
  const { data: accounts, status } = useQuery(accountOptions(user.id));
  const deletePasskey = useMutation({
    mutationFn: async (passkeyId: string) => {
      const { error } = await authClient.passkey.deletePasskey({ id: passkeyId });
      if (error) throw new Error(error.message ?? "Failed to delete passkey");
    },
    onError: error => toast.error(error.message),
  });
  const addPasskey = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.passkey.addPasskey();
      if (error) throw new Error(error.message ?? "Failed to add passkey");
    },
    onError: error => toast.error(error.message),
  });

  return (
    <Page width="md" eyebrow="Settings" title="Account">
      <div className="mt-12 space-y-10">
        {/* Identity */}
        <SettingsSection title="Profile">
          <Row label="Email" value={user.email} />
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
                <PasskeyRow key={pk.id} passkey={pk} deletePasskey={deletePasskey} />
              ))}
            </ul>
          )}
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              disabled={addPasskey.isPending}
              onClick={() => addPasskey.mutate()}
            >
              {addPasskey.isPending ? "Starting…" : <KeyRound className="size-4" />}
              Add passkey
            </Button>
          </div>
        </SettingsSection>

        {/* Danger zone */}
        <SettingsSection title="Danger zone">
          <AlertDialog
            onOpenChange={open => {
              // A cancelled or dismissed confirmation must not keep the typed password around.
              if (!open) setPassword("");
            }}
          >
            <AlertDialogTrigger render={<Button type="button" variant="destructive" size="sm" />}>
              <Trash2 className="size-4" />
              Delete account
            </AlertDialogTrigger>
            <AlertDialogContent size="sm">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete account</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently deletes your account and all data. Enter your password to
                  confirm. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                type="password"
                aria-label="Account password"
                placeholder="Password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  type="button"
                  variant="destructive"
                  disabled={password.length === 0 || deleteAccount.isPending}
                  onClick={() => deleteAccount.mutate(password)}
                >
                  {deleteAccount.isPending ? "Deleting…" : "Yes, delete my account"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SettingsSection>
      </div>
    </Page>
  );
}

interface PasskeyRowProps {
  passkey: Passkey;
  deletePasskey: ReturnType<typeof useMutation<void, Error, string>>;
}

/** One passkey row; the destructive confirm lives in a dialog per row. */
function PasskeyRow({ passkey, deletePasskey }: PasskeyRowProps) {
  const [open, setOpen] = useState(false);
  const label = passkey.name ?? "Passkey";
  const deleting = deletePasskey.isPending && deletePasskey.variables === passkey.id;

  return (
    <li className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <KeyRound className="size-4 text-muted-foreground" />
        <span className="text-sm">{label}</span>
      </div>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger
          render={
            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              aria-label={`Delete passkey: ${label}`}
            />
          }
        >
          <Trash2 className="size-4" />
        </AlertDialogTrigger>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete passkey</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &ldquo;{label}&rdquo;? Devices will no longer be able to sign in with it. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={() => deletePasskey.mutate(passkey.id, { onSettled: () => setOpen(false) })}
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
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
        </SettingsSection>

        <SettingsSection title="Linked providers">
          <IconRowSkeleton />
          <IconRowSkeleton />
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
