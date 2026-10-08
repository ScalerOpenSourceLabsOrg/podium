import { prisma } from "@/lib/db";

export async function getRegistration(eventId: string, userId: string) {
  return prisma.registration.findUnique({
    where: {
      eventId_userId: { eventId, userId },
    },
    include: {
      user: true,
    },
  });
}

export async function registerUser(
  eventId: string,
  userId: string,
  data: { college?: string; yearOfStudy?: string; phone?: string; answers?: any },
) {
  return prisma.registration.upsert({
    where: { eventId_userId: { eventId, userId } },
    update: data,
    create: {
      eventId,
      userId,
      ...data,
    },
  });
}

export async function getRegistrationsForEvent(eventId: string, search?: string) {
  return prisma.registration.findMany({
    where: {
      eventId,
      ...(search
        ? {
            user: {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { githubHandle: { contains: search, mode: "insensitive" } },
              ],
            },
          }
        : {}),
    },
    include: {
      user: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function checkInParticipant(eventId: string, registrationId: string) {
  return prisma.registration.update({
    where: { id: registrationId, eventId },
    data: { checkedInAt: new Date() },
  });
}
