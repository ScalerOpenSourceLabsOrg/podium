import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function getSubmissionForTeam(eventId: string, teamId: string) {
  return prisma.submission.findUnique({
    where: { teamId, eventId },
    include: {
      track: true,
      team: {
        include: {
          members: { include: { user: true } },
        },
      },
    },
  });
}

export async function saveSubmissionDraft(
  eventId: string,
  teamId: string,
  data: {
    title: string;
    tagline?: string;
    descriptionMd?: string;
    repoUrl?: string;
    demoUrl?: string;
    videoUrl?: string;
    trackId?: string | null;
    tech?: string[];
    customAnswers?: Record<string, unknown>;
  },
) {
  const { trackId, customAnswers, ...rest } = data;

  return prisma.submission.upsert({
    where: { teamId },
    update: {
      ...rest,
      trackId: trackId || null,
      customAnswers: (customAnswers ?? {}) as Prisma.InputJsonValue,
      status: "DRAFT",
    },
    create: {
      eventId,
      teamId,
      ...rest,
      trackId: trackId || null,
      customAnswers: (customAnswers ?? {}) as Prisma.InputJsonValue,
      status: "DRAFT",
    },
  });
}

export async function submitSubmission(
  eventId: string,
  teamId: string,
  data: {
    title: string;
    tagline?: string;
    descriptionMd?: string;
    repoUrl?: string;
    demoUrl?: string;
    videoUrl?: string;
    trackId?: string | null;
    tech?: string[];
    customAnswers?: Record<string, unknown>;
  },
) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (
    event?.submissionClosesAt &&
    new Date() > new Date(event.submissionClosesAt)
  ) {
    throw new Error("Submission deadline has passed");
  }

  const { trackId, customAnswers, ...rest } = data;

  return prisma.submission.upsert({
    where: { teamId },
    update: {
      ...rest,
      trackId: trackId || null,
      customAnswers: (customAnswers ?? {}) as Prisma.InputJsonValue,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
    create: {
      eventId,
      teamId,
      ...rest,
      trackId: trackId || null,
      customAnswers: (customAnswers ?? {}) as Prisma.InputJsonValue,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });
}

export async function getModerationSubmissions(eventId: string) {
  return prisma.submission.findMany({
    where: { eventId, status: "SUBMITTED" },
    include: {
      team: {
        include: { members: { include: { user: true } } },
      },
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
  return prisma.submission.update({
    where: { id: submissionId, eventId },
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
      team: {
        include: {
          members: { include: { user: true } },
        },
      },
    },
    orderBy,
  });
}
