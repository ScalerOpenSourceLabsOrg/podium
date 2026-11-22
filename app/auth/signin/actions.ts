"use server";

import { z } from "zod";
import { signIn, signOut } from "@/lib/auth";

const LoginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  name: z.string().optional(),
  role: z.enum(["ORGANIZER", "JUDGE", "REGISTRANT"]).default("REGISTRANT"),
  redirectTo: z.string().optional(),
});

export async function customLoginAction(formData: FormData) {
  const raw = {
    email: formData.get("email"),
    name: formData.get("name") || undefined,
    role: formData.get("role") || undefined,
    redirectTo: formData.get("redirectTo") || undefined,
  };

  const parsed = LoginSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid login credentials.");
  }

  await signIn("dev", {
    email: parsed.data.email,
    name: parsed.data.name,
    role: parsed.data.role,
    redirectTo: parsed.data.redirectTo || "/",
  });
}

export async function signOutAction() {
  await signOut();
}
