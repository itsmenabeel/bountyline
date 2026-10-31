import { RegisterForm } from "@/features/auth/components/register-form";
import { PageTransition } from "@/features/marketing/components/page-transition";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Create an account",
  description:
    "Create a Bountyline account to report vulnerabilities or run a bug bounty program.",
  path: "/register",
});

export default function RegisterPage() {
  return (
    <PageTransition>
      <div className="flex w-full max-w-xl flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            Create your account
          </h1>
          <p className="text-muted-foreground">
            Report bugs to funded programs, or run a program of your own.
          </p>
        </div>
        <RegisterForm />
      </div>
    </PageTransition>
  );
}
