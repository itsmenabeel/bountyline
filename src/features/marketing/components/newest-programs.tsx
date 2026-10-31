import { Radar } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgramCard } from "@/features/programs/components/program-card";
import { programEndpoints } from "@/features/programs/endpoints";
import { publicRequest } from "@/lib/api/public";
import type { Paginated } from "@/lib/api/types";
import type { Program } from "@/types/api";

/** The three newest ACTIVE programs (design-plan §7.1). A failed read hides the cards. */
export async function NewestPrograms() {
  await connection();
  let programs: Paginated<Program> | null;
  try {
    programs = await publicRequest(
      programEndpoints.publicList({
        page: 1,
        limit: 3,
        sortBy: "createdAt",
        order: "desc",
      }),
    );
  } catch {
    programs = null;
  }

  if (!programs) {
    return (
      <p className="rounded-xl border bg-card px-4 py-6 text-sm text-muted-foreground">
        We couldn&apos;t load programs right now.{" "}
        <Link
          href="/programs"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Open the directory
        </Link>{" "}
        to try again.
      </p>
    );
  }
  if (programs.items.length === 0) {
    return (
      <div className="rounded-xl border bg-card">
        <EmptyState
          icon={Radar}
          title="No active programs yet."
          description="Programs show here once an owner publishes one."
          action={
            <Button asChild>
              <Link href="/register">Run a program</Link>
            </Button>
          }
        />
      </div>
    );
  }
  return (
    <div className="reveal-group grid gap-4 md:grid-cols-3">
      {programs.items.map((program) => (
        <ProgramCard
          key={program.id}
          program={program}
          href={`/programs/${program.id}`}
          headingLevel="h3"
        />
      ))}
    </div>
  );
}

export function NewestProgramsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3" aria-hidden="true">
      {["a", "b", "c"].map((key) => (
        <Skeleton key={key} className="h-72 rounded-xl" />
      ))}
    </div>
  );
}
