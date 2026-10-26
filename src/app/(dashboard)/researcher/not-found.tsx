import type { Metadata } from "next";
import { DashboardNotFound } from "@/components/shared/dashboard-not-found";
import { ROLE_HOME } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return <DashboardNotFound home={ROLE_HOME.RESEARCHER} />;
}
