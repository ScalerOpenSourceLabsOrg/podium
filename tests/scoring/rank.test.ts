import { describe, expect, it } from "vitest";
import { rankByTrack, rankSubmissions } from "../../lib/scoring/rank";
import type { Criterion, NormalizedScore, SubmissionProfile } from "../../lib/scoring/types";

describe("rankSubmissions", () => {
  const criteria: Criterion[] = [
    { id: "c1", weight: 1, maxScore: 5 },
    { id: "c2", weight: 2, maxScore: 5 },
  ];

  it("applies criterion weights", () => {
    // Sub 1: c1=5 (weight 1), c2=2 (weight 2) -> total weighted avg = (5*1 + 2*2)/3 = 3
    // Sub 2: c1=2 (weight 1), c2=5 (weight 2) -> total weighted avg = (2*1 + 5*2)/3 = 4
    const scores: NormalizedScore[] = [
      { judgeId: "j1", submissionId: "s1", criterionId: "c1", value: 5, normalized: 5 },
      { judgeId: "j1", submissionId: "s1", criterionId: "c2", value: 2, normalized: 2 },
      { judgeId: "j1", submissionId: "s2", criterionId: "c1", value: 2, normalized: 2 },
      { judgeId: "j1", submissionId: "s2", criterionId: "c2", value: 5, normalized: 5 },
    ];

    const ranked = rankSubmissions(scores, criteria);
    expect(ranked[0].submissionId).toBe("s2");
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].submissionId).toBe("s1");
    expect(ranked[1].rank).toBe(2);
  });

  it("averages across judges rather than summing", () => {
    // s1 scored by j1 and j2 (both give 4) -> avg = 4
    // s2 scored by j1 only (gives 4) -> avg = 4
    const scores: NormalizedScore[] = [
      { judgeId: "j1", submissionId: "s1", criterionId: "c1", value: 4, normalized: 4 },
      { judgeId: "j2", submissionId: "s1", criterionId: "c1", value: 4, normalized: 4 },
      { judgeId: "j1", submissionId: "s2", criterionId: "c1", value: 4, normalized: 4 },
    ];

    const ranked = rankSubmissions(scores, [{ id: "c1", weight: 1, maxScore: 5 }]);
    expect(ranked[0].total).toBe(4);
    expect(ranked[1].total).toBe(4);
  });

  it("gives tied submissions the same rank and skips the next", () => {
    const scores: NormalizedScore[] = [
      { judgeId: "j1", submissionId: "s1", criterionId: "c1", value: 5, normalized: 5 },
      { judgeId: "j1", submissionId: "s2", criterionId: "c1", value: 5, normalized: 5 },
      { judgeId: "j1", submissionId: "s3", criterionId: "c1", value: 3, normalized: 3 },
    ];

    const ranked = rankSubmissions(scores, [{ id: "c1", weight: 1, maxScore: 5 }]);
    expect(ranked.find((r) => r.submissionId === "s1")!.rank).toBe(1);
    expect(ranked.find((r) => r.submissionId === "s2")!.rank).toBe(1);
    expect(ranked.find((r) => r.submissionId === "s3")!.rank).toBe(3);
  });

  it("excludes submissions no judge scored", () => {
    const scores: NormalizedScore[] = [
      { judgeId: "j1", submissionId: "s1", criterionId: "c1", value: 4, normalized: 4 },
    ];
    const ranked = rankSubmissions(scores, [{ id: "c1", weight: 1, maxScore: 5 }]);
    expect(ranked.length).toBe(1);
    expect(ranked[0].submissionId).toBe("s1");
  });

  it("reports how many judges scored each submission", () => {
    const scores: NormalizedScore[] = [
      { judgeId: "j1", submissionId: "s1", criterionId: "c1", value: 4, normalized: 4 },
      { judgeId: "j2", submissionId: "s1", criterionId: "c1", value: 4, normalized: 4 },
    ];
    const ranked = rankSubmissions(scores, [{ id: "c1", weight: 1, maxScore: 5 }]);
    expect(ranked[0].judgeCount).toBe(2);
  });
});

describe("rankByTrack", () => {
  const criteria: Criterion[] = [{ id: "c1", weight: 1, maxScore: 5 }];

  it("ranks within each track independently", () => {
    const scores: NormalizedScore[] = [
      { judgeId: "j1", submissionId: "s1", criterionId: "c1", value: 5, normalized: 5 },
      { judgeId: "j1", submissionId: "s2", criterionId: "c1", value: 3, normalized: 3 },
    ];
    const submissions: SubmissionProfile[] = [
      { id: "s1", trackId: "t1" },
      { id: "s2", trackId: "t2" },
    ];

    const rankedMap = rankByTrack(scores, criteria, submissions);
    expect(rankedMap.get("t1")![0].rank).toBe(1);
    expect(rankedMap.get("t2")![0].rank).toBe(1);
  });

  it("groups submissions with no track together", () => {
    const scores: NormalizedScore[] = [
      { judgeId: "j1", submissionId: "s1", criterionId: "c1", value: 5, normalized: 5 },
    ];
    const submissions: SubmissionProfile[] = [{ id: "s1", trackId: null }];

    const rankedMap = rankByTrack(scores, criteria, submissions);
    expect(rankedMap.has(null)).toBe(true);
    expect(rankedMap.get(null)![0].submissionId).toBe("s1");
  });
});
