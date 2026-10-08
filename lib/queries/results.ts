import { prisma } from "@/lib/db";
import { normalizeScores } from "@/lib/scoring/normalize";
import { rankByTrack, rankSubmissions } from "@/lib/scoring/rank";
import type { RawScore } from "@/lib/scoring/types";

export async function getRankingsForEvent(eventId: string) {
  const criteria = await prisma.criterion.findMany({
    where: { eventId },
  });

  const anchorAssignments = await prisma.assignment.findMany({
    where: { eventId, isAnchor: true },
    select: { submissionId: true },
  });
  const anchorSubmissionIds = [
    ...new Set(anchorAssignments.map((a) => a.submissionId)),
  ];

  const scores = await prisma.score.findMany({
    where: { assignment: { eventId } },
    include: {
      assignment: { select: { judgeId: true, submissionId: true } },
    },
  });

  const rawScores: RawScore[] = scores.map((s) => ({
    judgeId: s.assignment.judgeId,
    submissionId: s.assignment.submissionId,
    criterionId: s.criterionId,
    value: s.value,
  }));

  const submissions = await prisma.submission.findMany({
    where: { eventId, status: "SUBMITTED" },
    include: {
      team: { include: { members: { include: { user: true } } } },
      track: true,
      awards: true,
    },
  });

  const submissionProfiles = submissions.map((s) => ({
    id: s.id,
    trackId: s.trackId,
  }));

  const normalized = normalizeScores(
    rawScores,
    criteria.map((c) => ({ id: c.id, weight: c.weight, maxScore: c.maxScore })),
    anchorSubmissionIds,
  );

  const rankedOverall = rankSubmissions(
    normalized,
    criteria.map((c) => ({ id: c.id, weight: c.weight, maxScore: c.maxScore })),
    submissionProfiles,
  );

  const rankedTrackMap = rankByTrack(
    normalized,
    criteria.map((c) => ({ id: c.id, weight: c.weight, maxScore: c.maxScore })),
    submissionProfiles,
  );

  const submissionsMap = new Map(submissions.map((s) => [s.id, s]));

  const overallResults = rankedOverall.map((r) => ({
    ...r,
    submission: submissionsMap.get(r.submissionId),
  }));

  return {
    criteria,
    overall: overallResults,
    trackMap: rankedTrackMap,
  };
}

export async function getAwardsForEvent(eventId: string) {
  return prisma.award.findMany({
    where: { eventId },
    include: {
      track: true,
      submission: {
        include: { team: true },
      },
    },
    orderBy: { position: "asc" },
  });
}

export async function createAward(
  eventId: string,
  data: {
    name: string;
    description?: string;
    trackId?: string | null;
    position?: number;
    submissionId?: string | null;
    overrideReason?: string;
  },
) {
  return prisma.award.create({
    data: {
      eventId,
      name: data.name,
      description: data.description,
      trackId: data.trackId || null,
      position: data.position || 0,
      submissionId: data.submissionId || null,
      overrideReason: data.overrideReason,
    },
  });
}

export async function updateAwardWinner(
  eventId: string,
  awardId: string,
  submissionId: string | null,
  overrideReason?: string,
) {
  return prisma.award.update({
    where: { id: awardId, eventId },
    data: {
      submissionId,
      overrideReason,
    },
  });
}

export async function setResultsVisibility(
  slug: string,
  winnersPublic: boolean,
  galleryPublic: boolean,
) {
  return prisma.event.update({
    where: { slug },
    data: { winnersPublic, galleryPublic },
  });
}

export async function getFeedbackForTeam(eventId: string, teamId: string) {
  const submission = await prisma.submission.findUnique({
    where: { teamId, eventId },
    include: {
      assignments: {
        include: {
          scores: {
            include: { criterion: true },
          },
        },
      },
    },
  });

  if (!submission) return [];

  // Anonymized feedback: names stripped
  return submission.assignments.map((assignment, idx) => ({
    judgeAlias: `Judge #${idx + 1}`,
    scores: assignment.scores.map((s) => ({
      criterionName: s.criterion.name,
      value: s.value,
      maxScore: s.criterion.maxScore,
      comment: s.comment,
    })),
  }));
}
