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
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form-start";
import { toast } from "sonner";
import { z } from "zod";
import { useState } from "react";
import { authClient } from "#/lib/auth-client";
import { PasswordSchema } from "#/features/auth/schema/password";
import { FormError } from "#/components/custom/form-error";
import { useMutation } from "@tanstack/react-query";
import { GoogleSignInButton } from "#/features/auth/components/google-sign-in-button";
import { useOtpCode } from "#/features/auth/components/use-otp-code";

const schema = z.object({
  email: z.email("Enter a valid email address"),
  password: PasswordSchema,
});

interface SignupFormProps extends React.ComponentProps<"div"> {
  googleEnabled: boolean;
}

export function SignupForm({ className, googleEnabled, ...props }: SignupFormProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: { onSubmit: schema },
    onSubmit: async ({ value, formApi }) => {
      // ponytail: name is "" to match what the email-OTP flow stores; add a field if profiles need one.
      const { error } = await authClient.signUp.email({
        name: "",
        email: value.email,
        password: value.password,
      });
      if (error) {
        formApi.setErrorMap({
          onSubmit: {
            form: error.message ?? "Could not create your account. Try again.",
            fields: {},
          },
        });
        return;
      }
      // Re-runs the root's beforeLoad so the header picks up the session the sign-up created.
      await router.invalidate();
      setVerifyEmail(value.email);
    },
  });

  const sendSignupCode = useOtpCode("sign-up", message =>
    form.setErrorMap({ onSubmit: { form: message, fields: {} } })
  );

  const handleOtpSignUp = () => sendSignupCode.mutate(form.getFieldValue("email"));

  const resendVerification = useMutation({
    mutationFn: async () => {
      if (!verifyEmail) throw new Error("Nothing to resend yet.");
      const { error } = await authClient.sendVerificationEmail({
        email: verifyEmail,
        callbackURL: "/login",
      });
      if (error) throw new Error(error.message ?? "Failed to resend the email. Try again.");
    },
    onSuccess: () => setResent(true),
    onError: error => toast.error(error.message),
  });

  if (verifyEmail) {
    return (
      <div className={cn("flex flex-col gap-5", className)} {...props}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">Check your email</h1>
            <FieldDescription>
              We sent a verification link to <strong>{verifyEmail}</strong>. Follow the link to
              activate your account.
            </FieldDescription>
          </div>
          {resent ? (
            <FieldDescription className="text-center">
              Sent again — check your inbox for a fresh link.
            </FieldDescription>
          ) : null}
          <Field>
            <Button
              variant="outline"
              type="button"
              disabled={resendVerification.isPending}
              onClick={() => resendVerification.mutate()}
            >
              {resendVerification.isPending ? "Resending..." : "Resend verification email"}
            </Button>
          </Field>
          <Field>
            <Button type="button" onClick={() => void navigate({ to: "/" })}>
              Continue
            </Button>
          </Field>
        </FieldGroup>
      </div>
    );
  }

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
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Create an account
            </h1>
            <FieldDescription>
              Already have an account? <Link to="/login">Sign in</Link>
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
                  autoComplete="new-password"
                  value={field.state.value}
                  onChange={e => field.handleChange(e.target.value)}
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

          <form.Subscribe selector={s => s.errorMap.onSubmit}>
            {formError => <FormError error={formError} />}
          </form.Subscribe>

          <form.Subscribe selector={s => s.isSubmitting}>
            {isSubmitting => (
              <Field>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating account..." : "Create account"}
                </Button>
              </Field>
            )}
          </form.Subscribe>

          <FieldSeparator>Or</FieldSeparator>

          <div className="grid gap-3">
            <Button
              variant="outline"
              type="button"
              disabled={sendSignupCode.isPending}
              onClick={handleOtpSignUp}
            >
              {sendSignupCode.isPending ? "Sending code..." : "Sign up with an email code"}
            </Button>
            {googleEnabled ? <GoogleSignInButton /> : null}
          </div>
        </FieldGroup>
      </form>
    </div>
  );
}
