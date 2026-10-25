import Link from "next/link";

/** The line under an auth form that points to the other one ("No account? Create one"). */
export function AuthSwitch({
  prompt,
  href,
  label,
}: {
  prompt: string;
  href: "/login" | "/register";
  label: string;
}) {
  return (
    <p className="text-sm text-muted-foreground">
      {prompt}{" "}
      <Link
        href={href}
        className="rounded-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/70"
      >
        {label}
      </Link>
    </p>
  );
}
