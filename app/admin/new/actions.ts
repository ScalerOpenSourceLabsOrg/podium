"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createNewEvent, getEventBySlug } from "@/lib/queries/events";
import { EventSchema } from "@/lib/schemas/event";

export type CreateEventState = {
  errors?: {
    name?: string[];
    slug?: string[];
    tagline?: string[];
    rulesMd?: string[];
    maxTeamSize?: string[];
    _form?: string[];
  };
  values?: {
    name?: string;
    slug?: string;
    tagline?: string;
    rulesMd?: string;
    maxTeamSize?: number;
  };
};

export async function createEventAction(
  _prevState: CreateEventState | null,
  formData: FormData,
): Promise<CreateEventState> {
  const user = await requireUser();

  const rawName = ((formData.get("name") as string) || "").trim();
  let rawSlug = ((formData.get("slug") as string) || "").trim().toLowerCase();
  const rawTagline = ((formData.get("tagline") as string) || "").trim();
  const rawRulesMd = ((formData.get("rulesMd") as string) || "").trim();
  const rawMaxTeamSize = Number(formData.get("maxTeamSize") || 4);

  // Auto-slugify if user didn't enter a clean slug
  rawSlug = rawSlug.replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  if (!rawSlug && rawName) {
    rawSlug = rawName
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  const rawData = {
    name: rawName,
    slug: rawSlug,
    tagline: rawTagline || undefined,
    rulesMd: rawRulesMd || undefined,
    maxTeamSize: rawMaxTeamSize,
  };

  const parsed = EventSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      values: {
        name: rawName,
        slug: rawSlug,
        tagline: rawTagline,
        rulesMd: rawRulesMd,
        maxTeamSize: rawMaxTeamSize,
      },
    };
  }

  // Check if slug is already taken
  const existingEvent = await getEventBySlug(parsed.data.slug);
  if (existingEvent) {
    return {
      errors: {
        slug: [`The slug "${parsed.data.slug}" is already in use by another event. Please choose a different one.`],
      },
      values: {
        name: rawName,
        slug: rawSlug,
        tagline: rawTagline,
        rulesMd: rawRulesMd,
        maxTeamSize: rawMaxTeamSize,
      },
    };
  }

  let event;
  try {
    event = await createNewEvent(user.id, {
      name: parsed.data.name,
      slug: parsed.data.slug,
      tagline: parsed.data.tagline,
      rulesMd: parsed.data.rulesMd,
      maxTeamSize: parsed.data.maxTeamSize,
    });
  } catch (err: any) {
    return {
      errors: {
        _form: [err.message || "Failed to create event in the database."],
      },
      values: {
        name: rawName,
        slug: rawSlug,
        tagline: rawTagline,
        rulesMd: rawRulesMd,
        maxTeamSize: rawMaxTeamSize,
      },
    };
  }

  redirect(`/admin/${event.slug}`);
}
