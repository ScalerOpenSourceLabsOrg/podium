import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";

function generateInviteCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

function verifyRegistrationWindow(opensAt?: Date | null, closesAt?: Date | null) {
  const now = new Date();
  if (opensAt && now < new Date(opensAt)) {
    throw new Error("Registration has not opened yet");
  }
  if (closesAt && now > new Date(closesAt)) {
    throw new Error("Registration deadline has passed");
  }
}

export async function getTeamForUser(eventId: string, userId: string) {
  const member = await prisma.teamMember.findFirst({
    where: { userId, team: { eventId } },
    include: {
      team: {
        include: {
          members: { include: { user: true } },
          submission: true,
        },
      },
    },
  });
  return member ? member.team : null;
}

export async function getOpenTeams(eventId: string, skillFilter?: string) {
  const teams = await prisma.team.findMany({
    where: {
      eventId,
      isOpen: true,
      ...(skillFilter ? { lookingFor: { has: skillFilter } } : {}),
    },
    include: {
      members: { include: { user: true } },
      event: { select: { maxTeamSize: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return teams.filter((t) => t.members.length < t.event.maxTeamSize);
}

export async function createTeam(
  eventId: string,
  userId: string,
  name: string,
  isOpen = true,
  lookingFor: string[] = [],
) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { registrationOpensAt: true, registrationClosesAt: true },
  });
  if (!event) throw new Error("Event not found");
  verifyRegistrationWindow(event.registrationOpensAt, event.registrationClosesAt);

  const existingTeam = await getTeamForUser(eventId, userId);
  if (existingTeam) throw new Error("User is already in a team for this event");

  await prisma.registration.upsert({
    where: { eventId_userId: { eventId, userId } },
    update: {},
    create: { eventId, userId },
  });

  return prisma.team.create({
    data: {
      eventId,
      name,
      inviteCode: generateInviteCode(),
      isOpen,
      lookingFor,
      members: { create: { userId, role: "LEADER" } },
    },
    include: {
      members: { include: { user: true } },
    },
  });
}

export async function joinTeamByInviteCode(
  eventId: string,
  userId: string,
  inviteCode: string,
) {
  const existingTeam = await getTeamForUser(eventId, userId);
  if (existingTeam) throw new Error("User is already in a team for this event");

  const team = await prisma.team.findFirst({
    where: { eventId, inviteCode },
    include: {
      members: true,
      event: { select: { maxTeamSize: true, registrationOpensAt: true, registrationClosesAt: true } },
    },
  });

  if (!team) throw new Error("Invalid invite code");
  verifyRegistrationWindow(team.event.registrationOpensAt, team.event.registrationClosesAt);

  if (team.members.length >= team.event.maxTeamSize) {
    throw new Error("Team has reached maximum team size");
  }

  await prisma.registration.upsert({
    where: { eventId_userId: { eventId, userId } },
    update: {},
    create: { eventId, userId },
  });

  return prisma.teamMember.create({
    data: { teamId: team.id, userId, role: "MEMBER" },
  });
}

export async function leaveTeam(eventId: string, userId: string) {
  const teamMember = await prisma.teamMember.findFirst({
    where: { userId, team: { eventId } },
    include: { team: { include: { members: true } } },
  });

  if (!teamMember) throw new Error("Not a member of any team");

  await prisma.teamMember.delete({ where: { id: teamMember.id } });

  if (teamMember.team.members.length <= 1) {
    await prisma.team.delete({ where: { id: teamMember.team.id } });
  } else if (teamMember.role === "LEADER") {
    const nextLeader = await prisma.teamMember.findFirst({
      where: { teamId: teamMember.team.id },
      orderBy: { joinedAt: "asc" },
    });
    if (nextLeader) {
      await prisma.teamMember.update({
        where: { id: nextLeader.id },
        data: { role: "LEADER" },
      });
    }
  }
}

export async function updateTeamLookingFor(
  eventId: string,
  teamId: string,
  userId: string,
  lookingFor: string[],
) {
  const member = await prisma.teamMember.findFirst({
    where: { teamId, userId, team: { eventId } },
  });
  if (!member) throw new Error("Not authorized to update this team");

  return prisma.team.update({
    where: { id: teamId, eventId },
    data: { lookingFor },
  });
}
