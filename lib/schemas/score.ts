import { z } from "zod";

export const ScoreSchema = z.object({
  assignmentId: z.string().cuid(),
  criterionId: z.string().cuid(),
  value: z.coerce.number().min(0),
  comment: z
    .string()
    .min(1, "A comment is required with every score")
    .max(2000),
});

export const ScoreSheetSchema = z.object({
  assignmentId: z.string().cuid(),
  scores: z.array(ScoreSchema.omit({ assignmentId: true })).min(1),
});

export const OverrideSchema = z.object({
  submissionId: z.string().cuid(),
  overrideReason: z
    .string()
    .min(1, "Record why you are overriding the ranking")
    .max(500),
});
