import { prisma } from "@/lib/db";

export async function getEventBySlug(slug: string) {
  return prisma.event.findUnique({ where: { slug } });
}

export async function getEventRoles(slug: string, userId: string) {
  const memberships = await prisma.eventMembership.findMany({
    where: { userId, event: { slug } },
    select: { role: true },
  });
  return memberships.map((m) => m.role as "ORGANIZER" | "JUDGE");
}

export async function getEventWithDetails(slug: string) {
  return prisma.event.findUnique({
    where: { slug },
    include: {
      tracks: true,
      criteria: { orderBy: { position: "asc" } },
      _count: {
        select: {
          registrations: true,
          teams: true,
          submissions: true,
        },
      },
    },
  });
}

export async function createNewEvent(
  userId: string,
  data: {
    name: string;
    slug: string;
    tagline?: string;
    rulesMd?: string;
    maxTeamSize?: number;
  },
) {
  const event = await prisma.event.create({
    data: {
      name: data.name,
      slug: data.slug,
      tagline: data.tagline || "",
      rulesMd: data.rulesMd || "",
      maxTeamSize: data.maxTeamSize || 4,
      status: "PUBLISHED",
      memberships: {
        create: {
          userId,
          role: "ORGANIZER",
        },
      },
    },
  });

  return event;
}

export async function updateEvent(slug: string, data: any) {
  return prisma.event.update({
    where: { slug },
    data,
  });
}

export async function getTracksForEvent(eventId: string) {
  return prisma.track.findMany({
    where: { eventId },
  });
}

export async function createTrack(eventId: string, name: string, description?: string) {
  return prisma.track.create({
    data: { eventId, name, description },
  });
}

export async function getCriteriaForEvent(eventId: string) {
  return prisma.criterion.findMany({
    where: { eventId },
    orderBy: { position: "asc" },
  });
}

export async function createCriterion(
  eventId: string,
  data: { name: string; description?: string; weight: number; maxScore: number; position: number },
) {
  return prisma.criterion.create({
    data: {
      eventId,
      ...data,
    },
  });
}
