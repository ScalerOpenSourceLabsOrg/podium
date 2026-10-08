# Podium

Open source hackathon management. Registration, teams, submissions, judging,
results — self-hosted, so your event's data stays yours.

Built and maintained by the CherryPick open source club.

## What makes it different

Most hackathon platforms split judges across separate sets of projects and then
rank by raw average. Those averages are not comparable: a team judged by strict
judges loses to an equal team judged by generous ones. Podium has every judge
score a small shared anchor set, estimates each judge's bias from it, and ranks
on normalized scores — showing organizers both the raw and adjusted rankings so
they can see what changed and why.

It also returns written feedback to every team, not just the winners.

## Setup

Requires Node (see `.nvmrc`) and Docker.

```bash
git clone https://github.com/<org>/podium.git
cd podium
cp .env.example .env
docker compose up -d db      # Postgres on :5432
npm install
npx prisma migrate dev
npm run seed                 # a full fake event: teams, judges, part-scored
npm run dev
```

Open http://localhost:3000. The seed output prints login details for a sample
organizer, participant, and judge.

### Signing in locally

Seeded accounts use `@podium.test` addresses, which have no mailbox, so neither
GitHub nor a magic link can reach them. In development the sign-in page offers a
third option, **Seeded user (development only)**: type any seeded address and
you are signed in as that user. No password, no email. The seed prints one
address for each role.

This provider is registered only when `NODE_ENV !== "production"`. It is not a
config flag and not an environment variable — `next build` folds the condition
away and drops the provider from the bundle, so a production build has no
password-less sign-in to turn on.

One consequence: a credentials sign-in always issues a JWT cookie, which a
database session cannot read back, so development runs on JWT sessions while
production keeps database sessions. If you are testing anything that touches the
`Session` table, test it against a production build.

To sign in the way production does:

- **GitHub** — create an OAuth app (callback
  `http://localhost:3000/api/auth/callback/github`), set `GITHUB_ID` and
  `GITHUB_SECRET`, then sign in with your own GitHub account and give that user
  the role you want in the database.
- **Email** — set `RESEND_API_KEY`, and change the seeded addresses in
  `prisma/seed-fixtures.ts` to mailboxes you can actually read.

If setup takes more than ten minutes, that is a bug — please open an issue.

## Docs

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — where code lives and why
- [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) — what the tables mean
- [`docs/GLOSSARY.md`](docs/GLOSSARY.md) — the vocabulary, use these words
- [`docs/SCOPE.md`](docs/SCOPE.md) — what v1 is, and what it is not
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — why things are the way they are
- [`docs/SELF_HOSTING.md`](docs/SELF_HOSTING.md) — running it for your own event

## Contributing

New contributors welcome — see [`CONTRIBUTING.md`](CONTRIBUTING.md) and the
[`good first issue`](../../issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
label. We aim to respond to every PR within 48 hours.

## Licence

MIT. See [`LICENSE`](LICENSE).
