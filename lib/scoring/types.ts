// The shapes lib/scoring/ works in. Deliberately not Prisma types: the scoring
// functions take plain data so tests can build inputs by hand.

export type Criterion = {
  id: string;
  weight: number;
  maxScore: number;
};

export type JudgeProfile = {
  id: string;
  // Empty means eligible for every track.
  trackIds: string[];
  // Submissions this judge must not score (own team, same college, mentor).
  conflictSubmissionIds: string[];
};

export type SubmissionProfile = {
  id: string;
  trackId: string | null;
};

export type AssignmentDraft = {
  judgeId: string;
  submissionId: string;
  round: number;
  isAnchor: boolean;
};

export type RawScore = {
  judgeId: string;
  submissionId: string;
  criterionId: string;
  value: number;
};

export type NormalizedScore = RawScore & {
  // z-score of value within this judge's distribution over the anchor set.
  normalized: number;
};

export type RankedSubmission = {
  submissionId: string;
  trackId: string | null;
  total: number;
  rank: number;
  judgeCount: number;
};
