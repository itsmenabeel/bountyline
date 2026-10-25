"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  BugIcon,
  BuildingIcon,
  type LucideIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ColdStartHint } from "@/components/shared/cold-start-hint";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Role } from "@/types/api";
import { demoLogin, login } from "../actions";
import { loginSchema } from "../schemas";
import { useAuthAction } from "../use-auth-action";
import { AuthSwitch } from "./auth-switch";
import { type Failure, FailureAlert } from "./failure-alert";
import { PasswordInput } from "./password-input";
import { PendingLabel } from "./pending-label";

interface DemoAccount {
  role: Role;
  label: string;
  summary: string;
  icon: LucideIcon;
}

// Order follows the login wireframe (design-plan §7.2).
const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: "ADMIN",
    label: "Admin",
    summary: "Triage reports and pay the accepted ones.",
    icon: ShieldCheckIcon,
  },
  {
    role: "RESEARCHER",
    label: "Researcher",
    summary: "Submit reports and follow each one to payment.",
    icon: BugIcon,
  },
  {
    role: "PROGRAM_OWNER",
    label: "Program owner",
    summary: "Fund a program's pool and read incoming reports.",
    icon: BuildingIcon,
  },
];

const LOGIN_FIELDS = ["email", "password"] as const;

/**
 * Read when the person submits, not during render, so the page needs no Suspense boundary
 * for search params and prerenders whole. The action ignores a `next` outside the user's area.
 */
function nextFromUrl() {
  return new URLSearchParams(window.location.search).get("next") ?? undefined;
}

export function LoginPanel({
  demoEmails,
}: {
  demoEmails: Record<Role, string>;
}) {
  const { running, isPending, run } = useAuthAction<"form" | Role>();
  const [formFailure, setFormFailure] = useState<Failure | null>(null);
  const [demoFailure, setDemoFailure] = useState<Failure | null>(null);
  const attempts = useRef(0);

  const form = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  function startAttempt() {
    setFormFailure(null);
    setDemoFailure(null);
    attempts.current += 1;
    return attempts.current;
  }

  const onSubmit = form.handleSubmit((values) => {
    if (isPending) return;
    const current = startAttempt();
    run(
      "form",
      () => login(values, nextFromUrl()),
      (failure) => {
        for (const field of LOGIN_FIELDS) {
          const message = failure.fieldErrors[field];
          if (message) form.setError(field, { message });
        }
        setFormFailure({ message: failure.message, attempt: current });
      },
    );
  });

  function onDemo(role: Role) {
    if (isPending) return;
    const current = startAttempt();
    run(
      role,
      () => demoLogin(role, nextFromUrl()),
      (failure) =>
        setDemoFailure({ message: failure.message, attempt: current }),
    );
  }

  // The running button stays at full strength so its spinner reads as progress; the
  // handlers ignore repeat clicks. Every other sign-in button disables until it settles.
  function pendingProps(key: "form" | Role) {
    if (running === key) return { "aria-disabled": true };
    return { disabled: isPending };
  }

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardContent>
          <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
            <FieldGroup>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="login-email">Email</FieldLabel>
                    <Input
                      {...field}
                      id="login-email"
                      type="email"
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      aria-invalid={fieldState.invalid}
                      aria-describedby={
                        fieldState.error ? "login-email-error" : undefined
                      }
                    />
                    <FieldError
                      id="login-email-error"
                      errors={[fieldState.error]}
                    />
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="login-password">Password</FieldLabel>
                    <PasswordInput
                      {...field}
                      id="login-password"
                      autoComplete="current-password"
                      aria-invalid={fieldState.invalid}
                      aria-describedby={
                        fieldState.error ? "login-password-error" : undefined
                      }
                    />
                    <FieldError
                      id="login-password-error"
                      errors={[fieldState.error]}
                    />
                  </Field>
                )}
              />
            </FieldGroup>

            {formFailure ? <FailureAlert failure={formFailure} /> : null}

            <div>
              <Button
                type="submit"
                size="lg"
                className="w-full"
                {...pendingProps("form")}
              >
                {running === "form" ? (
                  <PendingLabel>Signing in…</PendingLabel>
                ) : (
                  "Sign in"
                )}
              </Button>
              <ColdStartHint pending={running === "form"} />
            </div>
          </form>
        </CardContent>
      </Card>

      <FieldSeparator>or</FieldSeparator>

      <section aria-labelledby="demo-heading" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="demo-heading" className="text-base font-semibold">
            Try a demo account
          </h2>
          <p className="text-sm text-muted-foreground">
            One click signs you in and opens that role's dashboard.
          </p>
        </div>

        {demoFailure ? <FailureAlert failure={demoFailure} /> : null}

        {/* One wrapper, so the hint adds no gap while it's empty. */}
        <div>
          <ul className="grid gap-3 md:grid-cols-3">
            {DEMO_ACCOUNTS.map(({ role, label, summary, icon: Icon }) => (
              <li key={role} className="flex">
                <Card size="sm" className="w-full">
                  <CardHeader className="gap-2">
                    <span className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Icon aria-hidden="true" className="size-4" />
                    </span>
                    <h3 className="text-base font-medium leading-snug">
                      {label}
                    </h3>
                    <p className="text-sm text-muted-foreground">{summary}</p>
                  </CardHeader>
                  <CardContent className="mt-auto flex flex-col gap-3">
                    <p className="font-mono text-xs text-muted-foreground [overflow-wrap:anywhere]">
                      {demoEmails[role]}
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      {...pendingProps(role)}
                      onClick={() => onDemo(role)}
                    >
                      {running === role ? (
                        <PendingLabel>Signing in…</PendingLabel>
                      ) : (
                        `Sign in as ${label.toLowerCase()}`
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
          <ColdStartHint
            pending={running !== null && running !== "form"}
            className="pt-3"
          />
        </div>
      </section>

      <AuthSwitch prompt="No account?" href="/register" label="Create one" />
    </div>
  );
}
