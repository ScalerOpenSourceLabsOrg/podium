import type { Criterion, NormalizedScore, RawScore } from "./types";

/**
 * Judges grade on different scales: one never gives a 5, another never gives
 * below a 3. Comparing raw totals across judges therefore measures the judge
 * as much as the submission.
 *
 * Each judge's mean and standard deviation are estimated from the anchor set —
 * the submissions every judge scored — and every score that judge gave is
 * expressed as a z-score against that. A judge with too few anchor scores, or
 * zero spread, is passed through unadjusted rather than being amplified.
 */
export function normalizeScores(
  scores: RawScore[],
  criteria: Criterion[],
  anchorSubmissionIds: string[],
): NormalizedScore[] {
  const anchorSet = new Set(anchorSubmissionIds);

  const scoresByJudge: Record<string, RawScore[]> = {};
  for (const s of scores) {
    if (!scoresByJudge[s.judgeId]) scoresByJudge[s.judgeId] = [];
    scoresByJudge[s.judgeId].push(s);
  }

  const result: NormalizedScore[] = [];

  for (const [, judgeScores] of Object.entries(scoresByJudge)) {
    const anchorScores = judgeScores.filter((s) => anchorSet.has(s.submissionId));

    const anchorScoresByCriterion: Record<string, number[]> = {};
    for (const s of anchorScores) {
      if (!anchorScoresByCriterion[s.criterionId]) {
        anchorScoresByCriterion[s.criterionId] = [];
      }
      anchorScoresByCriterion[s.criterionId].push(s.value);
    }

    const statsByCriterion: Record<
      string,
      { mean: number; stdDev: number; count: number }
    > = {};

    for (const crit of criteria) {
      const values = anchorScoresByCriterion[crit.id] || [];
      const count = values.length;
      if (count < 2) {
        statsByCriterion[crit.id] = { mean: 0, stdDev: 0, count };
      } else {
        const mean = values.reduce((sum, v) => sum + v, 0) / count;
        const variance =
          values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / count;
        const stdDev = Math.sqrt(variance);
        statsByCriterion[crit.id] = { mean, stdDev, count };
      }
    }

    for (const s of judgeScores) {
      const stat = statsByCriterion[s.criterionId];
      if (!stat || stat.count < 2 || stat.stdDev === 0) {
        result.push({
          ...s,
          normalized: s.value,
        });
      } else {
        const z = (s.value - stat.mean) / stat.stdDev;
        result.push({
          ...s,
          normalized: z,
        });
      }
    }
  }

  return result;
}
