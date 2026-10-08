import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";

function generateInviteCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

export async function getTeamForUser(eventId: string, userId: string) {
  const member = await prisma.teamMember.findFirst({
    where: {
      userId,
      team: { eventId },
    },
    include: {
      team: {
        include: {
          members: {
            include: {
              user: true,
            },
          },
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
      members: {
        include: {
          user: true,
        },
      },
      event: {
        select: { maxTeamSize: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Filter out teams that reached max team size
  return teams.filter((t) => t.members.length < t.event.maxTeamSize);
}

export async function createTeam(
  eventId: string,
  userId: string,
  name: string,
  isOpen = true,
  lookingFor: string[] = [],
) {
  const existingTeam = await getTeamForUser(eventId, userId);
  if (existingTeam) {
    throw new Error("User is already in a team for this event");
  }

  const inviteCode = generateInviteCode();

  return prisma.team.create({
    data: {
      eventId,
      name,
      inviteCode,
      isOpen,
      lookingFor,
      members: {
        create: {
          userId,
          role: "LEADER",
        },
      },
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
  if (existingTeam) {
    throw new Error("User is already in a team for this event");
  }

  const team = await prisma.team.findFirst({
    where: { eventId, inviteCode },
    include: {
      members: true,
      event: { select: { maxTeamSize: true } },
    },
  });

  if (!team) {
    throw new Error("Invalid invite code");
  }

  if (team.members.length >= team.event.maxTeamSize) {
    throw new Error("Team has reached maximum team size");
  }

  return prisma.teamMember.create({
    data: {
      teamId: team.id,
      userId,
      role: "MEMBER",
    },
  });
}

export async function leaveTeam(eventId: string, userId: string) {
  const teamMember = await prisma.teamMember.findFirst({
    where: {
      userId,
      team: { eventId },
    },
    include: {
      team: {
        include: { members: true },
      },
    },
  });

  if (!teamMember) {
    throw new Error("Not a member of any team");
  }

  await prisma.teamMember.delete({
    where: { id: teamMember.id },
  });

  // If last member left, delete team
  if (teamMember.team.members.length <= 1) {
    await prisma.team.delete({
      where: { id: teamMember.team.id },
    });
  }
}

export async function updateTeamLookingFor(
  eventId: string,
  teamId: string,
  userId: string,
  lookingFor: string[],
) {
  // Check user is in team
  const member = await prisma.teamMember.findFirst({
    where: { teamId, userId, team: { eventId } },
  });
  if (!member) {
    throw new Error("Not authorized to update this team");
  }

  return prisma.team.update({
    where: { id: teamId, eventId },
    data: { lookingFor },
  });
}
