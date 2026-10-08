import { getEventBySlug } from "@/lib/queries/events";
import { getAwardsForEvent, getRankingsForEvent } from "@/lib/queries/results";
import { CsvExportButton } from "@/components/shared/CsvExportButton";
import { createAwardAction, toggleVisibilityAction } from "../actions";

type Params = { params: Promise<{ slug: string }> };

export default async function AdminResultsPage({ params }: Params) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) return <main className="p-8">Event not found.</main>;

  const { overall } = await getRankingsForEvent(event.id);
  const awards = await getAwardsForEvent(event.id);

  return (
    <main className="max-w-6xl mx-auto px-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold">Results & Rankings Engine</h1>
          <p className="text-sm text-neutral-500">
            Z-Score normalized leaderboards & awards control room.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CsvExportButton slug={slug} type="rankings" label="Export Rankings CSV" />
        </div>
      </div>

      <div className="border p-6 rounded-xl bg-white dark:bg-neutral-900 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-bold">Public Release Settings</h3>
          <p className="text-xs text-neutral-500">
            Winners Public: {event.winnersPublic ? "Published ✓" : "Private 🔒"} | Gallery Public:{" "}
            {event.galleryPublic ? "Published ✓" : "Private 🔒"}
          </p>
        </div>
        <form className="flex items-center gap-2">
          <button
            formAction={toggleVisibilityAction.bind(null, slug, !event.winnersPublic, event.galleryPublic)}
            type="submit"
            className="px-4 py-2 border rounded-md text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            {event.winnersPublic ? "Hide Winners" : "Publish Winners 🎉"}
          </button>
          <button
            formAction={toggleVisibilityAction.bind(null, slug, event.winnersPublic, !event.galleryPublic)}
            type="submit"
            className="px-4 py-2 border rounded-md text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            {event.galleryPublic ? "Hide Public Gallery" : "Publish Gallery 🖼️"}
          </button>
        </form>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Normalized Leaderboard Table */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Computed Z-Score Leaderboard</h2>
          <div className="border rounded-xl bg-white dark:bg-neutral-900 dark:border-neutral-800 overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b dark:border-neutral-800 text-neutral-500 text-xs font-semibold uppercase bg-neutral-50 dark:bg-neutral-800/50">
                  <th className="p-3">Rank</th>
                  <th className="p-3">Submission</th>
                  <th className="p-3">Normalized Score</th>
                  <th className="p-3">Judges</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-neutral-800">
                {overall.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-neutral-500">
                      No scores recorded yet.
                    </td>
                  </tr>
                ) : (
                  overall.map((r) => (
                    <tr key={r.submissionId}>
                      <td className="p-3 font-bold font-mono">#{r.rank}</td>
                      <td className="p-3">
                        <div className="font-semibold">{r.submission?.title}</div>
                        <div className="text-xs text-neutral-500">{r.submission?.team.name}</div>
                      </td>
                      <td className="p-3 font-mono font-semibold">
                        {r.total.toFixed(3)}
                      </td>
                      <td className="p-3 text-xs">{r.judgeCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Awards & Manual Overrides Section */}
        <div className="space-y-6">
          <div className="border p-6 rounded-xl bg-white dark:bg-neutral-900 dark:border-neutral-800 space-y-4">
            <h2 className="text-lg font-bold">Create Award</h2>
            <form action={createAwardAction.bind(null, slug)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Award Name *</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. 1st Place Overall"
                  className="w-full px-3 py-2 text-sm border rounded dark:bg-neutral-800 dark:border-neutral-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Assign Winner Submission</label>
                <select
                  name="submissionId"
                  className="w-full px-3 py-2 text-sm border rounded dark:bg-neutral-800 dark:border-neutral-700"
                >
                  <option value="">Select Winner...</option>
                  {overall.map((r) => (
                    <option key={r.submissionId} value={r.submissionId}>
                      #{r.rank} {r.submission?.title} ({r.submission?.team.name})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Override Reason (Required if overriding computed rank)</label>
                <input
                  name="overrideReason"
                  type="text"
                  placeholder="Auditable reason for manual rank override..."
                  className="w-full px-3 py-2 text-sm border rounded dark:bg-neutral-800 dark:border-neutral-700"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded font-medium text-sm"
              >
                Create Award
              </button>
            </form>
          </div>

          <div className="border p-6 rounded-xl bg-white dark:bg-neutral-900 dark:border-neutral-800 space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-neutral-500">
              Configured Awards ({awards.length})
            </h3>
            {awards.length === 0 ? (
              <p className="text-sm text-neutral-500">No awards configured.</p>
            ) : (
              <div className="space-y-3">
                {awards.map((award) => (
                  <div key={award.id} className="p-4 border rounded-lg dark:border-neutral-800 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-base">{award.name}</div>
                      {award.submission && (
                        <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold rounded">
                          Winner: {award.submission.title}
                        </span>
                      )}
                    </div>
                    {award.overrideReason && (
                      <div className="text-xs p-2 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200 rounded font-mono">
                        Override Reason: {award.overrideReason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
