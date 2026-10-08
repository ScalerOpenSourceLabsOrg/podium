import { getEventBySlug } from "@/lib/queries/events";
import { getModerationSubmissions } from "@/lib/queries/submissions";
import { CsvExportButton } from "@/components/shared/CsvExportButton";
import { updateModerationAction } from "../actions";

type Params = { params: Promise<{ slug: string }> };

export default async function AdminSubmissionsPage({ params }: Params) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) return <main className="p-8">Event not found.</main>;

  const submissions = await getModerationSubmissions(event.id);

  return (
    <main className="max-w-6xl mx-auto px-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold">Submission Moderation Queue</h1>
          <p className="text-sm text-neutral-500">
            Set visibility and judgeability for submitted projects.
          </p>
        </div>
        <CsvExportButton slug={slug} type="submissions" label="Export Submissions CSV" />
      </div>

      <div className="space-y-4">
        {submissions.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 border rounded-xl bg-white dark:bg-neutral-900 dark:border-neutral-800">
            No submissions in queue.
          </div>
        ) : (
          submissions.map((sub) => (
            <div
              key={sub.id}
              className="p-6 border rounded-xl bg-white dark:bg-neutral-900 dark:border-neutral-800 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 dark:border-neutral-800">
                <div>
                  <h3 className="text-lg font-bold">{sub.title}</h3>
                  <p className="text-sm text-neutral-500">
                    Team: {sub.team.name} | Track: {sub.track?.name || "General"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 font-mono rounded bg-neutral-100 dark:bg-neutral-800">
                    Visibility: {sub.visibility}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-1 font-mono rounded ${
                      sub.judgeable
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                    }`}
                  >
                    {sub.judgeable ? "Judgeable" : "Not Judgeable"}
                  </span>
                </div>
              </div>

              <div className="text-sm text-neutral-700 dark:text-neutral-300">
                {sub.descriptionMd}
              </div>

              <div className="flex flex-wrap gap-4 text-xs font-mono">
                {sub.repoUrl && (
                  <a
                    href={sub.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    🔗 Repo URL
                  </a>
                )}
                {sub.demoUrl && (
                  <a
                    href={sub.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    🚀 Demo URL
                  </a>
                )}
              </div>

              <form
                action={updateModerationAction.bind(null, slug)}
                className="pt-3 border-t dark:border-neutral-800 flex flex-wrap items-center gap-4 bg-neutral-50 dark:bg-neutral-950 p-4 rounded-lg"
              >
                <input type="hidden" name="submissionId" value={sub.id} />

                <div>
                  <label className="block text-xs font-medium mb-1">Gallery Visibility</label>
                  <select
                    name="visibility"
                    defaultValue={sub.visibility}
                    className="px-3 py-1.5 text-xs border rounded dark:bg-neutral-900 dark:border-neutral-700"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="GALLERY">GALLERY (Public)</option>
                    <option value="HIDDEN">HIDDEN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Judgeable</label>
                  <select
                    name="judgeable"
                    defaultValue={sub.judgeable ? "true" : "false"}
                    className="px-3 py-1.5 text-xs border rounded dark:bg-neutral-900 dark:border-neutral-700"
                  >
                    <option value="true">YES (Include in Judging)</option>
                    <option value="false">NO (Exclude from Judging)</option>
                  </select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium mb-1">Organizer Notes</label>
                  <input
                    type="text"
                    name="organizerNotes"
                    defaultValue={sub.organizerNotes || ""}
                    placeholder="Internal organizer notes..."
                    className="w-full px-3 py-1.5 text-xs border rounded dark:bg-neutral-900 dark:border-neutral-700"
                  />
                </div>

                <div className="flex items-end pt-5">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-medium rounded hover:opacity-90"
                  >
                    Update Moderation
                  </button>
                </div>
              </form>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
