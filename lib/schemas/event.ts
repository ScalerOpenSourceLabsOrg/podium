import { z } from "zod";

export const EventSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric and hyphens"),
  tagline: z.string().max(200).optional(),
  rulesMd: z.string().optional().default(""),
  timezone: z.string().default("Asia/Kolkata"),
  maxTeamSize: z.number().int().min(1).max(20).default(4),
  registrationOpensAt: z.string().nullable().optional(),
  registrationClosesAt: z.string().nullable().optional(),
  submissionOpensAt: z.string().nullable().optional(),
  submissionClosesAt: z.string().nullable().optional(),
  judgingOpensAt: z.string().nullable().optional(),
  judgingClosesAt: z.string().nullable().optional(),
});

export const TrackSchema = z.object({
  name: z.string().min(1, "Track name is required").max(100),
  description: z.string().max(500).optional(),
});

export const CriterionSchema = z.object({
  name: z.string().min(1, "Criterion name is required").max(100),
  description: z.string().max(500).optional(),
  weight: z.number().min(0.1).max(10).default(1),
  maxScore: z.number().int().min(1).max(100).default(5),
  position: z.number().int().min(0).default(0),
});
