import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Overview" };

export default function OwnerOverviewPage() {
  return (
    <PageHeader
      title="Overview"
      description="Your programs and the reports coming in."
    />
  );
}
