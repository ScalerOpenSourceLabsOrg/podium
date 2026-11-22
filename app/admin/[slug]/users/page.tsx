import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrganizer } from "@/lib/auth";
import { getEventUsersWithRoles } from "@/lib/queries/users";
import { UserTable } from "./UserTable";
import { AddUserModal } from "./AddUserModal";

type Params = {
  params: Promise<{ slug: string }>;
};

export default async function AdminUsersPage({ params }: Params) {
  const { slug } = await params;
  await requireOrganizer(slug);

  const data = await getEventUsersWithRoles(slug);
  if (!data) notFound();

  const { event, users } = data;

  const organizersCount = users.filter((u) => u.roles.includes("ORGANIZER")).length;
  const judgesCount = users.filter((u) => u.roles.includes("JUDGE")).length;
  const registrantsCount = users.filter((u) => u.roles.includes("REGISTRANT")).length;

  return (
    <main className="max-w-6xl mx-auto px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 mb-1">
            <Link href={`/admin/${slug}`} className="hover:text-neutral-300">
              /admin/{slug}
            </Link>
            <span>/</span>
            <span className="text-purple-400">users</span>
          </div>
          <h1 className="text-2xl font-bold text-white font-sans">People & Roles</h1>
          <p className="text-xs text-neutral-400 mt-1 font-mono">
            Manage organizers, judges, and registrants associated with {event.name}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <AddUserModal slug={slug} />
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
        <div className="p-4 rounded-xl border border-neutral-800 bg-[#0d0e12]">
          <div className="text-[10px] uppercase text-purple-400 font-bold">Organizers</div>
          <div className="text-2xl font-bold text-white font-sans mt-1">{organizersCount}</div>
          <div className="text-[11px] text-neutral-500 mt-0.5">Admin & settings access</div>
        </div>
        <div className="p-4 rounded-xl border border-neutral-800 bg-[#0d0e12]">
          <div className="text-[10px] uppercase text-amber-400 font-bold">Judges</div>
          <div className="text-2xl font-bold text-white font-sans mt-1">{judgesCount}</div>
          <div className="text-[11px] text-neutral-500 mt-0.5">Scoring & evaluation queue</div>
        </div>
        <div className="p-4 rounded-xl border border-neutral-800 bg-[#0d0e12]">
          <div className="text-[10px] uppercase text-cyan-400 font-bold">Registrants</div>
          <div className="text-2xl font-bold text-white font-sans mt-1">{registrantsCount}</div>
          <div className="text-[11px] text-neutral-500 mt-0.5">Registrants & teams</div>
        </div>
      </div>

      {/* Main Interactive Table */}
      <UserTable slug={slug} users={users} />
    </main>
  );
}
