"use server";

import { revalidatePath } from "next/cache";
import { requireJudge } from "@/lib/auth";
import { getEventBySlug } from "@/lib/queries/events";
import { saveScore } from "@/lib/queries/judging";
import { ScoreInputSchema } from "@/lib/schemas/judging";

export async function saveScoreAction(slug: string, formData: FormData) {
  const judge = await requireJudge(slug);
  const event = await getEventBySlug(slug);
  if (!event) return { errors: { _form: ["Event not found"] } };

  const parsed = ScoreInputSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
    criterionId: formData.get("criterionId"),
    value: Number(formData.get("value")),
    comment: formData.get("comment") || "",
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await saveScore(
      event.id,
      judge.id,
      parsed.data.assignmentId,
      parsed.data.criterionId,
      parsed.data.value,
      parsed.data.comment,
    );
    revalidatePath(`/judge/${slug}`);
    return { success: true };
  } catch (err: any) {
    return { errors: { _form: [err.message || "Failed to save score"] } };
  }
}
