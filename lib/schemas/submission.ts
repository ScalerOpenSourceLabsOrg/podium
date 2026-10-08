import { z } from "zod";

export const SubmissionSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  tagline: z.string().max(200).optional(),
  descriptionMd: z.string().default(""),
  repoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  demoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  videoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  trackId: z.string().nullable().optional(),
  tech: z.array(z.string()).default([]),
  customAnswers: z.record(z.string(), z.unknown()).default({}),
});

export const ModerationSchema = z.object({
  submissionId: z.string().min(1),
  visibility: z.enum(["PENDING", "GALLERY", "HIDDEN"]),
  judgeable: z.boolean(),
  organizerNotes: z.string().default(""),
});
