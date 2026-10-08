import { describe, expect, it } from "vitest";
import { normalizeScores } from "../../lib/scoring/normalize";
import type { Criterion, RawScore } from "../../lib/scoring/types";

describe("normalizeScores", () => {
  const criteria: Criterion[] = [
    { id: "c1", weight: 1, maxScore: 5 },
    { id: "c2", weight: 2, maxScore: 5 },
  ];

  it("centres each judge on their own anchor mean", () => {
    const rawScores: RawScore[] = [
      { judgeId: "j1", submissionId: "a1", criterionId: "c1", value: 3 },
      { judgeId: "j1", submissionId: "a2", criterionId: "c1", value: 5 },
    ];
    const normalized = normalizeScores(rawScores, criteria, ["a1", "a2"]);
    const j1Scores = normalized.map((s) => s.normalized);
    const sum = j1Scores.reduce((a, b) => a + b, 0);
    expect(Math.abs(sum)).toBeLessThan(1e-6);
  });

  it("ranks a harsh judge's 4 above a generous judge's 4", () => {
    // Harsh judge gives 2 and 4 (mean 3) -> 4 is +1 stdDev above mean
    // Generous judge gives 4 and 5 (mean 4.5) -> 4 is -1 stdDev below mean
    const rawScores: RawScore[] = [
      { judgeId: "harsh", submissionId: "a1", criterionId: "c1", value: 2 },
      { judgeId: "harsh", submissionId: "a2", criterionId: "c1", value: 4 },
      { judgeId: "generous", submissionId: "a1", criterionId: "c1", value: 4 },
      { judgeId: "generous", submissionId: "a2", criterionId: "c1", value: 5 },
    ];
    const normalized = normalizeScores(rawScores, criteria, ["a1", "a2"]);
    const harshFour = normalized.find(
      (s) => s.judgeId === "harsh" && s.submissionId === "a2",
    )!;
    const generousFour = normalized.find(
      (s) => s.judgeId === "generous" && s.submissionId === "a1",
    )!;

    expect(harshFour.normalized).toBeGreaterThan(generousFour.normalized);
  });

  it("passes scores through unchanged when a judge has zero spread", () => {
    const rawScores: RawScore[] = [
      { judgeId: "j1", submissionId: "a1", criterionId: "c1", value: 4 },
      { judgeId: "j1", submissionId: "a2", criterionId: "c1", value: 4 },
    ];
    const normalized = normalizeScores(rawScores, criteria, ["a1", "a2"]);
    expect(normalized[0].normalized).toBe(4);
    expect(normalized[1].normalized).toBe(4);
  });

  it("passes scores through unchanged below the minimum anchor count", () => {
    const rawScores: RawScore[] = [
      { judgeId: "j1", submissionId: "a1", criterionId: "c1", value: 4 },
    ];
    const normalized = normalizeScores(rawScores, criteria, ["a1"]);
    expect(normalized[0].normalized).toBe(4);
  });

  it("normalizes per criterion, not across the whole rubric", () => {
    const rawScores: RawScore[] = [
      { judgeId: "j1", submissionId: "a1", criterionId: "c1", value: 2 },
      { judgeId: "j1", submissionId: "a2", criterionId: "c1", value: 4 },
      { judgeId: "j1", submissionId: "a1", criterionId: "c2", value: 5 },
      { judgeId: "j1", submissionId: "a2", criterionId: "c2", value: 5 },
    ];
    const normalized = normalizeScores(rawScores, criteria, ["a1", "a2"]);
    const c2Score = normalized.find((s) => s.criterionId === "c2")!;
    expect(c2Score.normalized).toBe(5); // c2 has 0 spread, passed through
  });

  it("ignores scores from submissions outside the anchor set when estimating bias", () => {
    const rawScores: RawScore[] = [
      { judgeId: "j1", submissionId: "a1", criterionId: "c1", value: 2 },
      { judgeId: "j1", submissionId: "a2", criterionId: "c1", value: 4 },
      { judgeId: "j1", submissionId: "other", criterionId: "c1", value: 10 },
    ];
    const normalized = normalizeScores(rawScores, criteria, ["a1", "a2"]);
    const otherScore = normalized.find((s) => s.submissionId === "other")!;
    // Mean of anchors is 3, stdDev is 1. (10 - 3) / 1 = 7.
    expect(otherScore.normalized).toBe(7);
  });
});
