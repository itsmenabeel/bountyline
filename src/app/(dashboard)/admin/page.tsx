import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Overview" };

export default function AdminOverviewPage() {
  return (
    <PageHeader
      title="Overview"
      description="Reports waiting for triage and the money moving through the platform."
    />
  );
}
