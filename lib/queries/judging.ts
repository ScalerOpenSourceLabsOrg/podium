import { prisma } from "@/lib/db";
import { generateAssignments } from "@/lib/scoring/assign";

export async function getAssignmentsForJudge(slug: string, userId: string) {
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event) return [];

  return prisma.assignment.findMany({
    where: {
      eventId: event.id,
      judgeId: userId,
    },
    include: {
      submission: {
        include: {
          track: true,
          team: {
            include: { members: { include: { user: true } } },
          },
        },
      },
      scores: true,
      event: {
        include: {
          criteria: { orderBy: { position: "asc" } },
        },
      },
    },
    orderBy: { isAnchor: "desc" },
  });
}

export async function saveScore(
  eventId: string,
  judgeId: string,
  assignmentId: string,
  criterionId: string,
  value: number,
  comment: string = "",
) {
  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, eventId, judgeId },
  });
  if (!assignment) {
    throw new Error("Assignment not found or unauthorized");
  }

  const score = await prisma.score.upsert({
    where: {
      assignmentId_criterionId: { assignmentId, criterionId },
    },
    update: { value, comment },
    create: { assignmentId, criterionId, value, comment },
  });

  // Check if all criteria scored for this assignment to set completedAt
  const criteriaCount = await prisma.criterion.count({
    where: { eventId },
  });
  const scoresCount = await prisma.score.count({
    where: { assignmentId },
  });

  if (scoresCount >= criteriaCount) {
    await prisma.assignment.update({
      where: { id: assignmentId },
      data: { completedAt: new Date() },
    });
  }

  return score;
}

export async function getJudgesForEvent(eventId: string) {
  const memberships = await prisma.eventMembership.findMany({
    where: { eventId, role: "JUDGE" },
    include: { user: true },
  });
  return memberships.map((m) => m.user);
}

export async function getEventAssignments(eventId: string) {
  return prisma.assignment.findMany({
    where: { eventId },
    include: {
      submission: { include: { team: true, track: true } },
      judge: true,
      scores: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function generateAndSaveAssignments(
  eventId: string,
  options: {
    judgesPerSubmission: number;
    anchorSubmissionIds: string[];
    round: number;
  },
) {
  const judges = await getJudgesForEvent(eventId);
  const submissions = await prisma.submission.findMany({
    where: { eventId, status: "SUBMITTED", judgeable: true },
    select: { id: true, trackId: true },
  });

  const judgeProfiles = judges.map((j) => ({
    id: j.id,
    trackIds: [],
    conflictSubmissionIds: [],
  }));

  const submissionProfiles = submissions.map((s) => ({
    id: s.id,
    trackId: s.trackId,
  }));

  const drafts = generateAssignments(judgeProfiles, submissionProfiles, options);

  // Clear existing assignments for round
  await prisma.assignment.deleteMany({
    where: { eventId, round: options.round },
  });

  // Create generated assignments
  await prisma.assignment.createMany({
    data: drafts.map((d) => ({
      eventId,
      submissionId: d.submissionId,
      judgeId: d.judgeId,
      round: d.round,
      isAnchor: d.isAnchor,
    })),
  });

  return getEventAssignments(eventId);
}
