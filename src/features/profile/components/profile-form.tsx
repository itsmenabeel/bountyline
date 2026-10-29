"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { type Failure, FailureAlert } from "@/components/shared/failure-alert";
import { PendingLabel } from "@/components/shared/pending-label";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { clientRequest } from "@/lib/api/client";
import { describedBy } from "@/lib/forms";
import { profileEndpoints } from "../endpoints";
import {
  type ProfileInput,
  type ProfileValues,
  profileSchema,
} from "../schemas";

/**
 * The name form. On save the server parts re-render (`router.refresh()`), so the user menu
 * and comment bylines read the new name from /users/me (implementation-plan §4.6).
 */
export function ProfileForm({ name }: { name: string }) {
  const router = useRouter();
  const [failure, setFailure] = useState<Failure | null>(null);
  const attempts = useRef(0);
  const form = useForm<ProfileValues, unknown, ProfileInput>({
    resolver: zodResolver(profileSchema),
    mode: "onTouched",
    defaultValues: { name },
  });

  const save = useMutation({
    mutationFn: (values: ProfileInput) =>
      clientRequest(profileEndpoints.update(values)),
    meta: { silentToast: true },
    onSuccess: (user) => {
      form.reset({ name: user.name });
      toast.success("Name saved");
      router.refresh();
    },
    onError: (error) => {
      const message = error.fieldErrors.name;
      if (message) form.setError("name", { message });
      attempts.current += 1;
      setFailure({
        message: `We couldn't save your name. ${error.userMessage}`,
        attempt: attempts.current,
      });
    },
  });

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit((values) => {
        if (save.isPending) return;
        setFailure(null);
        save.mutate(values);
      })}
    >
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="profile-name">Name</FieldLabel>
            <Input
              {...field}
              id="profile-name"
              autoComplete="name"
              maxLength={100}
              aria-invalid={fieldState.invalid}
              aria-describedby={describedBy(
                "profile-name-help",
                fieldState.error && "profile-name-error",
              )}
            />
            <FieldDescription id="profile-name-help">
              Shown on your reports and comments.
            </FieldDescription>
            <FieldError id="profile-name-error" errors={[fieldState.error]} />
          </Field>
        )}
      />
      {failure && <FailureAlert failure={failure} />}
      <div>
        <Button
          type="submit"
          disabled={!form.formState.isDirty}
          aria-disabled={save.isPending || undefined}
        >
          {save.isPending ? <PendingLabel>Saving</PendingLabel> : "Save name"}
        </Button>
      </div>
    </form>
  );
}
