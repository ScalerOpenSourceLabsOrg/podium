# Contributing

You are welcome here whether this is your first pull request or your five
hundredth. If anything below is unclear, that is our bug — open an issue and
say so.

## Getting set up

Follow the setup in [`README.md`](README.md). `npm run seed` gives you a
realistic event — forty teams, six judges, scores partly filled in — so you can
see your change working immediately.

Stuck? Open an issue with what you tried. Setup problems are the most useful
bug reports we get.

## Finding something to work on

Start with an issue labelled `good first issue`. Each one names the files to
touch. Comment on it to claim it; nobody will take it from under you.

For anything larger, open an issue first and let's agree the shape before you
write code. This is not bureaucracy — it saves you from building something we
then ask you to change.

## The rules

These are enforced in review, and most of them by CI. They exist so the
codebase stays readable by people who did not write it.

1. **Database access only in `lib/queries/`.** Never import `@prisma/client`
   in a page, component, or action. ESLint will fail your build.
2. **Every server action starts with a Zod `safeParse`.** All form input is
   untrusted, including input from a form you wrote yourself.
3. **Server components by default.** Add `"use client"` only where you need
   interactivity, on the smallest component that needs it.
4. **`app/api/` is for webhooks and downloads only.** Use server actions for
   everything the frontend does.
5. **Every query filters by `eventId`.**
6. **`lib/scoring/` stays pure.** No database, no React, no request context.
7. **Use the words in [`docs/GLOSSARY.md`](docs/GLOSSARY.md).** Not
   `participant` or `attendee` — `registrant`.
8. **No new dependencies without asking** in the issue first.

## Style

- Named exports. Default exports only for pages and layouts.
- Files under 200 lines.
- No abstraction until the third repetition. Duplicated code is easier to read
  than a wrong abstraction, and easier to fix later.
- Comments explain *why*, never *what*. If a comment restates the line below
  it, delete the comment.

The reference implementation is `app/dashboard/[slug]/team/`. When in doubt
about structure, copy that.

## Pull requests

- Branch from `main`, one logical change per PR.
- Run `npm run lint && npm run typecheck && npm test` before pushing.
- Add a test if you touched `lib/scoring/`. That is the part where being
  subtly wrong is expensive and invisible.
- Fill in the PR template. "What this changes" and "how you tested it" are
  enough — we are not asking for an essay.
- Draft PRs are welcome. Push early and ask.

**We respond to every PR within 48 hours**, including to say "looks right,
reading properly tomorrow." If we have gone quiet past that, ping the issue.

Review is a conversation, not a verdict. Comments on your PR are about the
code, and getting change requests is the normal path, not a setback.

## Code of conduct

Be decent to people. Harassment, dismissiveness toward beginners, or making
someone feel stupid for asking will get you removed, regardless of how good
your patches are.
