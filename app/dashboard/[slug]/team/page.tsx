import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getEventBySlug } from "@/lib/queries/events";
import { getTeamForUser } from "@/lib/queries/teams";
import { CopyButton } from "@/components/shared/CopyButton";
import { createTeamAction, joinTeamAction, leaveTeamAction } from "./actions";

type Params = { params: Promise<{ slug: string }> };

export default async function TeamPage({ params }: Params) {
  const { slug } = await params;
  const user = await requireUser();
  const event = await getEventBySlug(slug);

  if (!event) {
    return <main className="p-8">Event not found.</main>;
  }

  const team = await getTeamForUser(event.id, user.id);

  if (team) {
    return (
      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center border-b pb-4 dark:border-neutral-800">
          <div>
            <h1 className="text-2xl font-bold">{team.name}</h1>
            <p className="text-sm text-neutral-500">Event Team</p>
          </div>
          <form action={leaveTeamAction.bind(null, slug)}>
            <button
              type="submit"
              className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/50 rounded text-sm transition-colors"
            >
              Leave Team
            </button>
          </form>
        </div>

        <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Invite Code
            </div>
            <div className="text-lg font-mono font-bold">{team.inviteCode}</div>
          </div>
          <CopyButton text={team.inviteCode} label="Copy Invite Code" />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Team Members ({team.members.length} / {event.maxTeamSize})</h2>
          <div className="space-y-2">
            {team.members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-3 border rounded-md dark:border-neutral-800"
              >
                <div>
                  <span className="font-medium">{m.user.name || m.user.email}</span>
                  {m.user.githubHandle && (
                    <span className="ml-2 text-xs text-neutral-500">
                      (@{m.user.githubHandle})
                    </span>
                  )}
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-mono">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Skills Looking For</h2>
          <div className="flex flex-wrap gap-2">
            {team.lookingFor.length === 0 ? (
              <span className="text-sm text-neutral-500">No specific skills listed.</span>
            ) : (
              team.lookingFor.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded text-xs"
                >
                  {skill}
                </span>
              ))
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Team Setup</h1>
        <p className="text-sm text-neutral-500">
          Create a new team, join with an invite code, or browse open teams.
        </p>
      </div>

      <div className="border p-6 rounded-lg space-y-4 dark:border-neutral-800">
        <h2 className="text-lg font-semibold">Create a Team</h2>
        <form action={createTeamAction.bind(null, slug)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Team Name</label>
            <input
              name="name"
              type="text"
              required
              className="w-full px-3 py-2 border rounded-md dark:bg-neutral-900 dark:border-neutral-800"
              placeholder="e.g. Binary Beasts"
            />
          </div>
          <div className="flex items-center gap-2">
            <input name="isOpen" type="checkbox" value="true" id="isOpen" defaultChecked />
            <label htmlFor="isOpen" className="text-sm">
              Open to new members looking for a team
            </label>
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-md font-medium text-sm"
          >
            Create Team
          </button>
        </form>
      </div>

      <div className="border p-6 rounded-lg space-y-4 dark:border-neutral-800">
        <h2 className="text-lg font-semibold">Join by Invite Code</h2>
        <form action={joinTeamAction.bind(null, slug)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Invite Code</label>
            <input
              name="inviteCode"
              type="text"
              required
              className="w-full px-3 py-2 border rounded-md uppercase font-mono dark:bg-neutral-900 dark:border-neutral-800"
              placeholder="e.g. A1B2C3D4"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900 rounded-md font-medium text-sm"
          >
            Join Team
          </button>
        </form>
      </div>

      <div className="text-center pt-2">
        <Link
          href={`/dashboard/${slug}/teams`}
          className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          🔍 Browse open teams looking for members &rarr;
        </Link>
      </div>
    </main>
  );
}
