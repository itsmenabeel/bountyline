import { LogIn, SendHorizontal } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTransition } from "@/features/marketing/components/page-transition";
import { ProgramDetail } from "@/features/programs/components/program-detail";
import { ProgramDetailSkeleton } from "@/features/programs/components/program-skeletons";
import { programEndpoints } from "@/features/programs/endpoints";
import { newReportHref } from "@/features/reports/links";
import { publicRequest } from "@/lib/api/public";
import { getVisitor } from "@/lib/auth/visitor";
import { plainExcerpt } from "@/lib/format";
import { isUuid } from "@/lib/ids";
import { pageMetadata } from "@/lib/metadata";

async function loadProgram(id: string) {
  if (!isUuid(id)) notFound();
  return publicRequest(programEndpoints.publicDetail(id));
}

export async function generateMetadata({
  params,
}: PageProps<"/programs/[id]">): Promise<Metadata> {
  const program = await loadProgram((await params).id);
  const excerpt = plainExcerpt(program.description);
  return pageMetadata({
    title: program.title,
    description:
      excerpt.length > 160 ? `${excerpt.slice(0, 157).trimEnd()}…` : excerpt,
    path: `/programs/${program.id}`,
  });
}

/**
 * "Submit a report" for researchers, "Sign in to submit" for visitors, nothing for owners
 * and admins (design-plan §7.1). Reads only the cookies.
 */
async function SubmitAction({ programId }: { programId: string }) {
  const { role } = await getVisitor();
  const target = newReportHref(programId);

  if (role === "RESEARCHER") {
    return (
      <Button asChild size="lg">
        <Link href={target}>
          <SendHorizontal aria-hidden="true" />
          Submit a report
        </Link>
      </Button>
    );
  }
  if (role) return null;
  return (
    <div className="flex flex-col gap-2">
      <Button asChild size="lg">
        <Link href={`/login?next=${encodeURIComponent(target)}`}>
          <LogIn aria-hidden="true" />
          Sign in to submit
        </Link>
      </Button>
      <p className="text-xs text-muted-foreground">
        Reports come from researcher accounts.{" "}
        <Link
          href="/register"
          className="font-medium whitespace-nowrap text-primary underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}

async function Program({ params }: PageProps<"/programs/[id]">) {
  const program = await loadProgram((await params).id);
  return (
    <div className="rise-in">
      <ProgramDetail
        program={program}
        directory={{ href: "/programs", label: "Programs" }}
        action={
          <Suspense fallback={<Skeleton className="h-11 w-full" />}>
            <SubmitAction programId={program.id} />
          </Suspense>
        }
      />
    </div>
  );
}

export default function ProgramPage(props: PageProps<"/programs/[id]">) {
  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-page px-4 py-10 md:px-6 lg:px-8">
        <Suspense fallback={<ProgramDetailSkeleton />}>
          <Program {...props} />
        </Suspense>
      </div>
    </PageTransition>
  );
}
