# Bountyline

Frontend for the Bountyline bug bounty and disclosure platform, built with Next.js 16 (App
Router), TypeScript, and Tailwind CSS. It talks to the
[bug-bounty-platform API](https://github.com/itsmenabeel/bug-bounty-platform).

## Run locally

Requires Node.js 20.9 or later.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run check` | Biome lint and format check |
| `npm run format` | Format with Biome |
| `npm run typecheck` | Generate route types, then type-check |
