import { prisma } from "@/lib/db";

// Users are global — one person can register for one event and judge another —
// so this is one of the few queries with no eventId filter. Their relationship
// to an event lives in EventMembership. See docs/DATA_MODEL.md.
export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}
