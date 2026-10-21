export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-4 px-4 py-24">
      <p className="font-mono text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Bug bounty and disclosure
      </p>
      <h1 className="text-4xl font-semibold tracking-tight">
        Bug reports, triaged and paid from one funded pool.
      </h1>
      <p className="max-w-prose text-lg text-muted-foreground">
        Companies fund a bounty pool through Stripe. Researchers report what
        they find, and our triage team pays valid reports from that pool.
      </p>
    </main>
  );
}
