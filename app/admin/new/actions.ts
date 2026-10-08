"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createNewEvent } from "@/lib/queries/events";
import { EventSchema } from "@/lib/schemas/event";

export async function createEventAction(formData: FormData): Promise<void> {
  const user = await requireUser();

  const rawData = {
    name: formData.get("name") as string,
    slug: formData.get("slug") as string,
    tagline: (formData.get("tagline") as string) || undefined,
    rulesMd: (formData.get("rulesMd") as string) || undefined,
    maxTeamSize: Number(formData.get("maxTeamSize") || 4),
  };

  const parsed = EventSchema.safeParse(rawData);
  if (!parsed.success) {
    throw new Error("Invalid event data. Please check inputs.");
  }

  const event = await createNewEvent(user.id, {
    name: parsed.data.name,
    slug: parsed.data.slug,
    tagline: parsed.data.tagline,
    rulesMd: parsed.data.rulesMd,
    maxTeamSize: parsed.data.maxTeamSize,
  });

  redirect(`/admin/${event.slug}`);
}
