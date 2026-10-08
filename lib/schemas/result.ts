import { z } from "zod";

export const AwardSchema = z.object({
  name: z.string().min(1, "Award name is required").max(100),
  description: z.string().max(500).optional(),
  trackId: z.string().nullable().optional(),
  position: z.number().int().min(0).default(0),
  submissionId: z.string().nullable().optional(),
  overrideReason: z.string().optional(),
});
