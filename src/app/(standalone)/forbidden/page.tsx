import { LockIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { logout } from "@/features/auth/actions";

export const metadata: Metadata = {
  title: "No access",
  robots: { index: false },
};

// proxy.ts rewrites here and the address bar keeps the requested URL, so nothing on this
// page may depend on the pathname (implementation-plan §4.5).
export default function ForbiddenPage() {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="flex flex-col gap-6">
        <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <LockIcon aria-hidden="true" className="size-5" />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            This page belongs to another role
          </h1>
          <p className="text-muted-foreground">
            Each dashboard opens for one role: admin, program owner, or
            researcher. Your account can't open this one.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {/* Signed-in visitors on /login go to their own dashboard (proxy.ts). */}
          <Button asChild size="lg">
            <Link href="/login" prefetch={false}>
              Go to your dashboard
            </Link>
          </Button>
          <form action={logout}>
            <Button
              type="submit"
              variant="outline"
              size="lg"
              className="w-full"
            >
              Sign out
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
