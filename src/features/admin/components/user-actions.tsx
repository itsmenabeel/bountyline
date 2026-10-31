"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import { type RefObject, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { type Failure, FailureAlert } from "@/components/shared/failure-alert";
import { PendingLabel } from "@/components/shared/pending-label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { programKeys } from "@/features/programs/queries";
import { clientRequest } from "@/lib/api/client";
import type { ApiError } from "@/lib/api/errors";
import type { Paginated } from "@/lib/api/types";
import { ACCOUNT_ROLE_LABEL } from "@/lib/constants/domain";
import { describedBy } from "@/lib/forms";
import {
  ROLES,
  type Role,
  type User,
  type UserStatusResult,
} from "@/types/api";
import { adminEndpoints } from "../endpoints";
import { adminKeys } from "../queries";
import {
  BAN_REASON_MAX,
  type BanValues,
  banRequest,
  banSchema,
  ROLE_NOUN,
  roleChangeText,
  statusDoneText,
  userChangeFailure,
} from "../users";

type UserPages = Paginated<User>;

const replaceUser = (page: UserPages | undefined, user: User) =>
  page && {
    ...page,
    items: page.items.map((row) => (row.id === user.id ? user : row)),
  };

/**
 * Ban and unban (design-plan §9.3, implementation-plan §4.6): the row flips at once in every
 * cached user list, rolls back if the backend refuses, and the toast reports any programs the
 * ban paused. Lists refetch afterwards, since a status filter may no longer match.
 */
function useChangeStatus() {
  const queryClient = useQueryClient();
  return useMutation<
    UserStatusResult,
    ApiError,
    { user: User; isActive: boolean; reason?: string },
    { snapshots: [readonly unknown[], UserPages | undefined][] }
  >({
    mutationFn: ({ user, isActive, reason }) =>
      clientRequest(
        adminEndpoints.changeStatus(user.id, banRequest(isActive, reason)),
      ),
    meta: { silentToast: true },
    onMutate: async ({ user, isActive }) => {
      await queryClient.cancelQueries({ queryKey: adminKeys.users() });
      const snapshots = queryClient.getQueriesData<UserPages>({
        queryKey: adminKeys.users(),
      });
      queryClient.setQueriesData<UserPages>(
        { queryKey: adminKeys.users() },
        (page) => replaceUser(page, { ...user, isActive }),
      );
      return { snapshots };
    },
    onError: (error, _variables, context) => {
      for (const [key, page] of context?.snapshots ?? []) {
        queryClient.setQueryData(key, page);
      }
      toast.error(userChangeFailure(error, "status"));
    },
    onSuccess: ({ pausedPrograms, ...user }) => {
      queryClient.setQueriesData<UserPages>(
        { queryKey: adminKeys.users() },
        (page) => replaceUser(page, user),
      );
      toast.success(statusDoneText(user, pausedPrograms));
      if (pausedPrograms > 0) {
        void queryClient.invalidateQueries({ queryKey: programKeys.all });
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: adminKeys.users() }),
  });
}

function BanDialog({
  user,
  open,
  onOpenChange,
  onBan,
  returnFocusTo,
}: {
  user: User;
  returnFocusTo: RefObject<HTMLButtonElement | null>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBan: (reason: string) => void;
}) {
  const form = useForm<BanValues>({
    resolver: zodResolver(banSchema),
    mode: "onTouched",
    defaultValues: { reason: "" },
  });
  const ownerNote =
    user.role === "PROGRAM_OWNER"
      ? " Their active programs pause, and they stay paused after an unban until the owner resumes them."
      : "";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) form.reset({ reason: "" });
        onOpenChange(next);
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocusTo.current?.focus();
        }}
      >
        <form
          noValidate
          className="flex flex-col gap-5"
          onSubmit={form.handleSubmit(({ reason }) => {
            onOpenChange(false);
            onBan(reason);
          })}
        >
          <DialogHeader>
            <DialogTitle>Ban {user.name}?</DialogTitle>
            <DialogDescription>
              {user.name} gets signed out and can&apos;t sign back in until you
              unban them.{ownerNote}
            </DialogDescription>
          </DialogHeader>
          <Controller
            name="reason"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`ban-reason-${user.id}`}>
                  Reason (optional)
                </FieldLabel>
                <Textarea
                  {...field}
                  id={`ban-reason-${user.id}`}
                  rows={3}
                  aria-invalid={fieldState.invalid}
                  aria-describedby={describedBy(
                    `ban-reason-${user.id}-help`,
                    fieldState.error && `ban-reason-${user.id}-error`,
                  )}
                />
                <FieldDescription id={`ban-reason-${user.id}-help`}>
                  The audit log keeps it. Up to {BAN_REASON_MAX} characters.
                </FieldDescription>
                <FieldError
                  id={`ban-reason-${user.id}-error`}
                  errors={[fieldState.error]}
                />
              </Field>
            )}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive">
              Ban user
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RoleDialog({
  user,
  open,
  onOpenChange,
  returnFocusTo,
}: {
  user: User;
  returnFocusTo: RefObject<HTMLButtonElement | null>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [role, setRole] = useState<Role | undefined>();
  const [failure, setFailure] = useState<Failure | null>(null);
  const attempts = useRef(0);
  const choices = ROLES.filter((option) => option !== user.role);

  const change = useMutation({
    mutationFn: (next: Role) =>
      clientRequest(adminEndpoints.changeRole(user.id, next)),
    meta: { silentToast: true },
    onSuccess: (updated) => {
      queryClient.setQueriesData<UserPages>(
        { queryKey: adminKeys.users() },
        (page) => replaceUser(page, updated),
      );
      void queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      toast.success(`${updated.name} is now ${ROLE_NOUN[updated.role]}`);
      onOpenChange(false);
    },
    onError: (error) => {
      attempts.current += 1;
      setFailure({
        message: userChangeFailure(error, "role"),
        attempt: attempts.current,
      });
    },
  });
  const selectId = `role-${user.id}`;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (change.isPending) return;
        if (next) {
          setRole(undefined);
          setFailure(null);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocusTo.current?.focus();
        }}
      >
        <form
          noValidate
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (!role || change.isPending) return;
            setFailure(null);
            change.mutate(role);
          }}
        >
          <DialogHeader>
            <DialogTitle>Change {user.name}&apos;s role</DialogTitle>
            <DialogDescription>
              {user.name} is {ROLE_NOUN[user.role]} now.
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor={selectId}>New role</FieldLabel>
            <Select
              value={role ?? ""}
              onValueChange={(next) => setRole(next as Role)}
            >
              <SelectTrigger
                id={selectId}
                className="w-full"
                aria-describedby={role ? `${selectId}-means` : undefined}
              >
                <SelectValue placeholder="Choose a role" />
              </SelectTrigger>
              <SelectContent>
                {choices.map((option) => (
                  <SelectItem key={option} value={option}>
                    {ACCOUNT_ROLE_LABEL[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {role && (
              <FieldDescription id={`${selectId}-means`}>
                {roleChangeText(user, role)}
              </FieldDescription>
            )}
          </Field>
          {failure && <FailureAlert failure={failure} />}
          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={change.isPending}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={!role}
              aria-disabled={change.isPending || undefined}
            >
              {change.isPending ? (
                <PendingLabel>Changing role</PendingLabel>
              ) : (
                "Change role"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * A user row's menu: change role (select, then confirm) and ban or unban. The admin's own
 * row has none, since the backend refuses both for your own account.
 */
export function UserActions({ user, isSelf }: { user: User; isSelf: boolean }) {
  const [dialog, setDialog] = useState<"role" | "ban" | null>(null);
  const status = useChangeStatus();
  // The menu has closed by the time a dialog does, so the dialog sends focus back itself.
  const menuButton = useRef<HTMLButtonElement>(null);

  if (isSelf) {
    return <span className="text-xs text-muted-foreground">Your account</span>;
  }

  return (
    <>
      {/* Not modal: a modal menu closing as a dialog opens can leave the page inert. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            ref={menuButton}
            variant="ghost"
            size="icon"
            aria-label={`Actions for ${user.name}`}
          >
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setDialog("role")}>
            Change role
          </DropdownMenuItem>
          {user.isActive ? (
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setDialog("ban")}
            >
              Ban user
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onSelect={() => status.mutate({ user, isActive: true })}
            >
              Unban user
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <RoleDialog
        user={user}
        returnFocusTo={menuButton}
        open={dialog === "role"}
        onOpenChange={(open) => setDialog(open ? "role" : null)}
      />
      <BanDialog
        user={user}
        returnFocusTo={menuButton}
        open={dialog === "ban"}
        onOpenChange={(open) => setDialog(open ? "ban" : null)}
        onBan={(reason) => status.mutate({ user, isActive: false, reason })}
      />
    </>
  );
}
