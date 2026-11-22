import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type SubmissionInput = {
  title: string;
  tagline?: string;
  descriptionMd?: string;
  repoUrl?: string;
  demoUrl?: string;
  videoUrl?: string;
  trackId?: string | null;
  tech?: string[];
  customAnswers?: Record<string, unknown>;
};

async function validateSubmissionContext(eventId: string, trackId?: string | null) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { submissionOpensAt: true, submissionClosesAt: true },
  });
  if (!event) throw new Error("Event not found");

  const now = new Date();
  if (event.submissionOpensAt && now < new Date(event.submissionOpensAt)) {
    throw new Error("Submissions have not opened yet");
  }
  if (event.submissionClosesAt && now > new Date(event.submissionClosesAt)) {
    throw new Error("Submission deadline has passed");
  }

  if (trackId) {
    const track = await prisma.track.findFirst({ where: { id: trackId, eventId } });
    if (!track) throw new Error("Selected track does not belong to this event");
  }
}

export async function getSubmissionForTeam(eventId: string, teamId: string) {
  return prisma.submission.findUnique({
    where: { teamId, eventId },
    include: {
      track: true,
      team: { include: { members: { include: { user: true } } } },
    },
  });
}

export async function saveSubmissionDraft(eventId: string, teamId: string, data: SubmissionInput) {
  await validateSubmissionContext(eventId, data.trackId);
  const { trackId, customAnswers, ...rest } = data;
  const payload = {
    ...rest,
    trackId: trackId || null,
    customAnswers: (customAnswers ?? {}) as Prisma.InputJsonValue,
    status: "DRAFT" as const,
  };

  return prisma.submission.upsert({
    where: { teamId },
    update: payload,
    create: { eventId, teamId, ...payload },
  });
}

export async function submitSubmission(eventId: string, teamId: string, data: SubmissionInput) {
  await validateSubmissionContext(eventId, data.trackId);
  const { trackId, customAnswers, ...rest } = data;
  const payload = {
    ...rest,
    trackId: trackId || null,
    customAnswers: (customAnswers ?? {}) as Prisma.InputJsonValue,
    status: "SUBMITTED" as const,
    submittedAt: new Date(),
  };

  return prisma.submission.upsert({
    where: { teamId },
    update: payload,
    create: { eventId, teamId, ...payload },
  });
}

export async function getModerationSubmissions(eventId: string) {
  return prisma.submission.findMany({
    where: { eventId, status: "SUBMITTED" },
    include: {
      team: { include: { members: { include: { user: true } } } },
      track: true,
    },
    orderBy: { submittedAt: "desc" },
  });
}

export async function updateSubmissionVisibility(
  eventId: string,
  submissionId: string,
  visibility: "PENDING" | "GALLERY" | "HIDDEN",
  judgeable: boolean,
  organizerNotes?: string,
) {
  const submission = await prisma.submission.findFirst({
    where: { id: submissionId, eventId },
  });
  if (!submission) throw new Error("Submission not found or unauthorized for this event");

  return prisma.submission.update({
    where: { id: submissionId },
    data: {
      visibility,
      judgeable,
      ...(organizerNotes !== undefined ? { organizerNotes } : {}),
    },
  });
}

export async function getGallerySubmissions(
  slug: string,
  options?: {
    trackId?: string;
    tech?: string;
    search?: string;
    sortBy?: "newest" | "oldest" | "title";
  },
) {
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event) return [];

  const orderBy =
    options?.sortBy === "oldest"
      ? { submittedAt: "asc" as const }
      : options?.sortBy === "title"
      ? { title: "asc" as const }
      : { submittedAt: "desc" as const };

  return prisma.submission.findMany({
    where: {
      eventId: event.id,
      visibility: "GALLERY",
      ...(options?.trackId ? { trackId: options.trackId } : {}),
      ...(options?.tech ? { tech: { has: options.tech } } : {}),
      ...(options?.search
        ? {
            OR: [
              { title: { contains: options.search, mode: "insensitive" } },
              { tagline: { contains: options.search, mode: "insensitive" } },
              { descriptionMd: { contains: options.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      track: true,
      team: { include: { members: { include: { user: true } } } },
    },
    orderBy,
  });
}
