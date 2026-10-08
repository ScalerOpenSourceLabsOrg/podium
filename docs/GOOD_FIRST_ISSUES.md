# Good first issues to file

Paste these into GitHub as issues before announcing the repo, labelled
`good first issue`. They assume the team slice is already built and working —
file them once `app/dashboard/[slug]/team/` exists as a pattern to copy.

An issue on this list is not a good first issue if a newcomer has to make a
design decision to finish it. Each one below names the files and the expected
shape.

---

### 1. Filter the open-teams list by skill

**Files:** `app/dashboard/[slug]/teams/page.tsx`, `lib/queries/teams.ts`

The open-teams page lists every team that is still accepting members. Add a
dropdown of skills (derived from the distinct values across `lookingFor`) that
filters the list. Put the selected skill in the URL as a search param so the
filtered view is linkable, and pass it into the query rather than filtering in
the component.

**Done when:** selecting a skill narrows the list, the URL updates, reloading
the page preserves the filter.

---

### 2. Show a countdown to the submission deadline

**Files:** `components/shared/Countdown.tsx` (new),
`app/dashboard/[slug]/submission/page.tsx`

Display time remaining until `submissionClosesAt`, updating every second. This
is one of the few components that genuinely needs `"use client"`. Render the
event's timezone, not the browser's.

The countdown is decoration — the deadline is already enforced server-side.
Do not add any client-side blocking based on it.

**Done when:** the countdown ticks, shows "Closed" past the deadline, and does
not crash when the date is null.

---

### 3. Add an empty state to the gallery

**Files:** `components/shared/EmptyState.tsx` (new),
`app/(public)/e/[slug]/gallery/page.tsx`

The gallery currently renders nothing when there are no approved submissions.
Build a small reusable empty state (icon, heading, one line of explanation) and
use it there. Keep it generic enough to reuse on the teams and submissions
pages later.

**Done when:** an event with no gallery submissions shows the empty state.

---

### 4. Copy-to-clipboard on the team invite code

**Files:** `app/dashboard/[slug]/team/page.tsx`

The invite code is displayed as text. Add a button that copies it and shows
confirmation for two seconds. Small client component, no server involvement.

**Done when:** clicking copies the code and gives visible feedback.

---

### 5. Sort the gallery

**Files:** `app/(public)/e/[slug]/gallery/page.tsx`, `lib/queries/submissions.ts`

Add sorting by newest, oldest, and title. Same pattern as issue 1 — search
param in the URL, sorting done in the query, not the component.

**Done when:** each option reorders the list and survives a page reload.

---

### 6. Write tests for `rank.ts`

**Files:** `tests/scoring/rank.test.ts`

Slightly harder, and a good second issue. `lib/scoring/rank.ts` applies
criterion weights to normalized scores and orders submissions. Cover: single
judge, several judges, tied totals, a criterion with zero weight, and an empty
input. No database needed — these are pure functions over arrays.

**Done when:** tests pass and cover the cases above.
