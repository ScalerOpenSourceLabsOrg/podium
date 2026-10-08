# Self-hosting

Podium is meant to be run by the club holding the event, on infrastructure
that club controls. Two supported routes.

## Option A — Docker on any VPS

Works on the cheapest tier anywhere. Requires Docker and a domain.

```bash
git clone https://github.com/<org>/podium.git
cd podium
cp .env.example .env     # fill in every value, see below
docker compose up -d
docker compose exec app npx prisma migrate deploy
```

Put a reverse proxy (Caddy or nginx) in front for TLS. Nothing in Podium
terminates TLS itself.

## Option B — Vercel + a managed Postgres

Push the repo, connect it on Vercel, set the environment variables, point
`DATABASE_URL` at a hosted Postgres.

**Read this before choosing Vercel.** Their free Hobby tier is restricted to
personal, non-commercial use, and if a sponsored event counts as commercial for
your club, Hobby is not the right plan. More importantly, exceeding a Hobby
limit does not produce a bill — it pauses the resource, in most cases until the
30-day window rolls over. A pause starting six hours into your hackathon is not
recoverable. Option A costs a few hundred rupees a month and has no such
failure mode.

## Environment

| Variable | What it is |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `AUTH_SECRET` | Random 32+ bytes. `openssl rand -base64 32` |
| `AUTH_URL` | Your public base URL |
| `GITHUB_ID` / `GITHUB_SECRET` | GitHub OAuth app credentials |
| `RESEND_API_KEY` | Transactional email |
| `EMAIL_FROM` | Sender address on a domain you control |

### GitHub OAuth

Create an OAuth app under your organization's settings. Callback URL is
`https://yourdomain/api/auth/callback/github`.

### Email

Judges authenticate by emailed link, so email is load-bearing — if it does not
work, judging does not work. Verify your domain with your email provider and
add the DNS records it asks for. Sending from an unverified sandbox address
will land in spam, and a judge who cannot find their link at 4pm on demo day is
a real problem.

Free tiers usually cap daily sends. That is fine for a dozen judges and not
fine for a blast to 300 registrants — batch those, or upgrade for the month.

## Before your event

- [ ] Run a full rehearsal on the real deployment with seed data.
- [ ] Export every CSV once and confirm the files open.
- [ ] Send yourself a judge magic link from the production domain.
- [ ] Take a database backup, and know the restore command.
- [ ] Print the roster and a blank score sheet. If everything fails, the event
      still has to finish.

That last line is not pessimism. Devpost ships printable score sheets for the
same reason.

## Backups

`pg_dump` on a cron, off the same machine. During an event, dump hourly.
Rehearse a restore at least once — an untested backup is not a backup.
