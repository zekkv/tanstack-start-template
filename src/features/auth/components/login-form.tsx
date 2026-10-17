import { cn } from "#/lib/utils";
import { Button } from "#/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form-start";
import { useRef } from "react";
import { authClient } from "#/lib/auth-client";
import { FormError } from "#/components/custom/form-error";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { GoogleSignInButton } from "#/features/auth/components/google-sign-in-button";
import { useOtpCode } from "#/features/auth/components/use-otp-code";

const schema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

interface LoginFormProps extends React.ComponentProps<"div"> {
  googleEnabled: boolean;
}

export function LoginForm({ className, googleEnabled, ...props }: LoginFormProps) {
  const navigate = useNavigate();
  // `autoComplete="… webauthn"` makes this the field the browser attaches passkey autofill to;
  // the ref makes the handler one-shot so re-focuses don't re-poll.
  const autofillStarted = useRef(false);

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: { onSubmit: schema },
    onSubmit: async ({ value, formApi }) => {
      const { error } = await authClient.signIn.email({
        email: value.email,
        password: value.password,
      });
      if (error) {
        formApi.setErrorMap({
          onSubmit: { form: error.message ?? "Invalid email or password.", fields: {} },
        });
        return;
      }
      await navigate({ to: "/" });
    },
  });

  const sendSignInCode = useOtpCode("sign-in", message =>
    form.setErrorMap({ onSubmit: { form: message, fields: {} } })
  );

  const handleOtpSignIn = () => sendSignInCode.mutate(form.getFieldValue("email"));

  const passkeySignIn = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.signIn.passkey();
      if (error) throw new Error(error.message ?? "Passkey sign-in failed.");
    },
    onSuccess: () => navigate({ to: "/" }),
    onError: error => form.setErrorMap({ onSubmit: { form: error.message, fields: {} } }),
  });

  /**
   * Conditional-mediation autofill. It fires the first time the user engages the email field,
   * not on page load — a bare page view used to touch the passkey endpoint every visit. The
   * whole attempt is swallowed: no WebAuthn at all (old browsers, insecure origins), a partially
   * implemented interface, a user-cancelled prompt, and a failed request are all equally
   * non-events; the explicit "Sign in with passkey" button reports its errors instead.
   */
  const startPasskeyAutofill = () => {
    if (autofillStarted.current) return;
    autofillStarted.current = true;

    void (async () => {
      if (
        typeof PublicKeyCredential === "undefined" ||
        !("isConditionalMediationAvailable" in PublicKeyCredential)
      ) {
        return;
      }
      if (!(await PublicKeyCredential.isConditionalMediationAvailable())) return;

      await authClient.signIn.passkey({
        autoFill: true,
        fetchOptions: {
          onSuccess: () => navigate({ to: "/" }),
        },
      });
    })().catch(() => undefined);
  };

  return (
    <div className={cn("flex flex-col gap-5", className)} {...props}>
      <form
        onSubmit={e => {
          e.preventDefault();
          void form.handleSubmit();
        }}
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">Welcome back</h1>
            <FieldDescription>
              Don&apos;t have an account? <Link to="/signup">Sign up</Link>
            </FieldDescription>
          </div>

          <form.Field name="email">
            {field => (
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username webauthn"
                  placeholder="you@example.com"
                  value={field.state.value}
                  onChange={e => field.handleChange(e.target.value)}
                  onFocus={startPasskeyAutofill}
                  onBlur={field.handleBlur}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>

          <form.Field name="password">
            {field => (
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={field.state.value}
                  onChange={e => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                <FieldError errors={field.state.meta.errors} />
                <FieldDescription>
                  <Link to="/reset-password">Forgot your password?</Link>
                </FieldDescription>
              </Field>
            )}
          </form.Field>

          <form.Subscribe selector={s => s.errorMap.onSubmit}>
            {formError => <FormError error={formError} />}
          </form.Subscribe>

          <form.Subscribe selector={s => s.isSubmitting}>
            {isSubmitting => (
              <Field>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Signing in..." : "Sign in"}
                </Button>
              </Field>
            )}
          </form.Subscribe>

          <FieldSeparator>Or</FieldSeparator>

          <div className="grid gap-3">
            <Button
              variant="outline"
              type="button"
              disabled={sendSignInCode.isPending}
              onClick={handleOtpSignIn}
            >
              {sendSignInCode.isPending ? "Sending code..." : "Email me a sign-in code"}
            </Button>
            <Button
              variant="outline"
              type="button"
              disabled={passkeySignIn.isPending}
              onClick={() => passkeySignIn.mutate()}
            >
              {passkeySignIn.isPending ? "Waiting..." : "Sign in with passkey"}
            </Button>
            {googleEnabled ? <GoogleSignInButton /> : null}
          </div>
        </FieldGroup>
      </form>
    </div>
  );
}
