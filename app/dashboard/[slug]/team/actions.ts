"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { getEventBySlug } from "@/lib/queries/events";
import {
  createTeam,
  joinTeamByInviteCode,
  leaveTeam,
  updateTeamLookingFor,
} from "@/lib/queries/teams";
import {
  CreateTeamSchema,
  JoinTeamSchema,
  UpdateLookingForSchema,
} from "@/lib/schemas/team";

export async function createTeamAction(slug: string, formData: FormData) {
  const user = await requireUser();
  const event = await getEventBySlug(slug);
  if (!event) return { errors: { _form: ["Event not found"] } };

  const rawData = {
    name: formData.get("name"),
    isOpen: formData.get("isOpen") === "true",
    lookingFor: formData.getAll("lookingFor").map(String),
  };

  const parsed = CreateTeamSchema.safeParse(rawData);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await createTeam(
      event.id,
      user.id,
      parsed.data.name,
      parsed.data.isOpen,
      parsed.data.lookingFor,
    );
    revalidatePath(`/dashboard/${slug}/team`);
    return { success: true };
  } catch (err: any) {
    return { errors: { _form: [err.message || "Failed to create team"] } };
  }
}

export async function joinTeamAction(slug: string, formData: FormData) {
  const user = await requireUser();
  const event = await getEventBySlug(slug);
  if (!event) return { errors: { _form: ["Event not found"] } };

  const parsed = JoinTeamSchema.safeParse({
    inviteCode: formData.get("inviteCode"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await joinTeamByInviteCode(event.id, user.id, parsed.data.inviteCode);
    revalidatePath(`/dashboard/${slug}/team`);
    return { success: true };
  } catch (err: any) {
    return { errors: { _form: [err.message || "Failed to join team"] } };
  }
}

export async function leaveTeamAction(slug: string) {
  const user = await requireUser();
  const event = await getEventBySlug(slug);
  if (!event) return { errors: { _form: ["Event not found"] } };

  try {
    await leaveTeam(event.id, user.id);
    revalidatePath(`/dashboard/${slug}/team`);
    return { success: true };
  } catch (err: any) {
    return { errors: { _form: [err.message || "Failed to leave team"] } };
  }
}

export async function updateLookingForAction(
  slug: string,
  teamId: string,
  lookingFor: string[],
) {
  const user = await requireUser();
  const event = await getEventBySlug(slug);
  if (!event) return { errors: { _form: ["Event not found"] } };

  const parsed = UpdateLookingForSchema.safeParse({ lookingFor });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateTeamLookingFor(event.id, teamId, user.id, parsed.data.lookingFor);
    revalidatePath(`/dashboard/${slug}/team`);
    return { success: true };
  } catch (err: any) {
    return { errors: { _form: [err.message || "Failed to update tags"] } };
  }
}
