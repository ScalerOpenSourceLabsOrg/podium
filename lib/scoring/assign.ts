import type { AssignmentDraft, JudgeProfile, SubmissionProfile } from "./types";

export type AssignOptions = {
  // How many judges must see each submission.
  judgesPerSubmission: number;
  // Submissions every judge scores, so normalize.ts has a shared baseline.
  anchorSubmissionIds: string[];
  round: number;
};

/**
 * Allocation runs in two passes. First every judge is given the full anchor
 * set, since normalization is worthless without it. Then the remaining
 * submissions are dealt out to the eligible judge with the lightest load,
 * where eligible means track-matched and free of a recorded conflict.
 *
 * Deterministic for a given input order: an organizer regenerating after a
 * manual swap should not see the whole board reshuffle.
 */
export function generateAssignments(
  judges: JudgeProfile[],
  submissions: SubmissionProfile[],
  options: AssignOptions,
): AssignmentDraft[] {
  const assignments: AssignmentDraft[] = [];
  const anchorSet = new Set(options.anchorSubmissionIds);

  // 1. Pass 1: Give every judge the full anchor set (if eligible)
  for (const sub of submissions) {
    if (!anchorSet.has(sub.id)) continue;
    for (const judge of judges) {
      if (judge.conflictSubmissionIds.includes(sub.id)) continue;
      if (
        sub.trackId &&
        judge.trackIds.length > 0 &&
        !judge.trackIds.includes(sub.trackId)
      ) {
        continue;
      }
      assignments.push({
        judgeId: judge.id,
        submissionId: sub.id,
        round: options.round,
        isAnchor: true,
      });
    }
  }

  // 2. Pass 2: Non-anchor submissions
  const nonAnchorSubmissions = submissions.filter((s) => !anchorSet.has(s.id));
  const judgeLoad: Record<string, number> = {};
  for (const j of judges) {
    judgeLoad[j.id] = 0;
  }

  for (const sub of nonAnchorSubmissions) {
    let assignedCount = 0;
    while (assignedCount < options.judgesPerSubmission) {
      const assignedJudges = new Set(
        assignments
          .filter((a) => a.submissionId === sub.id)
          .map((a) => a.judgeId),
      );

      const eligible = judges.filter((j) => {
        if (assignedJudges.has(j.id)) return false;
        if (j.conflictSubmissionIds.includes(sub.id)) return false;
        if (
          sub.trackId &&
          j.trackIds.length > 0 &&
          !j.trackIds.includes(sub.trackId)
        ) {
          return false;
        }
        return true;
      });

      if (eligible.length === 0) break;

      // Deterministic sort: lightest load, then judge ID order
      eligible.sort((a, b) => {
        const diff = judgeLoad[a.id] - judgeLoad[b.id];
        if (diff !== 0) return diff;
        return a.id.localeCompare(b.id);
      });

      const chosen = eligible[0];
      assignments.push({
        judgeId: chosen.id,
        submissionId: sub.id,
        round: options.round,
        isAnchor: false,
      });
      judgeLoad[chosen.id]++;
      assignedCount++;
    }
  }

  return assignments;
}
