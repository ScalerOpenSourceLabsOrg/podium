# Architecture

Podium is one Next.js application. There is no separate backend service, no
REST API for our own frontend, and no client-side data fetching. If you are
looking for `server/` or `controllers/`, they do not exist — read on.

## Two execution contexts, one codebase

Files under `app/` are React components that run **on the server by default**.
They can query the database directly; only rendered HTML reaches the browser.
A file becomes client-side when it starts with `"use client"`, which you add
only when it needs `useState`, an `onClick`, or a browser API.

Writes go through **server actions**: async functions marked `"use server"`
that run on the server but are called from a browser form as if they were
local. No fetch, no JSON plumbing, no endpoint to keep in sync.

## Layout

```
app/          routes. Folder name = URL segment. page.tsx renders,
              actions.ts mutates, layout.tsx guards.
components/   shared UI. ui/ is shadcn primitives, shared/ is ours.
lib/queries/  every database call. The only place Prisma is imported.
lib/scoring/  assignment, normalization, ranking. Pure functions.
lib/schemas/  Zod schemas, one file per form domain.
prisma/       schema and migrations.
tests/        Vitest. scoring/ is unit, queries/ is integration.
```

Four boundaries are enforced rather than suggested:

**Prisma only in `lib/queries/`.** ESLint fails the build otherwise. This
keeps SQL concerns out of components and means the data layer can be swapped
without touching a single page.

**`lib/scoring/` has no dependencies.** It takes arrays of scores and returns
rankings. No Prisma, no React, no request. This is the one part of the app
where correctness genuinely matters, and having it isolated is what makes it
testable in milliseconds.

**Auth in layouts.** `app/judge/[slug]/layout.tsx` calls `requireJudge()`
once; every page beneath it inherits the guard. Add a page under a guarded
segment and it is protected without you remembering to do anything.

**`[slug]` in every route.** The event is in the URL, so it is in every query.
Tenancy cannot be forgotten.

## A read, end to end

1. Browser requests `/e/hackday-26/gallery`.
2. `app/(public)/e/[slug]/gallery/page.tsx` runs on the server.
3. It awaits `getGallerySubmissions(slug)` from `lib/queries/submissions.ts`.
4. That function calls Prisma, filtered by event and `visibility: GALLERY`.
5. The component renders HTML. The browser receives markup, not data.

## A write, end to end

1. A form in `app/dashboard/[slug]/team/page.tsx` has `action={joinTeam}`.
2. `joinTeam` lives in the sibling `actions.ts` and starts with `"use server"`.
3. It calls `requireUser()`, then `TeamJoinSchema.safeParse(formData)`.
4. On failure it returns `{ errors }` and the form renders them inline.
5. On success it calls `addMember()` from `lib/queries/teams.ts`.
6. It calls `revalidatePath()` so the page re-renders with fresh data.

Every mutation in this codebase follows those six steps. If yours does not,
it is probably wrong.

## Why this shape

The alternative — Express or FastAPI behind a REST API — means writing every
endpoint twice, running two processes, deploying two things, and handing a
new contributor two mental models. The only thing it buys is a backend a
mobile app could share, which is not on the roadmap. See `docs/DECISIONS.md`.
