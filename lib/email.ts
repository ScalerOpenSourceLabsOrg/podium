import { Resend } from "resend";

// Four emails, listed in docs/SCOPE.md. Adding a fifth is a scope decision,
// not a code decision.
const resend = new Resend(process.env.RESEND_API_KEY);
// Both are required: docs/SELF_HOSTING.md refuses to start judging without
// a working sender, because magic links are how judges get in at all.
const from = process.env.EMAIL_FROM!;

async function send(to: string, subject: string, html: string) {
  await resend.emails.send({ from, to, subject, html });
}

export async function sendJudgeMagicLink(
  to: string,
  eventName: string,
  url: string,
) {
  await send(
    to,
    `Judging for ${eventName}`,
    `<p><a href="${url}">Open your judging queue</a></p>`,
  );
}

export async function sendJudgingStarted(
  to: string,
  eventName: string,
  url: string,
) {
  await send(
    to,
    `${eventName}: judging is open`,
    `<p><a href="${url}">Start judging</a></p>`,
  );
}

export async function sendSubmissionReceipt(
  to: string,
  eventName: string,
  title: string,
) {
  await send(
    to,
    `${eventName}: submission received`,
    `<p>We have your entry: ${title}.</p>`,
  );
}

export async function sendWinnersAnnounced(
  to: string,
  eventName: string,
  url: string,
) {
  await send(
    to,
    `${eventName}: results are out`,
    `<p><a href="${url}">See the winners</a></p>`,
  );
}
