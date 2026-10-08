# Data model

The schema is in `prisma/schema.prisma`. This file explains what the tables
mean, which is the part you cannot infer from column names.

## The spine

An **Event** owns everything. Every other row carries `eventId`, even where it
could be reached by walking a relation, so that no query can accidentally read
across events. Podium is multi-tenant from the first migration — one deployment
runs many hackathons, for one club or several.

**Users** are global; their relationship to an event is not. A person can
organize one hackathon and judge another. That relationship lives in
**EventMembership** (`ORGANIZER` or `JUDGE`). Participants are deliberately
*not* memberships — a participant has a **Registration**, which is where
college, year, and check-in time live.

## Teams and submissions

A **Team** belongs to an event and holds **TeamMembers**, one of whom is
`LEADER`. `inviteCode` is how people join; `lookingFor` is a string array of
skills the team still needs, which powers the open-teams browser.

A **Submission** is a team's project entry — at most one per team, enforced by
a unique constraint on `teamId`. It starts as `DRAFT` and becomes `SUBMITTED`.
`submittedAt` is the authoritative deadline record; the countdown in the UI is
decoration, and the check happens server-side.

Two flags on Submission are easy to conflate:

- `visibility` (`PENDING` / `GALLERY` / `HIDDEN`) controls whether the public
  can see it.
- `judgeable` controls whether it goes to judges.

They are independent. An organizer's demo project might be visible but not
judged; a withdrawn entry might be judged but hidden. Devpost models these
separately too, for the same reason.

`customAnswers` is JSON keyed against `Event.submissionFormSchema`. Organizers
always want one extra question, and this avoids a migration per hackathon.

`integrityFlags` holds the output of automated checks — repo creation date
against event start, first commit timestamp. **Advisory only.** Nothing in the
system disqualifies anyone; a human reads the flag and decides.

## Judging

This is the part worth reading carefully, because it is what Podium exists for.

A **Criterion** is one row of the rubric: a name, a `maxScore`, and a `weight`.
Criteria belong to the event, so every judge scores against the same rubric.

An **Assignment** is a `(judge, submission, round)` triple — one judge's
obligation to score one project. Assignments are *generated* by
`lib/scoring/assign.ts` respecting track eligibility, conflicts of interest,
and load balance, then freely edited by an organizer. Generation is a
convenience, never an authority.

A **Score** hangs off an assignment, one per criterion, with a required
comment. The comment is not optional by accident: releasing written feedback
to every team, not just winners, is a deliberate feature.

### Anchors, and why they exist

`Assignment.isAnchor` marks a submission that **every** judge scores.

Without anchors you cannot compare judges. If judge A scores projects 1–10 and
judge B scores 11–20, A's lower average might mean A is strict, or it might
mean projects 1–10 were weaker. The two explanations are indistinguishable
from the data. A shared anchor set breaks the tie: differences on the *same*
projects are attributable to the judge.

`lib/scoring/normalize.ts` uses the anchor set to estimate each judge's mean
and spread, converts raw scores to z-scores, applies criterion weights, and
ranks. Organizers always see raw and normalized rankings side by side — the
normalized one has to earn trust before anyone will act on it.

## Results

An **Award** links a name ("Best Use of AI") to a submission, optionally scoped
to a track. `submissionId` stays null until winners are chosen, and
`winnersPublic` on the event controls the reveal, so results can be decided
privately and announced on stage.

`overrideReason` is required whenever an organizer picks a winner other than
the computed top rank. Overrides are expected and fine — recording why they
happened is what makes the process defensible six months later.
