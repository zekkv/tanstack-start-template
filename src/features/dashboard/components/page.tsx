import { Link, useRouteContext } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form-start";
import { Trash2, Plus, Upload, CheckCircle } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { createNote, deleteNote, noteOptions } from "#/features/notes/server-fns";
import { createUploadUrl } from "#/features/uploads/server-fns";
import { CreateNoteInput } from "#/features/notes/schema";
import type { SessionUser } from "#/features/auth/session";
import { FormError } from "#/components/custom/form-error";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { FieldError, FieldLabel } from "#/components/ui/field";
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
import { Skeleton } from "#/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";
import { Page } from "#/components/custom/page";

/**
 * The route-facing skin: the only part that touches the route tree (context user), so the page
 * below stays a plain query-driven view that renders wherever it is mounted.
 */
export function DashboardRoutePage() {
  const { user } = useRouteContext({ from: "/_authenticated/dashboard" });
  return <DashboardPage user={user} />;
}

interface DashboardPageProps {
  user: SessionUser;
}

export function DashboardPage({ user }: DashboardPageProps) {
  const { data } = useQuery(noteOptions());
  const notes = data ?? [];
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: { title: "" },
    validators: { onSubmit: CreateNoteInput },
    onSubmit: async ({ value, formApi }) => {
      try {
        await createNote({ data: { title: value.title } });
      } catch (error) {
        formApi.setErrorMap({
          onSubmit: {
            form: error instanceof Error ? error.message : "Failed to create note",
            fields: {},
          },
        });
        return;
      }

      form.reset();
      await queryClient.invalidateQueries({ queryKey: noteOptions().queryKey });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id: number) => deleteNote({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: noteOptions().queryKey }),
    onError: error => toast.error(error.message || "Failed to delete note"),
  });

  return (
    <Page
      eyebrow="Dashboard"
      title={`Welcome, ${user.name?.trim() || user.email}`}
      description="A protected route exercising the full loop: session, server functions, database, uploads."
    >
      <section className="flex flex-col">
        <dl className="mt-10 grid gap-6 border-y border-border py-6 sm:grid-cols-3">
          <div>
            <dt className="font-mono text-xs tracking-caps text-muted-foreground uppercase">
              Session
            </dt>
            <dd className="mt-2 text-lg font-medium">Active</dd>
          </div>
          <div>
            <dt className="font-mono text-xs tracking-caps text-muted-foreground uppercase">
              Email
            </dt>
            <dd className="mt-2 truncate text-lg font-medium">{user.email}</dd>
          </div>
          <div>
            <dt className="font-mono text-xs tracking-caps text-muted-foreground uppercase">
              Notes
            </dt>
            <dd className="mt-2 text-lg font-medium">{notes.length}</dd>
          </div>
        </dl>

        <section className="mt-12" aria-label="Notes">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-heading text-lg font-semibold tracking-tight">Notes</h2>
          </div>

          <form
            className="mt-4"
            onSubmit={e => {
              e.preventDefault();
              void form.handleSubmit();
            }}
          >
            <div className="flex gap-2">
              <form.Field name="title">
                {field => (
                  <>
                    {/* Placeholder-only inputs have no accessible name; the sr-only label ties it. */}
                    <FieldLabel htmlFor="note-title" className="sr-only">
                      Note title
                    </FieldLabel>
                    <Input
                      id="note-title"
                      placeholder="New note title…"
                      value={field.state.value}
                      onChange={e => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      aria-invalid={field.state.meta.errors.length > 0}
                      className="flex-1"
                    />
                  </>
                )}
              </form.Field>
              <form.Subscribe selector={s => s.isSubmitting || s.values.title.trim().length === 0}>
                {isDisabled => (
                  <Button type="submit" disabled={isDisabled} size="sm">
                    <Plus className="size-4" />
                    Add
                  </Button>
                )}
              </form.Subscribe>
            </div>

            <form.Field name="title">
              {field => <FieldError errors={field.state.meta.errors} className="mt-2" />}
            </form.Field>
          </form>

          <form.Subscribe selector={s => s.errorMap.onSubmit}>
            {formError => <FormError error={formError} />}
          </form.Subscribe>

          {notes.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              No notes yet. Add your first one above.
            </p>
          ) : (
            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHead>Note</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notes.map(note => (
                  <NoteRow
                    key={note.id}
                    note={note}
                    deleting={
                      deleteNoteMutation.isPending && deleteNoteMutation.variables === note.id
                    }
                    onDelete={done => deleteNoteMutation.mutate(note.id, { onSettled: done })}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </section>

        <FileUploadCard />

        <div className="mt-12 border-t border-border pt-6">
          <Link
            to="/settings"
            className="text-sm font-medium underline decoration-border underline-offset-4 hover:decoration-foreground"
          >
            Account settings
          </Link>
        </div>
      </section>
    </Page>
  );
}

interface NoteRowProps {
  note: { id: number; title: string; createdAt?: string | Date | null };
  deleting: boolean;
  /** `done` closes the dialog when the deletion settles (success or failure). */
  onDelete: (done: () => void) => void;
}

function NoteRow({ note, deleting, onDelete }: NoteRowProps) {
  const [open, setOpen] = useState(false);

  return (
    <TableRow>
      <TableCell>{note.title}</TableCell>
      <TableCell>{note.createdAt ? new Date(note.createdAt).toLocaleDateString() : "—"}</TableCell>
      <TableCell>
        <div className="flex justify-end">
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger
              render={
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-sm"
                  aria-label={`Delete note: ${note.title}`}
                />
              }
            >
              <Trash2 className="size-4" />
            </AlertDialogTrigger>
            <AlertDialogContent size="sm">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete note</AlertDialogTitle>
                <AlertDialogDescription>
                  Delete &ldquo;{note.title}&rdquo;? This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  type="button"
                  variant="destructive"
                  disabled={deleting}
                  onClick={() => onDelete(() => setOpen(false))}
                >
                  {deleting ? "Deleting…" : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}

/**
 * Route-level pending view (`/dashboard` awaits `listNotes`): the same Page shell and section
 * rhythm with the data-dependent values held as skeletons, so the swap to real data does not
 * shift the layout.
 */
export function DashboardPageSkeleton() {
  return (
    <Page
      eyebrow="Dashboard"
      title={<Skeleton className="h-9 w-72 md:h-10 md:w-80" />}
      description="A protected route exercising the full loop: session, server functions, database, uploads."
    >
      <section className="flex flex-col" aria-busy="true">
        <output className="sr-only">Loading dashboard</output>

        <dl className="mt-10 grid gap-6 border-y border-border py-6 sm:grid-cols-3">
          {["Session", "Email", "Notes"].map(label => (
            <div key={label}>
              <dt className="font-mono text-xs tracking-caps text-muted-foreground uppercase">
                {label}
              </dt>
              <dd className="mt-2">
                <Skeleton className="h-7 w-24" />
              </dd>
            </div>
          ))}
        </dl>

        <section className="mt-12" aria-label="Notes">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-heading text-lg font-semibold tracking-tight">Notes</h2>
          </div>
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 w-20" />
          </div>
          <div className="mt-4 space-y-2">
            {[0, 1, 2].map(row => (
              <Skeleton key={row} className="h-10 w-full" />
            ))}
          </div>
        </section>

        <section className="mt-12" aria-label="File upload">
          <h2 className="font-heading text-lg font-semibold tracking-tight">File upload</h2>
          <Skeleton className="mt-2 h-5 w-full max-w-xl" />
          <Skeleton className="mt-4 h-8 w-32" />
        </section>

        <div className="mt-12 border-t border-border pt-6">
          <Skeleton className="h-5 w-36" />
        </div>
      </section>
    </Page>
  );
}

function FileUploadCard() {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useMutation({
    mutationFn: async (file: File) => {
      const { url, key } = await createUploadUrl({
        data: { filename: file.name, contentType: file.type, size: file.size },
      });

      const putRes = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("Upload to storage failed");

      return key;
    },
    onSettled: () => {
      if (inputRef.current) inputRef.current.value = "";
    },
  });

  return (
    <section className="mt-12" aria-label="File upload">
      <h2 className="font-heading text-lg font-semibold tracking-tight">File upload</h2>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Presigned PUT upload via MinIO. Images and PDFs up to 10 MB.
      </p>

      {upload.status === "success" ? (
        <output className="mt-4 flex items-center gap-2 text-sm">
          <CheckCircle className="size-4" />
          Uploaded: <code className="font-mono text-xs break-all">{upload.data}</code>
        </output>
      ) : upload.status === "error" ? (
        <output className="mt-4 text-sm text-destructive">{upload.error.message}</output>
      ) : null}

      <div className="mt-4">
        {/* Keep in sync with CONTENT_TYPE_EXTENSIONS in src/lib/storage.server.ts (minus svg). */}
        <Input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) upload.mutate(file);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={upload.isPending}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-4" />
          {upload.isPending ? "Uploading…" : "Choose file"}
        </Button>
      </div>
    </section>
  );
}
