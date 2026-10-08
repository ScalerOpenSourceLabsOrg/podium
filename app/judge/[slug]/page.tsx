import { requireJudge } from "@/lib/auth";
import { getEventBySlug } from "@/lib/queries/events";
import { getAssignmentsForJudge } from "@/lib/queries/judging";
import { EmptyState } from "@/components/shared/EmptyState";
import { saveScoreAction } from "./actions";

type Params = { params: Promise<{ slug: string }> };

export default async function JudgeQueuePage({ params }: Params) {
  const { slug } = await params;
  const judge = await requireJudge(slug);
  const event = await getEventBySlug(slug);

  if (!event) return <main className="p-8">Event not found.</main>;

  const assignments = await getAssignmentsForJudge(slug, judge.id);

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Judge Dashboard</h1>
        <p className="text-sm text-neutral-500">
          Assigned submissions for {event.name}
        </p>
      </div>

      {assignments.length === 0 ? (
        <EmptyState
          icon="⚖️"
          title="No assignments in your queue"
          description="Assignments have not been generated yet or you have no submissions assigned."
        />
      ) : (
        <div className="space-y-8">
          {assignments.map((assignment) => {
            const sub = assignment.submission;
            const criteria = assignment.event.criteria;
            const scoreMap = new Map(
              assignment.scores.map((s) => [s.criterionId, s]),
            );

            return (
              <div
                key={assignment.id}
                className="border rounded-xl p-6 bg-white dark:bg-neutral-950 dark:border-neutral-800 space-y-6 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4 dark:border-neutral-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold">{sub.title}</h2>
                      {assignment.isAnchor && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs font-semibold rounded">
                          Anchor Project
                        </span>
                      )}
                      {assignment.completedAt && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-semibold rounded">
                          ✓ Scored
                        </span>
                      )}
                    </div>
                    {sub.tagline && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
                        {sub.tagline}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-neutral-500 font-mono">
                    Team: {sub.team.name}
                  </div>
                </div>

                {sub.descriptionMd && (
                  <div className="text-sm bg-neutral-50 dark:bg-neutral-900 p-3 rounded text-neutral-700 dark:text-neutral-300">
                    {sub.descriptionMd}
                  </div>
                )}

                <div className="flex flex-wrap gap-4 text-xs font-mono">
                  {sub.repoUrl && (
                    <a
                      href={sub.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      🔗 Repo
                    </a>
                  )}
                  {sub.demoUrl && (
                    <a
                      href={sub.demoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      🚀 Demo
                    </a>
                  )}
                  {sub.videoUrl && (
                    <a
                      href={sub.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      🎥 Video
                    </a>
                  )}
                </div>

                <div className="space-y-4 pt-2">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-neutral-500">
                    Rubric Scoring
                  </h3>
                  {criteria.map((crit) => {
                    const existing = scoreMap.get(crit.id);

                    return (
                      <form
                        key={crit.id}
                        action={saveScoreAction.bind(null, slug)}
                        className="p-4 border rounded-lg dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 space-y-3"
                      >
                        <input type="hidden" name="assignmentId" value={assignment.id} />
                        <input type="hidden" name="criterionId" value={crit.id} />

                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold text-sm">
                              {crit.name}{" "}
                              <span className="text-xs font-normal text-neutral-500">
                                (Weight: {crit.weight}, Max: {crit.maxScore})
                              </span>
                            </div>
                            {crit.description && (
                              <p className="text-xs text-neutral-500">
                                {crit.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              name="value"
                              min="0"
                              max={crit.maxScore}
                              step="0.5"
                              required
                              defaultValue={existing?.value ?? 0}
                              className="w-16 px-2 py-1 text-right font-mono border rounded dark:bg-neutral-900 dark:border-neutral-700 text-sm font-bold"
                            />
                            <span className="text-xs text-neutral-500">
                              / {crit.maxScore}
                            </span>
                          </div>
                        </div>

                        <div>
                          <input
                            type="text"
                            name="comment"
                            defaultValue={existing?.comment ?? ""}
                            placeholder="Required feedback comment for participant..."
                            className="w-full px-3 py-1.5 text-xs border rounded dark:bg-neutral-900 dark:border-neutral-800"
                          />
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            className="px-3 py-1 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-medium rounded hover:opacity-90"
                          >
                            Save Score
                          </button>
                        </div>
                      </form>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
