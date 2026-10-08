import { getEventBySlug } from "@/lib/queries/events";
import { getEventAssignments, getJudgesForEvent } from "@/lib/queries/judging";
import { getModerationSubmissions } from "@/lib/queries/submissions";
import { CsvExportButton } from "@/components/shared/CsvExportButton";
import { generateAssignmentsAction } from "../actions";

type Params = { params: Promise<{ slug: string }> };

export default async function AdminAssignmentsPage({ params }: Params) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) return <main className="p-8">Event not found.</main>;

  const assignments = await getEventAssignments(event.id);
  const judges = await getJudgesForEvent(event.id);
  const submissions = await getModerationSubmissions(event.id);
  const judgeableSubmissions = submissions.filter((s) => s.judgeable);

  return (
    <main className="max-w-6xl mx-auto px-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold">Judging Assignments Engine</h1>
          <p className="text-sm text-neutral-500">
            Automated allocation with anchor set baseline.
          </p>
        </div>
        <CsvExportButton slug={slug} type="assignments" label="Export Assignments CSV" />
      </div>

      <div className="border p-6 rounded-xl bg-white dark:bg-neutral-900 dark:border-neutral-800 space-y-4">
        <h2 className="text-lg font-bold">Generate Assignments Matrix</h2>
        <form action={generateAssignmentsAction.bind(null, slug)} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Judges Per Submission</label>
              <input
                type="number"
                name="judgesPerSubmission"
                min="1"
                max="10"
                defaultValue="2"
                className="w-full px-3 py-2 text-sm border rounded dark:bg-neutral-800 dark:border-neutral-700"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Judging Round</label>
              <input
                type="number"
                name="round"
                min="1"
                defaultValue="1"
                className="w-full px-3 py-2 text-sm border rounded dark:bg-neutral-800 dark:border-neutral-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">
              Anchor Submissions (Scored by EVERY judge for z-score normalization)
            </label>
            <div className="max-h-40 overflow-y-auto border p-3 rounded space-y-2 dark:bg-neutral-800 dark:border-neutral-700 text-xs">
              {judgeableSubmissions.length === 0 ? (
                <p className="text-neutral-500">No judgeable submissions available.</p>
              ) : (
                judgeableSubmissions.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="anchorSubmissionIds"
                      value={s.id}
                    />
                    <span className="font-semibold">{s.title}</span>
                    <span className="text-neutral-500">({s.team.name})</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded font-medium text-sm hover:opacity-90"
          >
            🚀 Run Assignment Allocator
          </button>
        </form>
      </div>

      <div className="border rounded-xl bg-white dark:bg-neutral-900 dark:border-neutral-800 overflow-hidden">
        <div className="p-4 border-b font-bold text-sm bg-neutral-50 dark:bg-neutral-800/50 dark:border-neutral-800 flex justify-between items-center">
          <span>Active Assignments ({assignments.length})</span>
          <span className="text-xs font-normal text-neutral-500">
            Registered Judges: {judges.length}
          </span>
        </div>
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b dark:border-neutral-800 text-neutral-500 text-xs font-semibold uppercase">
              <th className="p-3">Submission</th>
              <th className="p-3">Assigned Judge</th>
              <th className="p-3">Type</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-neutral-800">
            {assignments.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-neutral-500">
                  No assignments generated yet.
                </td>
              </tr>
            ) : (
              assignments.map((a) => (
                <tr key={a.id}>
                  <td className="p-3 font-medium">{a.submission.title}</td>
                  <td className="p-3 text-xs">{a.judge.email}</td>
                  <td className="p-3">
                    {a.isAnchor ? (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs font-semibold rounded">
                        Anchor Baseline
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 dark:bg-neutral-800 text-xs rounded">
                        Standard
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {a.completedAt ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-semibold rounded">
                        Completed
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-neutral-100 text-neutral-500 dark:bg-neutral-800 text-xs rounded">
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
