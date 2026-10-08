"use server";

import { revalidatePath } from "next/cache";
import { requireOrganizer } from "@/lib/auth";
import {
  createCriterion,
  createTrack,
  getEventBySlug,
} from "@/lib/queries/events";
import { checkInParticipant } from "@/lib/queries/registrations";
import { updateSubmissionVisibility } from "@/lib/queries/submissions";
import { generateAndSaveAssignments } from "@/lib/queries/judging";
import { createAward, setResultsVisibility, updateAwardWinner } from "@/lib/queries/results";
import { CriterionSchema, TrackSchema } from "@/lib/schemas/event";
import { ModerationSchema } from "@/lib/schemas/submission";
import { GenerateAssignmentsSchema } from "@/lib/schemas/judging";
import { AwardSchema } from "@/lib/schemas/result";

export async function createTrackAction(slug: string, formData: FormData) {
  await requireOrganizer(slug);
  const event = await getEventBySlug(slug);
  if (!event) return { errors: { _form: ["Event not found"] } };

  const parsed = TrackSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await createTrack(event.id, parsed.data.name, parsed.data.description);
    revalidatePath(`/admin/${slug}/criteria`);
    return { success: true };
  } catch (err: any) {
    return { errors: { _form: [err.message || "Failed to create track"] } };
  }
}

export async function createCriterionAction(slug: string, formData: FormData) {
  await requireOrganizer(slug);
  const event = await getEventBySlug(slug);
  if (!event) return { errors: { _form: ["Event not found"] } };

  const parsed = CriterionSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    weight: Number(formData.get("weight") || 1),
    maxScore: Number(formData.get("maxScore") || 5),
    position: Number(formData.get("position") || 0),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await createCriterion(event.id, parsed.data);
    revalidatePath(`/admin/${slug}/criteria`);
    return { success: true };
  } catch (err: any) {
    return { errors: { _form: [err.message || "Failed to create criterion"] } };
  }
}

export async function checkInParticipantAction(slug: string, registrationId: string) {
  await requireOrganizer(slug);
  const event = await getEventBySlug(slug);
  if (!event) return { errors: { _form: ["Event not found"] } };

  try {
    await checkInParticipant(event.id, registrationId);
    revalidatePath(`/admin/${slug}/check-in`);
    return { success: true };
  } catch (err: any) {
    return { errors: { _form: [err.message || "Check-in failed"] } };
  }
}

export async function updateModerationAction(slug: string, formData: FormData) {
  await requireOrganizer(slug);
  const event = await getEventBySlug(slug);
  if (!event) return { errors: { _form: ["Event not found"] } };

  const parsed = ModerationSchema.safeParse({
    submissionId: formData.get("submissionId"),
    visibility: formData.get("visibility"),
    judgeable: formData.get("judgeable") === "true",
    organizerNotes: formData.get("organizerNotes") || "",
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateSubmissionVisibility(
      event.id,
      parsed.data.submissionId,
      parsed.data.visibility,
      parsed.data.judgeable,
      parsed.data.organizerNotes,
    );
    revalidatePath(`/admin/${slug}/submissions`);
    return { success: true };
  } catch (err: any) {
    return { errors: { _form: [err.message || "Moderation update failed"] } };
  }
}

export async function generateAssignmentsAction(slug: string, formData: FormData) {
  await requireOrganizer(slug);
  const event = await getEventBySlug(slug);
  if (!event) return { errors: { _form: ["Event not found"] } };

  const anchorSubmissionIds = formData.getAll("anchorSubmissionIds").map(String);
  const parsed = GenerateAssignmentsSchema.safeParse({
    judgesPerSubmission: Number(formData.get("judgesPerSubmission") || 2),
    anchorSubmissionIds,
    round: Number(formData.get("round") || 1),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await generateAndSaveAssignments(event.id, parsed.data);
    revalidatePath(`/admin/${slug}/assignments`);
    return { success: true };
  } catch (err: any) {
    return { errors: { _form: [err.message || "Failed to generate assignments"] } };
  }
}

export async function createAwardAction(slug: string, formData: FormData) {
  await requireOrganizer(slug);
  const event = await getEventBySlug(slug);
  if (!event) return { errors: { _form: ["Event not found"] } };

  const parsed = AwardSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    trackId: formData.get("trackId") || null,
    position: Number(formData.get("position") || 0),
    submissionId: formData.get("submissionId") || null,
    overrideReason: formData.get("overrideReason") || undefined,
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await createAward(event.id, parsed.data);
    revalidatePath(`/admin/${slug}/results`);
    return { success: true };
  } catch (err: any) {
    return { errors: { _form: [err.message || "Failed to create award"] } };
  }
}

export async function updateAwardWinnerAction(slug: string, formData: FormData) {
  await requireOrganizer(slug);
  const event = await getEventBySlug(slug);
  if (!event) return { errors: { _form: ["Event not found"] } };

  const awardId = formData.get("awardId") as string;
  const submissionId = (formData.get("submissionId") as string) || null;
  const overrideReason = (formData.get("overrideReason") as string) || undefined;

  try {
    await updateAwardWinner(event.id, awardId, submissionId, overrideReason);
    revalidatePath(`/admin/${slug}/results`);
    return { success: true };
  } catch (err: any) {
    return { errors: { _form: [err.message || "Failed to update award winner"] } };
  }
}

export async function toggleVisibilityAction(slug: string, winnersPublic: boolean, galleryPublic: boolean) {
  await requireOrganizer(slug);
  try {
    await setResultsVisibility(slug, winnersPublic, galleryPublic);
    revalidatePath(`/admin/${slug}/results`);
    revalidatePath(`/e/${slug}`);
    return { success: true };
  } catch (err: any) {
    return { errors: { _form: [err.message || "Failed to update visibility"] } };
  }
}
