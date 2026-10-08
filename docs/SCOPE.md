# Scope

The bar for v1 is one sentence:

> **Podium can run one real hackathon end to end without anyone opening a
> spreadsheet.**

Everything below the line is what that requires. Everything in "Not in scope"
waits until after we have watched a few hundred people use it.

## In scope (v1)

### Setup
- Create an event: name, slug, dates for each phase, rules, max team size.
- Define tracks.
- Define judging criteria with weights and max scores.
- Define extra submission questions.
- Public event page rendering all of the above from one source of truth.

### Participation
- Register for an event (GitHub OAuth), with college / year / phone.
- Create a team, join by invite code, leave a team.
- Open-teams browser filtered by the skills teams are looking for.
- Max team size enforced server-side.

### Event day
- Check-in: organizer searches or scans, sets `checkedInAt`.
- Submission form, editable until the deadline, saved as draft.
- Deadline enforced server-side. Countdown in the UI.
- Announcements feed on the event page.

### Judging
- Moderation queue: set `visibility` and `judgeable`, leave organizer notes.
- Generate assignments respecting track eligibility, conflicts, and load
  balance, with an anchor set. Organizer can swap any row by hand.
- Judge view: queue, one submission at a time, score per criterion with a
  required comment, autosaving.
- Magic-link auth for judges.
- Normalization against anchors; raw and normalized rankings shown together.
- Organizer override on final rank, with a required reason.

### Results
- Awards linked to submissions, saved privately, published on a button press.
- Public gallery, searchable by title, tech, and track.
- Feedback release: each team receives its judges' comments, names stripped.
- Certificates for registrants and winners, each with a `/verify/<id>` URL.

### Non-negotiable, cross-cutting
- **CSV export at every stage.** Registrations, teams, submissions,
  assignments, raw scores, final rankings. This is what saves the event when
  something breaks, and it is a v1 feature, not a nice-to-have.
- **Manual override on every automated decision.**
- Email for exactly four things: judge magic link, judging started, submission
  receipt, winners announced.
- Seed script producing a full fake event in one command.
- Deployable two ways: Vercel, and `docker compose up` on a plain VPS.

## Not in scope (v1)

Do not build these. If a feature below seems necessary, open an issue and
argue for it rather than adding it.

- Offline-first check-in (service workers, sync queues)
- Mentor request queue
- Repo integrity checking beyond a single GitHub API call
- Multi-round judging
- Participant / popular voting
- Discord or WhatsApp integration
- Sponsor management, budgets, volunteer scheduling
- Self-serve org signup and billing
- Theming or a site builder
- In-app notifications
- Analytics dashboards
- Mobile app
- Payments
- File uploads of any kind (take YouTube and image URLs instead)

## Deferred, with a reason

**Repo integrity checks** are v1.1, not never. The cheap version — one GitHub
API call for repo creation date and first commit, written to
`integrityFlags` — is about half a day and needs no background jobs. It is out
of v1 only to keep the first release small.

**Offline check-in** is the single most expensive item on the list and the one
most likely to be needed. Revisit after the first event, when we know whether
the venue wifi actually failed.
