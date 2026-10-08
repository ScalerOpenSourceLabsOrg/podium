## What this changes

<!-- One or two sentences. Link the issue: Closes #123 -->

## How I tested it

<!-- What you clicked, or which test you added. "Ran the seed and joined a
     team as two different users" is a perfectly good answer. -->

## Checklist

- [ ] `npm run lint && npm run typecheck && npm test` passes
- [ ] Prisma is only imported in `lib/queries/`
- [ ] Any new server action starts with a Zod `safeParse`
- [ ] Any new query filters by `eventId`
- [ ] Added a test if I touched `lib/scoring/`

## Anything you want a second opinion on?

<!-- Optional. Genuinely useful — flag the bit you were unsure about and
     we'll look there first. -->
