# Decisions

One entry per decision: what we chose, why, what we rejected. Written when the
decision is made, not reconstructed later.

**These drafts are starting points. Rewrite each in your own words before the
repo goes public — the point of this file is that a maintainer can defend every
choice in a review thread, and that only works if the reasoning is actually
yours.**

---

## 001 — Next.js App Router, one application

**Chose:** a single Next.js app. Server components read, server actions write.

**Why:** one language, one repo, one dev command, one deployment. A contributor
adding a feature writes a page, an action, and a query — three files in
adjacent directories with no network boundary between them.

**Rejected:** Express or FastAPI as a separate service behind REST. That means
every endpoint written twice, two processes locally, two deployments, and a
second mental model for newcomers. The only gain is a backend a mobile app
could share, which is not on the roadmap.

**Cost:** the server/client split is genuinely confusing at first. Mitigated by
the rule that Prisma lives only in `lib/queries/`.

---

## 002 — Prisma over raw SQL

**Chose:** Prisma as the data layer.

**Why:** `schema.prisma` is the most readable statement of the domain we could
write — a newcomer reads one file and understands the whole model. Autocomplete
on model fields catches typos at compile time rather than at 2am during an
event. Migrations are generated rather than hand-written.

**Rejected:** raw SQL via `postgres.js`. It teaches a transferable skill, gives
clearer error messages, and avoids a codegen step — all real advantages. We
chose Prisma for legibility to beginners, accepting that analytically complex
queries will drop to `$queryRaw`.

**Reversible:** both sit behind `lib/queries/`. Swapping is a contained change.

---

## 003 — Server actions, not an internal REST API

**Chose:** mutations as server actions. `app/api/` reserved for webhooks and
file downloads.

**Why:** removes an entire layer — no endpoint, no fetch wrapper, no
serialization contract to keep in sync. The mutation sits next to the form that
calls it.

**Watch for:** contributors arriving with a separate-backend mental model will
build REST routes reflexively. This is stated in CLAUDE.md and CONTRIBUTING.md
because it will come up in review.

---

## 004 — Multi-tenant from the first migration

**Chose:** `eventId` on every table, `[slug]` in every route.

**Why:** it costs nothing now and is a rewrite later. Podium is meant to be
self-hosted by clubs running several events, and by clubs running events for
several years.

**Not building yet:** org signup, billing, tenant isolation beyond the query
filter. The schema is ready; the product surface is not needed.

---

## 005 — Score normalization with an anchor set

**Chose:** every judge scores a shared set of anchor submissions. Raw scores are
converted to z-scores per judge before ranking.

**Why:** this is the feature Podium exists for. Platforms that split judges
across disjoint project sets and then rank by raw average are comparing numbers
that are not comparable — a team judged by two strict judges loses to an equal
team judged by two generous ones, and nothing in the system corrects for it.
The anchor set is what makes judge bias separable from project quality.

**Rejected:** ranking by raw average (simpler, and wrong); pairwise comparison
models like Bradley-Terry (better, but demands far more judge time than a
college hackathon has).

**Constraint:** organizers always see raw and normalized side by side, and can
override with a recorded reason. A ranking nobody trusts is worse than no
ranking.

---

## 006 — Magic links for judges, GitHub OAuth for everyone else

**Chose:** judges authenticate by emailed single-use link; registrants and
organizers use GitHub.

**Why:** external judges — faculty, industry, alumni — will not create an
account ten minutes before demos start. Registrants all have GitHub already,
and OAuth gives us their handle for free.

**Accepted risk:** possession of the link is authentication. Tokens are long,
single-use, and expire; sessions are logged so a disputed score is traceable.
The blast radius is one judge's scores.

---

## 007 — Zod on every server action

**Chose:** every mutation begins with a Zod `safeParse`.

**Why:** TypeScript is erased at runtime, and `FormData` is untyped strings
from an untrusted client. A judge's score slider is client-side and trivially
bypassed; the server has to be the one enforcing that a 5-point criterion
cannot receive a 7.

**Why a blanket rule:** so nobody has to decide case by case which forms are
trusted. All of them are untrusted.

---

## 008 — Deployable two ways

**Chose:** Vercel plus a working `docker-compose.yml`, and no edge-runtime-only
APIs.

**Why:** Vercel's free tier is restricted to personal, non-commercial use, and
its overage behaviour is to pause rather than bill — a 30-day pause starting
mid-event is unrecoverable. Clubs with sponsors may not qualify at all. Being
self-hostable on a cheap VPS is part of what the project is for.

---

## 009 — Name: Podium

**Chose:** Podium.

**Why:** understandable without git or hackathon vocabulary, and it names what
the software decides rather than the events it hosts. Platform names must sit
at a different level from event names — anything starting with "Hack" collides
with the events themselves.

**Known collision:** an unrelated US SaaS company in customer messaging holds
the obvious domain. Different category, and our users arrive via GitHub and
word of mouth. Namespaced under the club's org to disambiguate.

**Rejected:** git-command names (Bisect, Reflog) — opaque to an audience still
learning git. HackArena — already used by several live college hackathons,
including one in Bengaluru.
