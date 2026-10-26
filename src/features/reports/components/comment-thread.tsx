"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { MessageSquare, SendHorizontal } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { useSession } from "@/components/providers/session-provider";
import { QueryError } from "@/components/shared/query-error";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { clientRequest } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";
import { ROLE_LABEL } from "@/lib/constants/domain";
import { formatDate, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ReportComment } from "@/types/api";
import { reportEndpoints } from "../endpoints";
import { COMMENT_PAGE_SIZE, reportKeys } from "../queries";
import { type CommentInput, commentSchema } from "../schemas";

type CommentPages = InfiniteData<Paginated<ReportComment>, number>;

const PENDING_PREFIX = "pending-";

/** Adds a comment to the end of the thread, if the thread's last page is the one on screen. */
function appendComment(data: CommentPages | undefined, comment: ReportComment) {
  const last = data?.pages.at(-1);
  if (!data || !last || last.meta.page < last.meta.totalPages) return data;
  const meta = { ...last.meta, total: last.meta.total + 1 };
  return {
    ...data,
    pages: [
      ...data.pages.slice(0, -1),
      { items: [...last.items, comment], meta },
    ],
  };
}

function CommentItem({
  comment,
  mine,
}: {
  comment: ReportComment;
  mine: boolean;
}) {
  const pending = comment.id.startsWith(PENDING_PREFIX);
  return (
    <li
      className={cn(
        "flex gap-3 transition-opacity duration-(--motion-base)",
        pending && "opacity-60",
      )}
    >
      <Avatar className="mt-0.5 size-8">
        <AvatarFallback className="text-xs font-medium">
          {initials(comment.author.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="font-medium">
            {comment.author.name}
            {mine && <span className="text-muted-foreground"> (you)</span>}
          </span>
          <Badge variant="outline" className="font-normal">
            {ROLE_LABEL[comment.author.role]}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {pending ? (
              "Sending…"
            ) : (
              <time dateTime={comment.createdAt}>
                {formatDate(comment.createdAt)}
              </time>
            )}
          </span>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">
          {comment.body}
        </p>
      </div>
    </li>
  );
}

/**
 * The report's discussion, oldest first, with a box to add to it. A posted comment shows at
 * once, dimmed until the backend confirms it; if the post fails it disappears, the text goes
 * back in the box, and the toast says why (implementation-plan §4.6, "Comment").
 */
export function CommentThread({
  reportId,
  audienceNote,
}: {
  reportId: string;
  /** Who reads these comments, shown under the box. */
  audienceNote: string;
}) {
  const me = useSession();
  const queryClient = useQueryClient();
  const queryKey = reportKeys.comments(reportId);

  const thread = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      clientRequest(
        reportEndpoints.comments(reportId, {
          page: pageParam,
          limit: COMMENT_PAGE_SIZE,
        }),
      ),
    initialPageParam: 1,
    getNextPageParam: ({ meta }) =>
      meta.page < meta.totalPages ? meta.page + 1 : undefined,
  });

  const form = useForm({
    resolver: zodResolver(commentSchema),
    mode: "onSubmit",
    defaultValues: { body: "" },
  });

  const post = useMutation({
    mutationFn: (input: CommentInput) =>
      clientRequest(reportEndpoints.addComment(reportId, input)),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CommentPages>(queryKey);
      const optimistic: ReportComment = {
        id: `${PENDING_PREFIX}${crypto.randomUUID()}`,
        reportId,
        body: input.body,
        createdAt: new Date().toISOString(),
        author: { id: me.id, name: me.name, role: me.role },
      };
      queryClient.setQueryData<CommentPages>(queryKey, (data) =>
        appendComment(data, optimistic),
      );
      form.reset({ body: "" });
      return { previous };
    },
    onError: (_error, input, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
      form.reset({ body: input.body });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const onSubmit = form.handleSubmit((values) => {
    if (!post.isPending) post.mutate(values);
  });

  const comments = thread.data?.pages.flatMap((page) => page.items) ?? [];
  const total = thread.data?.pages.at(-1)?.meta.total;

  return (
    <section aria-labelledby="report-comments" className="flex flex-col gap-4">
      <h2 id="report-comments" className="text-lg font-semibold">
        Comments
        {total !== undefined && total > 0 && (
          <span className="font-normal text-muted-foreground"> ({total})</span>
        )}
      </h2>

      {thread.isPending ? (
        <div className="flex flex-col gap-3" aria-hidden="true">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      ) : thread.isError ? (
        <QueryError
          title="We couldn't load the comments."
          error={thread.error}
          onRetry={() => void thread.refetch()}
          retrying={thread.isFetching}
        />
      ) : comments.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          <MessageSquare aria-hidden="true" className="size-4 shrink-0" />
          No comments yet. Add context here or answer a question from the triage
          team.
        </div>
      ) : (
        <ol className="flex flex-col gap-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              mine={comment.author.id === me.id}
            />
          ))}
        </ol>
      )}

      {thread.hasNextPage && (
        <Button
          variant="outline"
          className="self-start"
          disabled={thread.isFetchingNextPage}
          onClick={() => void thread.fetchNextPage()}
        >
          Show later comments
        </Button>
      )}

      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-3">
        <Controller
          name="body"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="comment-body">Add a comment</FieldLabel>
              <Textarea
                {...field}
                id="comment-body"
                rows={4}
                aria-invalid={fieldState.invalid}
                aria-describedby={
                  fieldState.error
                    ? "comment-body-note comment-body-error"
                    : "comment-body-note"
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    (event.metaKey || event.ctrlKey)
                  ) {
                    event.preventDefault();
                    void onSubmit();
                  }
                }}
              />
              <FieldDescription id="comment-body-note">
                {audienceNote}
              </FieldDescription>
              <FieldError id="comment-body-error" errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Button
          type="submit"
          className="self-start"
          aria-disabled={post.isPending || undefined}
        >
          <SendHorizontal aria-hidden="true" />
          Post comment
        </Button>
      </form>
    </section>
  );
}
