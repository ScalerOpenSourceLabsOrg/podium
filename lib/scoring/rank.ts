import type { Criterion, NormalizedScore, RankedSubmission, SubmissionProfile } from "./types";

/**
 * Weighted mean across criteria, then mean across the judges who scored the
 * submission — judges first would let a submission seen by three judges
 * outrank one seen by two purely on arithmetic.
 *
 * Ties keep equal rank and the next rank skips, so a shared second place is
 * followed by fourth.
 */
export function rankSubmissions(
  scores: NormalizedScore[],
  criteria: Criterion[],
  submissions?: SubmissionProfile[],
): RankedSubmission[] {
  const criteriaMap = new Map(criteria.map((c) => [c.id, c]));

  // Create submission track map if provided
  const trackMap = new Map<string, string | null>();
  if (submissions) {
    for (const sub of submissions) {
      trackMap.set(sub.id, sub.trackId);
    }
  }

  // Group scores by submissionId -> judgeId -> NormalizedScore[]
  const scoresBySubAndJudge: Record<string, Record<string, NormalizedScore[]>> = {};

  for (const s of scores) {
    if (!scoresBySubAndJudge[s.submissionId]) {
      scoresBySubAndJudge[s.submissionId] = {};
    }
    if (!scoresBySubAndJudge[s.submissionId][s.judgeId]) {
      scoresBySubAndJudge[s.submissionId][s.judgeId] = [];
    }
    scoresBySubAndJudge[s.submissionId][s.judgeId].push(s);
  }

  const submissionAverages: {
    submissionId: string;
    total: number;
    judgeCount: number;
  }[] = [];

  for (const [subId, judgesMap] of Object.entries(scoresBySubAndJudge)) {
    const judgeTotals: number[] = [];

    for (const [, judgeScores] of Object.entries(judgesMap)) {
      let judgeWeightedSum = 0;
      let judgeWeightSum = 0;

      for (const score of judgeScores) {
        const crit = criteriaMap.get(score.criterionId);
        const weight = crit ? crit.weight : 1;
        judgeWeightedSum += score.normalized * weight;
        judgeWeightSum += weight;
      }

      const judgeTotal = judgeWeightSum > 0 ? judgeWeightedSum / judgeWeightSum : 0;
      judgeTotals.push(judgeTotal);
    }

    const judgeCount = judgeTotals.length;
    if (judgeCount === 0) continue;

    const total = judgeTotals.reduce((sum, t) => sum + t, 0) / judgeCount;
    submissionAverages.push({ submissionId: subId, total, judgeCount });
  }

  submissionAverages.sort((a, b) => b.total - a.total);

  const ranked: RankedSubmission[] = [];
  let currentRank = 1;

  for (let i = 0; i < submissionAverages.length; i++) {
    if (
      i > 0 &&
      Math.abs(submissionAverages[i].total - submissionAverages[i - 1].total) > 1e-9
    ) {
      currentRank = i + 1;
    }

    ranked.push({
      submissionId: submissionAverages[i].submissionId,
      trackId: trackMap.get(submissionAverages[i].submissionId) ?? null,
      total: submissionAverages[i].total,
      rank: currentRank,
      judgeCount: submissionAverages[i].judgeCount,
    });
  }

  return ranked;
}

export function rankByTrack(
  scores: NormalizedScore[],
  criteria: Criterion[],
  submissions?: SubmissionProfile[],
): Map<string | null, RankedSubmission[]> {
  const allRanked = rankSubmissions(scores, criteria, submissions);
  const result = new Map<string | null, RankedSubmission[]>();

  for (const r of allRanked) {
    const trackId = r.trackId;
    if (!result.has(trackId)) {
      result.set(trackId, []);
    }
    result.get(trackId)!.push(r);
  }

  // Re-rank within each track
  for (const [, trackSubmissions] of result.entries()) {
    trackSubmissions.sort((a, b) => b.total - a.total);
    let currentRank = 1;
    for (let i = 0; i < trackSubmissions.length; i++) {
      if (
        i > 0 &&
        Math.abs(trackSubmissions[i].total - trackSubmissions[i - 1].total) > 1e-9
      ) {
        currentRank = i + 1;
      }
      trackSubmissions[i].rank = currentRank;
    }
  }

  return result;
}
