"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireOrganizer } from "@/lib/auth";
import {
  addEventRole,
  removeEventRole,
  removeEventRegistration,
} from "@/lib/queries/users";

const AddMemberSchema = z.object({
  slug: z.string().min(1),
  email: z.string().email("A valid email address is required."),
  role: z.enum(["ORGANIZER", "JUDGE"]),
  name: z.string().optional(),
});

const RemoveMemberSchema = z.object({
  slug: z.string().min(1),
  userId: z.string().min(1),
  role: z.enum(["ORGANIZER", "JUDGE"]),
});

const RemoveRegistrationSchema = z.object({
  slug: z.string().min(1),
  userId: z.string().min(1),
});

export async function addEventRoleAction(formData: FormData) {
  const raw = {
    slug: formData.get("slug"),
    email: formData.get("email"),
    role: formData.get("role"),
    name: formData.get("name") || undefined,
  };

  const parsed = AddMemberSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid input data.");
  }

  await requireOrganizer(parsed.data.slug);
  await addEventRole(
    parsed.data.slug,
    parsed.data.email,
    parsed.data.role,
    parsed.data.name
  );

  revalidatePath(`/admin/${parsed.data.slug}/users`);
}

export async function removeEventRoleAction(formData: FormData) {
  const raw = {
    slug: formData.get("slug"),
    userId: formData.get("userId"),
    role: formData.get("role"),
  };

  const parsed = RemoveMemberSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid member data.");
  }

  await requireOrganizer(parsed.data.slug);
  await removeEventRole(parsed.data.slug, parsed.data.userId, parsed.data.role);

  revalidatePath(`/admin/${parsed.data.slug}/users`);
}

export async function removeEventRegistrationAction(formData: FormData) {
  const raw = {
    slug: formData.get("slug"),
    userId: formData.get("userId"),
  };

  const parsed = RemoveRegistrationSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid registrant data.");
  }

  await requireOrganizer(parsed.data.slug);
  await removeEventRegistration(parsed.data.slug, parsed.data.userId);

  revalidatePath(`/admin/${parsed.data.slug}/users`);
}
