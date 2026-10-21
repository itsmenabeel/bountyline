export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-4 px-4 py-24">
      <h1 className="text-4xl font-semibold tracking-tight">Bountyline</h1>
      <p className="text-lg">
        Companies fund a bounty pool through Stripe. Researchers report what
        they find, and our triage team pays valid reports from that pool.
      </p>
    </main>
  );
}
