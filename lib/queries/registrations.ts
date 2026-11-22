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
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { registrationOpensAt: true, registrationClosesAt: true },
  });
  if (!event) throw new Error("Event not found");

  const now = new Date();
  if (event.registrationOpensAt && now < new Date(event.registrationOpensAt)) {
    throw new Error("Registration has not opened yet");
  }
  if (event.registrationClosesAt && now > new Date(event.registrationClosesAt)) {
    throw new Error("Registration deadline has passed");
  }

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
  const reg = await prisma.registration.findFirst({
    where: { id: registrationId, eventId },
  });
  if (!reg) {
    throw new Error("Registration not found or unauthorized for this event");
  }

  return prisma.registration.update({
    where: { id: registrationId },
    data: { checkedInAt: new Date() },
  });
}
