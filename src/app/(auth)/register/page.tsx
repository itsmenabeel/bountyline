import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Create an account",
  description:
    "Create a Bountyline account to report vulnerabilities or run a bug bounty program.",
};

export default function RegisterPage() {
  return (
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
  );
}
