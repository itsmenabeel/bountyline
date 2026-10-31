import Link from "next/link";
import { CopyButton } from "@/components/shared/copy-button";
import { Card, CardContent } from "@/components/ui/card";
import { ContactForm } from "@/features/contact/components/contact-form";
import { PageIntro } from "@/features/marketing/components/page-intro";
import { publicEnv } from "@/lib/env/public";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Contact",
  description:
    "Write to the Bountyline team about a program, a report, a payment, or your account.",
  path: "/contact",
});

export default function ContactPage() {
  const to = publicEnv.NEXT_PUBLIC_CONTACT_EMAIL;

  return (
    <div className="mx-auto grid w-full max-w-page gap-10 px-4 py-12 md:px-6 md:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
      <div className="flex flex-col gap-8">
        <PageIntro eyebrow="Contact" title="Write to the team.">
          <p>
            The form opens your email app with your message filled in, and you
            send it from there. We reply to the address you send from.
          </p>
        </PageIntro>
        <section
          aria-labelledby="contact-direct"
          className="flex flex-col gap-3 rounded-xl border bg-card p-5"
        >
          <h2 id="contact-direct" className="font-semibold">
            Prefer to write directly?
          </h2>
          <a
            href={`mailto:${to}`}
            className="font-mono text-sm break-all text-primary underline-offset-4 hover:underline"
          >
            {to}
          </a>
          <div>
            <CopyButton value={to} label="Copy address" />
          </div>
        </section>
        <p className="text-sm text-muted-foreground">
          Many answers are in the{" "}
          <Link
            href="/faq"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            FAQ
          </Link>
          : funding limits, editing reports, and payments.
        </p>
      </div>
      <Card>
        <CardContent>
          <ContactForm to={to} />
        </CardContent>
      </Card>
    </div>
  );
}
