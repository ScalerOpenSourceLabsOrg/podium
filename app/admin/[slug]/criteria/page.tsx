import { getCriteriaForEvent, getEventBySlug, getTracksForEvent } from "@/lib/queries/events";
import { createCriterionAction, createTrackAction } from "../actions";

type Params = { params: Promise<{ slug: string }> };

export default async function AdminCriteriaPage({ params }: Params) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) return <main className="p-8">Event not found.</main>;

  const tracks = await getTracksForEvent(event.id);
  const criteria = await getCriteriaForEvent(event.id);

  return (
    <main className="max-w-6xl mx-auto px-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Tracks & Judging Rubric</h1>
        <p className="text-sm text-neutral-500">
          Configure tracks and judging criteria weights for {event.name}.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Tracks Section */}
        <div className="space-y-6">
          <div className="border p-6 rounded-xl bg-white dark:bg-neutral-900 dark:border-neutral-800 space-y-4">
            <h2 className="text-lg font-bold">Add Track</h2>
            <form action={createTrackAction.bind(null, slug)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Track Name *</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. AI / ML"
                  className="w-full px-3 py-2 text-sm border rounded dark:bg-neutral-800 dark:border-neutral-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Description</label>
                <input
                  name="description"
                  type="text"
                  placeholder="Short track description"
                  className="w-full px-3 py-2 text-sm border rounded dark:bg-neutral-800 dark:border-neutral-700"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded font-medium text-sm"
              >
                Create Track
              </button>
            </form>
          </div>

          <div className="border p-6 rounded-xl bg-white dark:bg-neutral-900 dark:border-neutral-800 space-y-3">
            <h3 className="font-bold text-sm uppercase tracking-wider text-neutral-500">
              Existing Tracks ({tracks.length})
            </h3>
            {tracks.length === 0 ? (
              <p className="text-sm text-neutral-500">No tracks created yet.</p>
            ) : (
              <div className="space-y-2">
                {tracks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 border rounded dark:border-neutral-800 flex justify-between items-start"
                  >
                    <div>
                      <div className="font-semibold text-sm">{t.name}</div>
                      {t.description && (
                        <p className="text-xs text-neutral-500">{t.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Criteria Rubric Section */}
        <div className="space-y-6">
          <div className="border p-6 rounded-xl bg-white dark:bg-neutral-900 dark:border-neutral-800 space-y-4">
            <h2 className="text-lg font-bold">Add Rubric Criterion</h2>
            <form action={createCriterionAction.bind(null, slug)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Criterion Name *</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Technical Complexity"
                  className="w-full px-3 py-2 text-sm border rounded dark:bg-neutral-800 dark:border-neutral-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Description</label>
                <input
                  name="description"
                  type="text"
                  placeholder="What judges should evaluate"
                  className="w-full px-3 py-2 text-sm border rounded dark:bg-neutral-800 dark:border-neutral-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Weight</label>
                  <input
                    name="weight"
                    type="number"
                    step="0.5"
                    defaultValue="1"
                    className="w-full px-3 py-2 text-sm border rounded dark:bg-neutral-800 dark:border-neutral-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Max Score</label>
                  <input
                    name="maxScore"
                    type="number"
                    defaultValue="5"
                    className="w-full px-3 py-2 text-sm border rounded dark:bg-neutral-800 dark:border-neutral-700"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded font-medium text-sm"
              >
                Add Criterion
              </button>
            </form>
          </div>

          <div className="border p-6 rounded-xl bg-white dark:bg-neutral-900 dark:border-neutral-800 space-y-3">
            <h3 className="font-bold text-sm uppercase tracking-wider text-neutral-500">
              Judging Rubric ({criteria.length})
            </h3>
            {criteria.length === 0 ? (
              <p className="text-sm text-neutral-500">No criteria defined yet.</p>
            ) : (
              <div className="space-y-2">
                {criteria.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 border rounded dark:border-neutral-800 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-semibold text-sm">{c.name}</div>
                      {c.description && (
                        <p className="text-xs text-neutral-500">{c.description}</p>
                      )}
                    </div>
                    <div className="text-xs font-mono bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                      Weight: {c.weight} | Max: {c.maxScore}
                    </div>
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
