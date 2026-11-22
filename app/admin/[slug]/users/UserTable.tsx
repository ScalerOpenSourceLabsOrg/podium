"use client";

import { useState, useTransition } from "react";
import { removeEventRoleAction, removeEventRegistrationAction } from "./actions";

export type EventUserData = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  roles: ("ORGANIZER" | "JUDGE" | "REGISTRANT")[];
  assignmentCount: number;
  teamName: string | null;
  college: string | null;
  checkedInAt: Date | null;
  registeredAt: Date | null;
};

export function UserTable({ slug, users }: { slug: string; users: EventUserData[] }) {
  const [filterRole, setFilterRole] = useState<"ALL" | "ORGANIZER" | "JUDGE" | "REGISTRANT">("ALL");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(search.toLowerCase()));
    if (!matchesSearch) return false;
    if (filterRole === "ALL") return true;
    return u.roles.includes(filterRole);
  });

  const handleRemoveRole = (userId: string, role: "ORGANIZER" | "JUDGE") => {
    if (!confirm(`Are you sure you want to remove the ${role} role for this user?`)) return;
    const fd = new FormData();
    fd.append("slug", slug);
    fd.append("userId", userId);
    fd.append("role", role);
    startTransition(async () => {
      try { await removeEventRoleAction(fd); }
      catch (e: any) { alert(e.message || "Failed to remove role."); }
    });
  };

  const handleRemoveRegistration = (userId: string) => {
    if (!confirm("Are you sure you want to unregister this registrant?")) return;
    const fd = new FormData();
    fd.append("slug", slug);
    fd.append("userId", userId);
    startTransition(async () => {
      try { await removeEventRegistrationAction(fd); }
      catch (e: any) { alert(e.message || "Failed to unregister."); }
    });
  };

  const counts = {
    all: users.length,
    organizers: users.filter((u) => u.roles.includes("ORGANIZER")).length,
    judges: users.filter((u) => u.roles.includes("JUDGE")).length,
    registrants: users.filter((u) => u.roles.includes("REGISTRANT")).length,
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-black rounded-lg border border-neutral-800 text-xs font-mono">
          <button
            onClick={() => setFilterRole("ALL")}
            className={`px-3 py-1.5 rounded ${filterRole === "ALL" ? "bg-neutral-800 text-white font-bold" : "text-neutral-400 hover:text-white"}`}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => setFilterRole("ORGANIZER")}
            className={`px-3 py-1.5 rounded ${filterRole === "ORGANIZER" ? "bg-purple-600 text-white font-bold" : "text-neutral-400 hover:text-white"}`}
          >
            👑 Organizers ({counts.organizers})
          </button>
          <button
            onClick={() => setFilterRole("JUDGE")}
            className={`px-3 py-1.5 rounded ${filterRole === "JUDGE" ? "bg-amber-600 text-white font-bold" : "text-neutral-400 hover:text-white"}`}
          >
            ⚖️ Judges ({counts.judges})
          </button>
          <button
            onClick={() => setFilterRole("REGISTRANT")}
            className={`px-3 py-1.5 rounded ${filterRole === "REGISTRANT" ? "bg-cyan-600 text-white font-bold" : "text-neutral-400 hover:text-white"}`}
          >
            💻 Registrants ({counts.registrants})
          </button>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by name or email..."
          className="px-3.5 py-2 bg-black border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-neutral-600 w-full sm:w-64"
        />
      </div>

      {/* Table */}
      <div className="border border-neutral-800 rounded-xl bg-[#0d0e12] overflow-hidden">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-900/50 text-neutral-400 text-[10px] uppercase">
              <th className="p-3">User</th>
              <th className="p-3">Roles</th>
              <th className="p-3">Context / Association</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-neutral-500">
                  No users found matching filter.
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="hover:bg-neutral-900/40 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-white font-sans text-sm">{u.name || "Anonymous"}</div>
                    <div className="text-neutral-400 text-[11px] font-mono">{u.email}</div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1.5">
                      {u.roles.map((r) => (
                        <span
                          key={r}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r === "ORGANIZER"
                              ? "bg-purple-900/40 text-purple-300 border border-purple-800"
                              : r === "JUDGE"
                              ? "bg-amber-900/40 text-amber-300 border border-amber-800"
                              : "bg-cyan-900/40 text-cyan-300 border border-cyan-800"
                          }`}
                        >
                          {r === "ORGANIZER" ? "👑 Organizer" : r === "JUDGE" ? "⚖️ Judge" : "💻 Registrant"}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-neutral-400">
                    {u.teamName && <div>Team: <span className="text-white font-sans">{u.teamName}</span></div>}
                    {u.college && <div className="text-[11px] text-neutral-500">{u.college}</div>}
                    {u.assignmentCount > 0 && <div className="text-amber-400 text-[11px]">{u.assignmentCount} assigned submission(s)</div>}
                    {u.checkedInAt && <div className="text-emerald-400 text-[10px]">✓ Checked-in</div>}
                    {!u.teamName && !u.college && !u.assignmentCount && !u.checkedInAt && <span className="text-neutral-600">--</span>}
                  </td>
                  <td className="p-3 text-right">
                    <div className="inline-flex gap-1.5">
                      {u.roles.includes("ORGANIZER") && (
                        <button
                          disabled={isPending}
                          onClick={() => handleRemoveRole(u.id, "ORGANIZER")}
                          className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-purple-400 rounded text-[10px]"
                        >
                          Revoke Org
                        </button>
                      )}
                      {u.roles.includes("JUDGE") && (
                        <button
                          disabled={isPending}
                          onClick={() => handleRemoveRole(u.id, "JUDGE")}
                          className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-amber-400 rounded text-[10px]"
                        >
                          Revoke Judge
                        </button>
                      )}
                      {u.roles.includes("REGISTRANT") && (
                        <button
                          disabled={isPending}
                          onClick={() => handleRemoveRegistration(u.id)}
                          className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-red-400 rounded text-[10px]"
                        >
                          Unregister
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
