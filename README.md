# Bountyline

Frontend for Bountyline, a bug bounty and disclosure platform. Organizations fund a reward pool
through Stripe, researchers report vulnerabilities against a program's scope, and a platform
triage team decides each report and pays the valid ones from the pool.

Built with Next.js 16 (App Router), TypeScript, and Tailwind CSS. All data comes from the
[bug-bounty-platform API](https://github.com/itsmenabeel/bug-bounty-platform)
([live Swagger docs](https://bug-bounty-platform-cuna.onrender.com/docs)).

## Try it

The sign-in page has a one-click demo button for each role, so you don't need to type anything.

| Role | Email | Password | What to try |
|---|---|---|---|
| Admin | `admin@bugbounty.dev` | Use the demo button | Work the triage queue, pay an accepted report, ban a user, read the audit log |
| Program owner | `owner@bugbounty.dev` | `Demo@12345` | Create a program with the wizard, fund its pool, follow its reports |
| Researcher | `researcher@bugbounty.dev` | `Demo@12345` | Pick a program, submit a report, check your earnings |

`northwind@bugbounty.dev` (owner), `sam@bugbounty.dev`, and `priya@bugbounty.dev` (researchers)
use the same `Demo@12345` password. Each demo button signs in on the server, so its password
never reaches the browser.

Stripe runs in test mode. Pay with card `4242 4242 4242 4242`, any future date, and any CVC.

The API sleeps on Render's free tier, so the first request after a quiet spell can take most of
a minute. Pages say so when this happens.

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 with Turbopack and Cache Components, React 19, TypeScript in strict mode |
| Styling and components | Tailwind CSS 4, shadcn/ui on Radix, Lucide icons |
| Server state | TanStack Query 5, prefetched on the server and hydrated on the client |
| Client state | Zustand (sidebar, wizard drafts), React Context (session) |
| Forms | React Hook Form with Zod 4, using the backend's validation rules |
| Tables and charts | TanStack Table 8, Recharts 3 |
| Auth | The backend's JWTs in httpOnly cookies, verified in `proxy.ts` with `jose` |
| Payments | Stripe Checkout, created by the backend |
| Tooling | Biome, Vitest |

## Architecture

### Routes

The app has 39 pages in four route groups, each with its own layout:

| Group | Pages | Access |
|---|---|---|
| `(public)` | Home, about, how it works, FAQ, contact, program directory and detail | Anyone |
| `(auth)` | Sign in, register | Signed-out visitors |
| `(dashboard)` | `/researcher`, `/owner`, and `/admin`, each with its own sidebar | That role only |
| `(standalone)` | Payment success and cancel, forbidden | Mixed |

Data routes have a `loading.tsx` skeleton. Public pages and each role area have their own
`error.tsx` and not-found page inside their shell, and root boundaries catch the rest.

### Server and client components

Pages and layouts are Server Components. They read cookies and URL parameters, prefetch data, and
pass it down. `"use client"` appears only where a component needs state, effects, or event
handlers: forms, wizards, dialogs, data tables, and charts. Markdown on server pages renders to
HTML and ships no renderer. Recharts and the Markdown previews load through `next/dynamic`.

### Talking to the API

One request descriptor (`lib/api/request.ts`) works with three transports:

| Transport | Used by | How it reaches the backend |
|---|---|---|
| `serverRequest` | Signed-in Server Components | Directly, with the access token from the cookie |
| `publicRequest` | Signed-out pages | Directly, cached for a minute with `"use cache"` |
| `clientRequest` | Client components | Through the BFF route `/api/bff/[...path]`, which attaches the token |

Browser code never sees a token. Every server-side call also sends the visitor's IP with a shared
secret, so the backend rate-limits each visitor instead of treating them all as one server.

### Authentication and roles

Server actions call the backend and store the tokens in the httpOnly cookies `bb_at` and `bb_rt`.
Roles are enforced in three layers:

1. **`src/proxy.ts`** verifies the access token and refreshes it before it expires. It sends
   signed-out visitors to `/login?next=...` and shows `/forbidden` to the wrong role.
2. **The role layout** checks the role against `GET /users/me`, because the role in a token can lag
   an admin's change by up to 15 minutes.
3. **The backend** checks everything again on each request.

`useSession()` and `<RoleGate>` decide what the interface shows for each role.

### State and URLs

Filters, sorting, search, and pagination live in the URL through `useListParams`, so a copied link
reproduces the view and the back button restores it. Each list page parses the URL with the same
Zod schema on the server and the client.

These actions update the screen at once and roll back if the server refuses: banning and unbanning
a user, posting a comment, and pausing or resuming a program. The program and report wizards keep
their drafts in sessionStorage.

### Payments

1. An owner opens **Fund pool**, and the backend creates a Stripe Checkout session.
2. Stripe sends the browser back to `/payment/success?session_id=...`.
3. The success page reads the payment and, while it's pending, asks the backend to verify it with
   Stripe at 2, 4, and 8 seconds. **Check status** on the Payments page does the same at any time.

So a pool still gets credited if Stripe's webhook misses a sleeping server.

### Project layout

```text
src/
  app/          Routes, layouts, loading and error boundaries, metadata routes
  components/   ui/ (shadcn), shared/ (DataTable, FilterBar, ...), layout/ (shells, navigation)
  features/     One folder per domain: endpoints, queries, schemas, and components together
  hooks/        useListParams, useDebounce, useErrorSummary, and others
  lib/          API transports, auth helpers, env validation, money and date formatting
  stores/       Zustand stores
  types/        API response types
  proxy.ts      Route protection and token refresh
```

## Run locally

Requires Node.js 24 or later, and a running backend: use the live API or follow the
[backend's setup](https://github.com/itsmenabeel/bug-bounty-platform#readme).

```bash
git clone https://github.com/itsmenabeel/bountyline.git
cd bountyline
npm install
cp .env.example .env.local   # then fill in the blank values below
npm run dev
```

Open http://localhost:3000. `next.config.ts` validates the environment at startup, so a missing
or malformed value stops the server with a message naming it.

| Variable | Value |
|---|---|
| `API_BASE_URL` | Backend URL including `/api/v1`. A local backend is `http://localhost:5000/api/v1` |
| `JWT_ACCESS_SECRET` | The backend's `JWT_ACCESS_SECRET`. At least 32 characters |
| `BFF_SHARED_SECRET` | The backend's `BFF_SHARED_SECRET`. At least 32 characters |
| `DEMO_ADMIN_PASSWORD` | The backend's `SEED_ADMIN_PASSWORD`. A local seed defaults to `Admin@12345` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | The backend's `GOOGLE_CLIENT_ID` |

The secrets must match the backend you point at, so the live API works only if you hold its
secrets. To run everything yourself, start the backend with your own values and use the same ones
here. `.env.example` already fills in the other demo accounts, the site URL, and the contact
address. Google sign-in also needs your origin listed as an authorized JavaScript origin on the
OAuth client.

Stripe's webhook can't reach localhost, so a local payment turns successful through the success
page's verify call.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run check` | Biome lint and format check |
| `npm run format` | Format with Biome |
| `npm run typecheck` | Generate route types, then type-check |
| `npm test` | Run the Vitest unit tests once |
| `npm run test:watch` | Run the tests in watch mode |

The unit tests cover form schemas against the backend's rules, money parsing, URL list parameters,
status transitions, and the API layer.

## Accessibility and motion

Dashboards were audited with axe at phone, tablet, and desktop widths in both themes. Keyboard
paths, dialog focus, and 44px touch targets were checked in a browser. Severity and status always
carry text as well as color, and every chart has a table view.

Public pages use CSS animation only. Visitors who ask for reduced motion see everything in place.
