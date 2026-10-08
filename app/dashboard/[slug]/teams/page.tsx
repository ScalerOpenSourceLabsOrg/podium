import Link from "next/link";
import { getEventBySlug } from "@/lib/queries/events";
import { getOpenTeams } from "@/lib/queries/teams";
import { EmptyState } from "@/components/shared/EmptyState";
import { joinTeamAction } from "../team/actions";

type Params = { params: Promise<{ slug: string }>; searchParams: Promise<{ skill?: string }> };

export default async function OpenTeamsPage({ params, searchParams }: Params) {
  const { slug } = await params;
  const { skill } = await searchParams;
  const event = await getEventBySlug(slug);

  if (!event) return <main className="p-8">Event not found.</main>;

  const openTeams = await getOpenTeams(event.id, skill);

  // Extract all distinct lookingFor skills across all open teams for the dropdown
  const allOpenTeams = await getOpenTeams(event.id);
  const distinctSkills = [
    ...new Set(allOpenTeams.flatMap((t) => t.lookingFor)),
  ].sort();

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Open Teams Browser</h1>
          <p className="text-sm text-neutral-500">
            Teams looking for members for {event.name}.
          </p>
        </div>
        <Link
          href={`/dashboard/${slug}/team`}
          className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:underline"
        >
          &larr; Back to your team
        </Link>
      </div>

      <div className="flex items-center gap-4 bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg border dark:border-neutral-800">
        <label className="text-sm font-medium whitespace-nowrap">Filter by Skill:</label>
        <form method="GET" className="flex items-center gap-2 w-full max-w-xs">
          <select
            name="skill"
            defaultValue={skill || ""}
            className="w-full px-3 py-1.5 text-sm border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
          >
            <option value="">All Skills</option>
            {distinctSkills.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-3 py-1.5 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-md text-sm font-medium"
          >
            Filter
          </button>
        </form>
      </div>

      {openTeams.length === 0 ? (
        <EmptyState
          title="No open teams found"
          description={
            skill
              ? `No teams are currently looking for "${skill}". Try selecting a different skill.`
              : "No teams are currently accepting new members."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {openTeams.map((team) => (
            <div
              key={team.id}
              className="border rounded-lg p-5 flex flex-col justify-between dark:border-neutral-800 bg-white dark:bg-neutral-950"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{team.name}</h3>
                  <span className="text-xs px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded font-mono">
                    {team.members.length} / {event.maxTeamSize} members
                  </span>
                </div>

                <div className="space-y-1 mb-4">
                  <div className="text-xs text-neutral-500 font-semibold uppercase">Looking for:</div>
                  <div className="flex flex-wrap gap-1">
                    {team.lookingFor.length === 0 ? (
                      <span className="text-xs text-neutral-400">Any role</span>
                    ) : (
                      team.lookingFor.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded text-xs"
                        >
                          {s}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <form action={joinTeamAction.bind(null, slug)}>
                <input type="hidden" name="inviteCode" value={team.inviteCode} />
                <button
                  type="submit"
                  className="w-full py-2 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-md font-medium text-sm hover:opacity-90"
                >
                  Join Team ({team.inviteCode})
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
