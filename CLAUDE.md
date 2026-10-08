# Podium

Open source hackathon management platform. Organizers run an event end to end:
registration, teams, submissions, judging, results.

Read `docs/ARCHITECTURE.md` before writing code. Read `docs/GLOSSARY.md` before
naming anything. Read `docs/SCOPE.md` before adding a feature.

## Stack

Next.js 15 (App Router), TypeScript (`strict: false`), Prisma, Postgres,
Tailwind, shadcn/ui, Zod, Auth.js, Resend, Vitest.

## Hard rules

- `@prisma/client` is imported ONLY in `lib/queries/`. Never in a page,
  component, or action. ESLint enforces this.
- Every server action starts with a Zod `safeParse` and returns `{ errors }`
  on failure. No exceptions.
- Server components by default. `"use client"` only for interactivity, pushed
  to the smallest leaf component that needs it.
- `app/api/` is for webhooks and file downloads only. Never for our own
  frontend — use server actions.
- Every query filters by `eventId`. Multi-tenancy is not optional.
- `lib/scoring/` is pure functions. No Prisma, no React, no request context,
  no I/O. It takes data and returns data.
- Auth guards live in `layout.tsx`, not in individual pages.
- No new dependencies without asking.

## Where things go

| What                        | Where                                   |
|-----------------------------|-----------------------------------------|
| Route + its UI              | `app/<segment>/page.tsx`                |
| Mutations for that route    | `app/<segment>/actions.ts`              |
| Database access             | `lib/queries/*.ts`                      |
| Validation schemas          | `lib/schemas/*.ts`                      |
| Scoring / ranking logic     | `lib/scoring/*.ts`                      |
| Shared UI                   | `components/shared/`, `components/ui/`  |

## Comments

- Comment WHY, never WHAT. No comment restates the code below it.
- One-line comments only, except above non-obvious algorithms (normalization,
  judge assignment), where a short block explaining the approach is expected.
- No JSDoc on obvious functions. No section-divider banners. No `// TODO`
  without an issue number.

## Style

- Named exports. No default exports except pages and layouts.
- Files under 200 lines. Split when longer.
- No abstraction until the third repetition. Duplicated code is cheaper to
  read than a wrong abstraction.
- `async/await`, never `.then()`.
- Dates stored and compared in UTC; formatted in event-local time at render.

## When working on this repo

- One vertical slice per session. Finish page + action + query + test before
  starting the next feature.
- Follow the existing pattern in `app/dashboard/[slug]/team/` — it is the
  reference implementation for every other route.
- If a change needs a new table or column, stop and ask. Schema changes are
  not incidental.
- If you catch yourself writing a feature listed under "Not in scope" in
  `docs/SCOPE.md`, stop.
