import { z } from "zod";

export const CreateTeamSchema = z.object({
  name: z.string().min(1, "Team name is required").max(100),
  isOpen: z.boolean().default(true),
  lookingFor: z.array(z.string()).default([]),
});

export const JoinTeamSchema = z.object({
  inviteCode: z.string().min(1, "Invite code is required"),
});

export const UpdateLookingForSchema = z.object({
  lookingFor: z.array(z.string()),
});
