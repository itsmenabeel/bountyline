import type { Metadata } from "next";
import { LoginPanel } from "@/features/auth/components/login-panel";
import { serverEnv } from "@/lib/env/server";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to Bountyline, or open a demo account as an admin, researcher, or program owner.",
};

export default function LoginPage() {
  // Demo emails are shown on the cards; the passwords never leave the server.
  const demoEmails = {
    ADMIN: serverEnv.DEMO_ADMIN_EMAIL,
    PROGRAM_OWNER: serverEnv.DEMO_OWNER_EMAIL,
    RESEARCHER: serverEnv.DEMO_RESEARCHER_EMAIL,
  };

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-muted-foreground">Pick up where you left off.</p>
      </div>
      <LoginPanel demoEmails={demoEmails} />
    </div>
  );
}
