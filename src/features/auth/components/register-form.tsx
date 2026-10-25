"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ColdStartHint } from "@/components/shared/cold-start-hint";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { register } from "../actions";
import { registerSchema, type SignupRole } from "../schemas";
import { useAuthAction } from "../use-auth-action";
import { AuthSwitch } from "./auth-switch";
import { type Failure, FailureAlert } from "./failure-alert";
import { PasswordInput } from "./password-input";
import { PasswordRules } from "./password-rules";
import { PendingLabel } from "./pending-label";

// Admins are seeded or promoted by another admin, so sign-up offers two roles
// (design-plan §7.2).
const ROLE_OPTIONS: {
  value: SignupRole;
  title: string;
  description: string;
}[] = [
  {
    value: "RESEARCHER",
    title: "I find vulnerabilities",
    description:
      "Report bugs to active programs and get paid from their pools.",
  },
  {
    value: "PROGRAM_OWNER",
    title: "I run a security program",
    description: "Publish a program and fund its pool through Stripe.",
  },
];

const REGISTER_FIELDS = ["name", "email", "password", "role"] as const;

/** Points a control at its error message only while there is one. */
const describedBy = (...ids: (string | false | undefined)[]) =>
  ids.filter(Boolean).join(" ") || undefined;

export function RegisterForm() {
  const { running, isPending, run } = useAuthAction<"form">();
  const [failure, setFailure] = useState<Failure | null>(null);
  const attempts = useRef(0);

  const form = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: { name: "", email: "", password: "", role: undefined },
  });

  // Read during this render so the form re-renders when a submit is attempted.
  const { isSubmitted } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    if (isPending) return;
    setFailure(null);
    attempts.current += 1;
    const attempt = attempts.current;
    run(
      "form",
      () => register(values),
      (result) => {
        for (const field of REGISTER_FIELDS) {
          const message = result.fieldErrors[field];
          if (message) form.setError(field, { message });
        }
        setFailure({ message: result.message, attempt });
      },
    );
  });

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardContent>
          <form noValidate onSubmit={onSubmit} className="flex flex-col gap-6">
            <FieldGroup>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="register-name">Name</FieldLabel>
                    <Input
                      {...field}
                      id="register-name"
                      autoComplete="name"
                      aria-invalid={fieldState.invalid}
                      aria-describedby={describedBy(
                        fieldState.error && "register-name-error",
                      )}
                    />
                    <FieldError
                      id="register-name-error"
                      errors={[fieldState.error]}
                    />
                  </Field>
                )}
              />
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="register-email">Email</FieldLabel>
                    <Input
                      {...field}
                      id="register-email"
                      type="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      aria-invalid={fieldState.invalid}
                      aria-describedby={describedBy(
                        fieldState.error && "register-email-error",
                      )}
                    />
                    <FieldError
                      id="register-email-error"
                      errors={[fieldState.error]}
                    />
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => {
                  // The checklist reports the rules while people type. The text error waits
                  // for a submit, so it doesn't repeat the checklist or push the role cards
                  // down while someone moves from this field to them.
                  const error = isSubmitted ? fieldState.error : undefined;
                  return (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="register-password">
                        Password
                      </FieldLabel>
                      <PasswordInput
                        {...field}
                        id="register-password"
                        autoComplete="new-password"
                        aria-invalid={fieldState.invalid}
                        aria-describedby={describedBy(
                          "register-password-rules",
                          error && "register-password-error",
                        )}
                      />
                      <PasswordRules
                        id="register-password-rules"
                        value={field.value}
                      />
                      <FieldError
                        id="register-password-error"
                        errors={[error]}
                      />
                    </Field>
                  );
                }}
              />
            </FieldGroup>

            <Controller
              name="role"
              control={form.control}
              render={({ field, fieldState }) => (
                <FieldSet>
                  <FieldLegend variant="label">Account type</FieldLegend>
                  <RadioGroup
                    name={field.name}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={describedBy(
                      fieldState.error && "register-role-error",
                    )}
                    className="gap-3 sm:grid-cols-2"
                  >
                    {ROLE_OPTIONS.map((option, index) => (
                      <FieldLabel
                        key={option.value}
                        htmlFor={`register-role-${option.value}`}
                      >
                        <Field
                          orientation="horizontal"
                          data-invalid={fieldState.invalid}
                        >
                          <FieldContent>
                            <FieldTitle>{option.title}</FieldTitle>
                            <FieldDescription>
                              {option.description}
                            </FieldDescription>
                          </FieldContent>
                          <RadioGroupItem
                            // The first option takes focus when the role is missing on submit.
                            ref={index === 0 ? field.ref : undefined}
                            id={`register-role-${option.value}`}
                            value={option.value}
                            aria-invalid={fieldState.invalid}
                            onBlur={field.onBlur}
                          />
                        </Field>
                      </FieldLabel>
                    ))}
                  </RadioGroup>
                  <FieldError
                    id="register-role-error"
                    errors={[fieldState.error]}
                  />
                </FieldSet>
              )}
            />

            {failure ? <FailureAlert failure={failure} /> : null}

            <div>
              <Button
                type="submit"
                size="lg"
                className="w-full"
                aria-disabled={running === "form" || undefined}
              >
                {running === "form" ? (
                  <PendingLabel>Creating account…</PendingLabel>
                ) : (
                  "Create account"
                )}
              </Button>
              <ColdStartHint pending={running === "form"} />
            </div>
          </form>
        </CardContent>
      </Card>

      <AuthSwitch
        prompt="Already have an account?"
        href="/login"
        label="Sign in"
      />
    </div>
  );
}
