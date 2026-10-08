import { z } from "zod";

export const ScoreInputSchema = z.object({
  assignmentId: z.string().min(1),
  criterionId: z.string().min(1),
  value: z.number().min(0),
  comment: z.string().default(""),
});

export const GenerateAssignmentsSchema = z.object({
  judgesPerSubmission: z.number().int().min(1).default(2),
  anchorSubmissionIds: z.array(z.string()).default([]),
  round: z.number().int().min(1).default(1),
});
