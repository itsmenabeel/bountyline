import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Overview" };

export default function ResearcherOverviewPage() {
  return (
    <PageHeader
      title="Overview"
      description="Track your reports and what they've earned."
    />
  );
}
