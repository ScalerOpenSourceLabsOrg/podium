# Glossary

Use these words. Do not introduce synonyms — if you find yourself writing
`attendee` or `participant` in code, the word is **registrant**.

**Event** — one hackathon. Owns everything else. Identified in URLs by `slug`.

**Organizer** — runs the event. Full access to one event's admin screens.

**Judge** — scores assigned submissions. Usually external, authenticated by
magic link rather than GitHub.

**Registrant** — a person signed up for an event. Represented by a
`Registration`, not by an `EventMembership`.

**Team** — a group of registrants entering together. Has a leader, an invite
code, and a `lookingFor` list of skills it still needs.

**Submission** — a team's project entry. At most one per team per event.

**Track** — a themed category submissions compete in. Also used to decide
which judges are eligible to score which submissions.

**Criterion** — one row of the judging rubric, with a weight and a max score.

**Rubric** — the full set of criteria for an event.

**Assignment** — a `(judge, submission, round)` pairing. Generated, then
editable by an organizer.

**Anchor** — a submission every judge scores, used to estimate judge bias.
See `docs/DATA_MODEL.md`.

**Raw score** — what a judge actually entered, before any adjustment.

**Normalization** — converting raw scores to z-scores per judge, using the
anchor set, so that judges who grade on different scales can be compared.

**Ranking** — the ordered result of applying criterion weights to normalized
scores, computed per track and overall.

**Override** — an organizer choosing a winner other than the computed top
rank. Always requires a recorded reason.

**Award** — a named prize, optionally scoped to a track, linked to a winning
submission.

**Gallery** — the public list of approved submissions, shown after the event.

**Moderation** — the organizer pass over submissions that sets `visibility`
and `judgeable` before judging starts.

**Check-in** — marking a registrant physically present. Sets `checkedInAt`.

## Words we do not use

| Don't write   | Write         |
|---------------|---------------|
| attendee      | registrant    |
| participant   | registrant    |
| project       | submission    |
| entry         | submission    |
| category      | track         |
| score sheet   | rubric        |
| admin         | organizer     |
| reviewer      | judge         |
