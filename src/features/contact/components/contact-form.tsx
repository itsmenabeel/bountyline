"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { CopyButton } from "@/components/shared/copy-button";
import { ErrorSummary } from "@/components/shared/error-summary";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type ErrorTarget, useErrorSummary } from "@/hooks/use-error-summary";
import { describedBy } from "@/lib/forms";
import {
  CONTACT_TOPIC_LABEL,
  CONTACT_TOPICS,
  type ContactInput,
  type ContactTopic,
  type ContactValues,
  contactMailto,
  contactSchema,
  MESSAGE,
} from "../schemas";

const FIELD_LABEL = {
  name: "Name",
  email: "Email",
  topic: "Topic",
  message: "Message",
} as const;

const target: ErrorTarget = (path) => {
  const field = (
    path in FIELD_LABEL ? path : "message"
  ) as keyof typeof FIELD_LABEL;
  return { id: `contact-${field}`, label: FIELD_LABEL[field] };
};

/**
 * The contact form (implementation-plan §4.12). There's no backend endpoint: a valid
 * submit opens the visitor's mail app with the message filled in, so the button says what
 * happens and the page never claims the message was sent.
 */
export function ContactForm({ to }: { to: string }) {
  const [opened, setOpened] = useState(0);
  const noticeRef = useRef<HTMLDivElement>(null);
  const form = useForm<ContactValues, unknown, ContactInput>({
    resolver: zodResolver(contactSchema),
    mode: "onTouched",
    shouldFocusError: false,
    defaultValues: { name: "", email: "", topic: undefined, message: "" },
  });
  const summary = useErrorSummary(form, target);
  const message = useWatch({ control: form.control, name: "message" });

  useEffect(() => {
    if (opened > 0) noticeRef.current?.focus();
  }, [opened]);

  return (
    <form
      noValidate
      className="flex flex-col gap-6"
      onSubmit={form.handleSubmit((values) => {
        window.location.href = contactMailto(to, values);
        setOpened((count) => count + 1);
      }, summary.onInvalid)}
    >
      {summary.errors.length > 0 && (
        <ErrorSummary errors={summary.errors} attempt={summary.attempt} />
      )}
      <FieldGroup>
        <div className="grid gap-6 sm:grid-cols-2">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="contact-name">Name</FieldLabel>
                <Input
                  {...field}
                  id="contact-name"
                  autoComplete="name"
                  maxLength={100}
                  aria-invalid={fieldState.invalid}
                  aria-describedby={describedBy(
                    fieldState.error && "contact-name-error",
                  )}
                />
                <FieldError
                  id="contact-name-error"
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
                <FieldLabel htmlFor="contact-email">Email</FieldLabel>
                <Input
                  {...field}
                  id="contact-email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={describedBy(
                    fieldState.error && "contact-email-error",
                  )}
                />
                <FieldError
                  id="contact-email-error"
                  errors={[fieldState.error]}
                />
              </Field>
            )}
          />
        </div>
        <Controller
          name="topic"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="contact-topic">Topic</FieldLabel>
              <Select
                value={field.value ?? ""}
                onValueChange={(next) => {
                  field.onChange(next as ContactTopic);
                  field.onBlur();
                }}
              >
                <SelectTrigger
                  ref={field.ref}
                  id="contact-topic"
                  className="w-full sm:w-72"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={describedBy(
                    fieldState.error && "contact-topic-error",
                  )}
                >
                  <SelectValue placeholder="Choose a topic" />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_TOPICS.map((topic) => (
                    <SelectItem key={topic} value={topic}>
                      {CONTACT_TOPIC_LABEL[topic]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError
                id="contact-topic-error"
                errors={[fieldState.error]}
              />
            </Field>
          )}
        />
        <Controller
          name="message"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="contact-message">Message</FieldLabel>
              <Textarea
                {...field}
                id="contact-message"
                rows={7}
                maxLength={MESSAGE.max}
                aria-invalid={fieldState.invalid}
                aria-describedby={describedBy(
                  "contact-message-help",
                  fieldState.error && "contact-message-error",
                )}
              />
              <FieldDescription id="contact-message-help">
                {MESSAGE.min} to {MESSAGE.max.toLocaleString("en-US")}{" "}
                characters. You&apos;ve written{" "}
                {message.trim().length.toLocaleString("en-US")}. For a report
                you sent, include its ID, like R-8F2C1A.
              </FieldDescription>
              <FieldError
                id="contact-message-error"
                errors={[fieldState.error]}
              />
            </Field>
          )}
        />
      </FieldGroup>

      {opened > 0 && (
        <Alert ref={noticeRef} tabIndex={-1} className="outline-none">
          <Mail aria-hidden="true" />
          <AlertTitle>
            Your email app should open with the message ready.
          </AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            <p>
              If nothing opened, write to{" "}
              <a
                href={`mailto:${to}`}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {to}
              </a>
              .
            </p>
            <CopyButton value={to} label="Copy address" />
          </AlertDescription>
        </Alert>
      )}

      <div>
        <Button type="submit" size="lg">
          <Mail aria-hidden="true" />
          Open in email app
        </Button>
      </div>
    </form>
  );
}
