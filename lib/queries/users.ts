import { prisma } from "@/lib/db";
import { leaveTeam } from "@/lib/queries/teams";

// Users are global — one person can register for one event and judge another.
// Their relationship to an event lives in EventMembership and Registration.
export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function getEventUsersWithRoles(slug: string) {
  const event = await prisma.event.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });
  if (!event) return null;

  const [memberships, registrations, assignments] = await Promise.all([
    prisma.eventMembership.findMany({
      where: { eventId: event.id },
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.registration.findMany({
      where: { eventId: event.id },
      include: {
        user: {
          include: {
            teamMembers: {
              where: { team: { eventId: event.id } },
              include: { team: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.assignment.groupBy({
      by: ["judgeId"],
      where: { eventId: event.id },
      _count: { _all: true },
    }),
  ]);

  const assignmentCountMap = new Map<string, number>();
  for (const a of assignments) {
    assignmentCountMap.set(a.judgeId, a._count._all);
  }

  // Aggregate users by userId
  const userMap = new Map<
    string,
    {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
      roles: Set<"ORGANIZER" | "JUDGE" | "REGISTRANT">;
      assignmentCount: number;
      teamName: string | null;
      college: string | null;
      checkedInAt: Date | null;
      registeredAt: Date | null;
    }
  >();

  for (const m of memberships) {
    const existing = userMap.get(m.userId) || {
      id: m.user.id, name: m.user.name, email: m.user.email, image: m.user.image,
      roles: new Set(), assignmentCount: assignmentCountMap.get(m.userId) || 0,
      teamName: null, college: null, checkedInAt: null, registeredAt: null,
    };
    existing.roles.add(m.role);
    userMap.set(m.userId, existing);
  }

  for (const r of registrations) {
    const existing = userMap.get(r.userId) || {
      id: r.user.id, name: r.user.name, email: r.user.email, image: r.user.image,
      roles: new Set(), assignmentCount: 0,
      teamName: null, college: null, checkedInAt: null, registeredAt: null,
    };
    existing.roles.add("REGISTRANT");
    existing.college = r.college;
    existing.checkedInAt = r.checkedInAt;
    existing.registeredAt = r.createdAt;
    if (r.user.teamMembers?.length) existing.teamName = r.user.teamMembers[0].team.name;
    userMap.set(r.userId, existing);
  }

  return {
    event,
    users: Array.from(userMap.values()).map((u) => ({
      ...u,
      roles: Array.from(u.roles),
    })),
  };
}

export async function addEventRole(
  slug: string,
  email: string,
  role: "ORGANIZER" | "JUDGE",
  name?: string
) {
  const event = await prisma.event.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!event) throw new Error("Event not found.");

  const normalizedEmail = email.trim().toLowerCase();
  const displayName = name?.trim() || normalizedEmail.split("@")[0];

  const user = await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: {},
    create: {
      email: normalizedEmail,
      name: displayName,
    },
  });

  await prisma.eventMembership.upsert({
    where: {
      eventId_userId_role: {
        eventId: event.id,
        userId: user.id,
        role,
      },
    },
    update: {},
    create: {
      eventId: event.id,
      userId: user.id,
      role,
    },
  });

  return user;
}

export async function removeEventRole(
  slug: string,
  userId: string,
  role: "ORGANIZER" | "JUDGE"
) {
  const event = await prisma.event.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!event) throw new Error("Event not found.");

  // If removing an organizer, ensure at least one organizer remains to avoid lockout
  if (role === "ORGANIZER") {
    const organizerCount = await prisma.eventMembership.count({
      where: { eventId: event.id, role: "ORGANIZER" },
    });
    if (organizerCount <= 1) {
      throw new Error("Cannot remove the last organizer from the event.");
    }
  }

  return prisma.eventMembership.deleteMany({
    where: {
      eventId: event.id,
      userId,
      role,
    },
  });
}

export async function removeEventRegistration(slug: string, userId: string) {
  const event = await prisma.event.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!event) throw new Error("Event not found.");

  const teamMember = await prisma.teamMember.findFirst({
    where: { userId, team: { eventId: event.id } },
  });
  if (teamMember) {
    await leaveTeam(event.id, userId);
  }

  return prisma.registration.deleteMany({
    where: {
      eventId: event.id,
      userId,
    },
  });
}
