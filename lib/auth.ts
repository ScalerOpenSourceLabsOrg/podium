import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import type { Provider } from "next-auth/providers";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getEventRoles } from "@/lib/queries/events";
import { getUserByEmail } from "@/lib/queries/users";

const isProduction = process.env.NODE_ENV === "production";

const devProviders: Provider[] =
  process.env.NODE_ENV === "production"
    ? []
    : [
        Credentials({
          id: "dev",
          name: "Developer / Local Login",
          credentials: {
            email: { label: "Email", type: "email", placeholder: "user@example.com" },
            name: { label: "Name (Optional)", type: "text", placeholder: "Your Name" },
            role: { label: "Role", type: "text", placeholder: "ORGANIZER, PARTICIPANT, JUDGE" },
          },
          async authorize(credentials: { email?: unknown; name?: unknown; role?: unknown }) {
            const email = credentials?.email;
            if (typeof email !== "string" || !email.trim()) return null;

            const trimmedEmail = email.trim().toLowerCase();
            let user = await getUserByEmail(trimmedEmail);

            if (!user) {
              const displayName =
                typeof credentials?.name === "string" && credentials.name.trim()
                  ? credentials.name.trim()
                  : trimmedEmail.split("@")[0];

              user = await prisma.user.create({
                data: {
                  email: trimmedEmail,
                  name: displayName,
                },
              });
            }

            // Assign chosen role to active event if role is passed and active event exists
            const roleStr = typeof credentials?.role === "string" ? credentials.role.toUpperCase() : "";
            const activeEvent = await prisma.event.findFirst({
              where: { status: "PUBLISHED" },
              orderBy: { createdAt: "desc" },
            });

            if (activeEvent && user && roleStr) {
              if (roleStr === "ORGANIZER") {
                await prisma.eventMembership.upsert({
                  where: {
                    eventId_userId_role: { eventId: activeEvent.id, userId: user.id, role: "ORGANIZER" },
                  },
                  update: {},
                  create: { eventId: activeEvent.id, userId: user.id, role: "ORGANIZER" },
                });
              } else if (roleStr === "JUDGE") {
                await prisma.eventMembership.upsert({
                  where: {
                    eventId_userId_role: { eventId: activeEvent.id, userId: user.id, role: "JUDGE" },
                  },
                  update: {},
                  create: { eventId: activeEvent.id, userId: user.id, role: "JUDGE" },
                });
              } else if (roleStr === "PARTICIPANT") {
                await prisma.registration.upsert({
                  where: {
                    eventId_userId: { eventId: activeEvent.id, userId: user.id },
                  },
                  update: {},
                  create: { eventId: activeEvent.id, userId: user.id },
                });
              }
            }

            return user;
          },
        }),
      ];

const activeProviders: Provider[] = [];

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  activeProviders.push(
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  );
}

if (process.env.RESEND_API_KEY) {
  activeProviders.push(
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM,
    }),
  );
}

activeProviders.push(...devProviders);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: { strategy: isProduction ? "database" : "jwt" },
  providers: activeProviders,
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    session({ session, token, user }) {
      const id = user?.id ?? token?.sub;
      if (session.user && id) session.user.id = id;
      return session;
    },
  },
});

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");
  return { ...session.user, id: session.user.id };
}

export async function requireJudge(slug: string) {
  const user = await requireUser();
  const roles = await getEventRoles(slug, user.id);
  if (!roles.includes("JUDGE")) redirect(`/e/${slug}`);
  return user;
}

export async function requireOrganizer(slug: string) {
  const user = await requireUser();
  const roles = await getEventRoles(slug, user.id);
  if (!roles.includes("ORGANIZER")) redirect(`/e/${slug}`);
  return user;
}
