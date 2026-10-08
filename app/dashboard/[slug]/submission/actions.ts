"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { getEventBySlug } from "@/lib/queries/events";
import { getTeamForUser } from "@/lib/queries/teams";
import { saveSubmissionDraft, submitSubmission } from "@/lib/queries/submissions";
import { SubmissionSchema } from "@/lib/schemas/submission";

export async function saveDraftAction(slug: string, formData: FormData) {
  const user = await requireUser();
  const event = await getEventBySlug(slug);
  if (!event) return { errors: { _form: ["Event not found"] } };

  const team = await getTeamForUser(event.id, user.id);
  if (!team) return { errors: { _form: ["You must create or join a team first"] } };

  const rawData = {
    title: formData.get("title") as string,
    tagline: (formData.get("tagline") as string) || undefined,
    descriptionMd: (formData.get("descriptionMd") as string) || "",
    repoUrl: (formData.get("repoUrl") as string) || undefined,
    demoUrl: (formData.get("demoUrl") as string) || undefined,
    videoUrl: (formData.get("videoUrl") as string) || undefined,
    trackId: (formData.get("trackId") as string) || null,
    tech: formData.getAll("tech").map(String),
  };

  const parsed = SubmissionSchema.safeParse(rawData);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await saveSubmissionDraft(event.id, team.id, parsed.data);
    revalidatePath(`/dashboard/${slug}/submission`);
    return { success: true };
  } catch (err: any) {
    return { errors: { _form: [err.message || "Failed to save draft"] } };
  }
}

export async function submitAction(slug: string, formData: FormData) {
  const user = await requireUser();
  const event = await getEventBySlug(slug);
  if (!event) return { errors: { _form: ["Event not found"] } };

  const team = await getTeamForUser(event.id, user.id);
  if (!team) return { errors: { _form: ["You must create or join a team first"] } };

  const rawData = {
    title: formData.get("title") as string,
    tagline: (formData.get("tagline") as string) || undefined,
    descriptionMd: (formData.get("descriptionMd") as string) || "",
    repoUrl: (formData.get("repoUrl") as string) || undefined,
    demoUrl: (formData.get("demoUrl") as string) || undefined,
    videoUrl: (formData.get("videoUrl") as string) || undefined,
    trackId: (formData.get("trackId") as string) || null,
    tech: formData.getAll("tech").map(String),
  };

  const parsed = SubmissionSchema.safeParse(rawData);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await submitSubmission(event.id, team.id, parsed.data);
    revalidatePath(`/dashboard/${slug}/submission`);
    return { success: true };
  } catch (err: any) {
    return { errors: { _form: [err.message || "Failed to submit project"] } };
  }
}
