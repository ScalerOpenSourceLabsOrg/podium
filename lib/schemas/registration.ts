import { z } from "zod";

export const RegistrationSchema = z.object({
  college: z.string().max(100).optional(),
  yearOfStudy: z.string().max(50).optional(),
  phone: z.string().max(20).optional(),
  answers: z.record(z.string(), z.unknown()).default({}),
});

export const CheckInSchema = z.object({
  registrationId: z.string().min(1),
});
