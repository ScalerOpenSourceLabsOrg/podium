import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { getEventBySlug, getEventRoles } from "@/lib/queries/events";

type PageProps = {
  searchParams: Promise<{ role?: string; slug?: string }>;
};

export default async function AccessDeniedPage({ searchParams }: PageProps) {
  const { role, slug } = await searchParams;
  const session = await auth();

  const user = session?.user;
  const event = slug ? await getEventBySlug(slug) : null;
  const userRoles = slug && user?.id ? await getEventRoles(slug, user.id) : [];

  const requiredRoleTitle =
    role === "ORGANIZER"
      ? "Organizer Privileges Required"
      : role === "JUDGE"
      ? "Judge Privileges Required"
      : "Restricted Access";

  const requiredRoleDescription =
    role === "ORGANIZER"
      ? "This administrative console is restricted to event organizers. Registrants, judges, and visitors cannot access this area."
      : role === "JUDGE"
      ? "This judging workstation is restricted to invited judges assigned to evaluate submissions."
      : "You do not have the required permissions to view this resource.";

  return (
    <div className="min-h-screen bg-[#070709] text-neutral-100 flex flex-col justify-center items-center p-6 font-sans selection:bg-red-500 selection:text-white antialiased">
      {/* Background Cyber Grid */}
      <div className="fixed inset-0 bg-[radial-gradient(#1c1d22_1px,transparent_1px)] [bg-size:16px_16px] opacity-40 pointer-events-none" />

      <main className="relative z-10 w-full max-w-xl border border-red-500/20 bg-[#0d0e12]/95 rounded-2xl p-8 space-y-6 shadow-[0_0_50px_rgba(239,68,68,0.15)] backdrop-blur-xl cyber-border">
        {/* Security Badge Header */}
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>403 // ACCESS_DENIED</span>
          </div>
          <span className="text-xs font-mono text-neutral-500">
            {event ? `/e/${event.slug}` : "podium-security"}
          </span>
        </div>

        {/* Title & Explanation */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {requiredRoleTitle}
          </h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            {requiredRoleDescription}
          </p>
        </div>

        {/* User Context Diagnostic Box */}
        <div className="p-4 rounded-xl border border-neutral-800/80 bg-neutral-950/80 font-mono text-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span>SIGNED_IN_AS:</span>
            <span className="text-white font-medium">
              {user ? user.email : "Anonymous / Guest"}
            </span>
          </div>
          {event && (
            <div className="flex items-center justify-between text-neutral-400">
              <span>TARGET_EVENT:</span>
              <span className="text-emerald-400">{event.name}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-neutral-400">
            <span>YOUR_EVENT_ROLE:</span>
            <span className={userRoles.length > 0 ? "text-amber-400" : "text-neutral-500"}>
              {userRoles.length > 0 ? userRoles.join(", ") : "Registrant / No Special Role"}
            </span>
          </div>
        </div>

        {/* Navigation Action Cluster */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3 font-mono text-xs">
          {role && (
            <Link
              href={`/auth/signin?role=${role}&callbackUrl=${encodeURIComponent(slug ? (role === "ORGANIZER" ? `/admin/${slug}` : `/judge/${slug}`) : "/")}`}
              className="flex-1 text-center py-2.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors shadow-[0_0_15px_rgba(168,85,247,0.3)]"
            >
              Sign In as {role === "ORGANIZER" ? "Organizer" : "Judge"} &rarr;
            </Link>
          )}

          {slug ? (
            <Link
              href={`/e/${slug}`}
              className="flex-1 text-center py-2.5 px-4 rounded-lg border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 transition-colors"
            >
              &larr; Event Overview
            </Link>
          ) : (
            <Link
              href="/"
              className="flex-1 text-center py-2.5 px-4 rounded-lg bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition-colors"
            >
              &larr; Return Home
            </Link>
          )}

          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <button
              type="submit"
              className="w-full sm:w-auto py-2.5 px-4 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
            >
              Sign Out
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
