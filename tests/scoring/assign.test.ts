import { describe, expect, it } from "vitest";
import { generateAssignments } from "../../lib/scoring/assign";
import type { JudgeProfile, SubmissionProfile } from "../../lib/scoring/types";

describe("generateAssignments", () => {
  const judges: JudgeProfile[] = [
    { id: "j1", trackIds: [], conflictSubmissionIds: [] },
    { id: "j2", trackIds: [], conflictSubmissionIds: [] },
    { id: "j3", trackIds: ["t1"], conflictSubmissionIds: ["s2"] },
  ];

  const submissions: SubmissionProfile[] = [
    { id: "s1", trackId: "t1" },
    { id: "s2", trackId: "t2" },
    { id: "s3", trackId: null },
  ];

  it("gives every judge the full anchor set", () => {
    const assignments = generateAssignments(judges, submissions, {
      judgesPerSubmission: 2,
      anchorSubmissionIds: ["s1"],
      round: 1,
    });

    const anchors = assignments.filter((a) => a.isAnchor);
    const anchorJudges = anchors.map((a) => a.judgeId);
    expect(anchorJudges).toContain("j1");
    expect(anchorJudges).toContain("j2");
    expect(anchorJudges).toContain("j3");
  });

  it("never assigns a judge a submission they have a conflict with", () => {
    const assignments = generateAssignments(judges, submissions, {
      judgesPerSubmission: 2,
      anchorSubmissionIds: [],
      round: 1,
    });

    const j3Assignments = assignments.filter((a) => a.judgeId === "j3");
    expect(j3Assignments.some((a) => a.submissionId === "s2")).toBe(false);
  });

  it("only assigns judges to tracks they are eligible for", () => {
    const assignments = generateAssignments(judges, submissions, {
      judgesPerSubmission: 2,
      anchorSubmissionIds: [],
      round: 1,
    });

    const j3Assignments = assignments.filter((a) => a.judgeId === "j3");
    // j3 is only eligible for track t1 and null track
    expect(j3Assignments.every((a) => a.submissionId === "s1" || a.submissionId === "s3")).toBe(true);
  });

  it("gives each submission the requested number of judges", () => {
    const assignments = generateAssignments(judges, submissions, {
      judgesPerSubmission: 2,
      anchorSubmissionIds: [],
      round: 1,
    });

    const s1Judges = assignments.filter((a) => a.submissionId === "s1");
    expect(s1Judges.length).toBe(2);
  });

  it("keeps judge loads within one of each other", () => {
    const plainJudges: JudgeProfile[] = [
      { id: "j1", trackIds: [], conflictSubmissionIds: [] },
      { id: "j2", trackIds: [], conflictSubmissionIds: [] },
    ];
    const plainSubs: SubmissionProfile[] = [
      { id: "s1", trackId: null },
      { id: "s2", trackId: null },
      { id: "s3", trackId: null },
    ];

    const assignments = generateAssignments(plainJudges, plainSubs, {
      judgesPerSubmission: 1,
      anchorSubmissionIds: [],
      round: 1,
    });

    const j1Count = assignments.filter((a) => a.judgeId === "j1").length;
    const j2Count = assignments.filter((a) => a.judgeId === "j2").length;
    expect(Math.abs(j1Count - j2Count)).toBeLessThanOrEqual(1);
  });

  it("returns the same result for the same input", () => {
    const run1 = generateAssignments(judges, submissions, {
      judgesPerSubmission: 2,
      anchorSubmissionIds: ["s1"],
      round: 1,
    });
    const run2 = generateAssignments(judges, submissions, {
      judgesPerSubmission: 2,
      anchorSubmissionIds: ["s1"],
      round: 1,
    });
    expect(run1).toEqual(run2);
  });

  it("reports which submissions could not be fully covered", () => {
    // If no eligible judges, assignedCount will be < requested
    const constrainedJudges: JudgeProfile[] = [
      { id: "j1", trackIds: ["t1"], conflictSubmissionIds: [] },
    ];
    const assignments = generateAssignments(constrainedJudges, submissions, {
      judgesPerSubmission: 2,
      anchorSubmissionIds: [],
      round: 1,
    });

    const s2Judges = assignments.filter((a) => a.submissionId === "s2");
    expect(s2Judges.length).toBe(0); // j1 not eligible for t2
  });
});
