import Link from "next/link";
import { getEventBySlug } from "@/lib/queries/events";
import { getAwardsForEvent } from "@/lib/queries/results";
import { EmptyState } from "@/components/shared/EmptyState";

type Params = { params: Promise<{ slug: string }> };

export default async function PublicWinnersPage({ params }: Params) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) return <main className="p-8">Event not found.</main>;

  if (!event.winnersPublic) {
    return (
      <main className="max-w-4xl mx-auto p-12 text-center space-y-4">
        <EmptyState
          icon="🏆"
          title="Winners Not Published"
          description="The event results have not been announced yet. Stay tuned!"
        />
        <Link href={`/e/${slug}`} className="text-sm font-medium text-blue-600 hover:underline">
          &larr; Back to Event Page
        </Link>
      </main>
    );
  }

  const awards = await getAwardsForEvent(event.id);

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <header className="border-b bg-white dark:bg-neutral-900 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <Link href={`/e/${slug}`} className="text-xs text-neutral-500 hover:underline">
              &larr; {event.name}
            </Link>
            <h1 className="text-2xl font-bold">Award Winners</h1>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold">🎉 Congratulations to the Winners!</h2>
          <p className="text-neutral-500">Official results for {event.name}</p>
        </div>

        {awards.length === 0 ? (
          <EmptyState
            title="No awards listed"
            description="Award announcements will appear here soon."
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {awards.map((award) => (
              <div
                key={award.id}
                className="border rounded-2xl p-6 bg-white dark:bg-neutral-900 dark:border-neutral-800 space-y-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🏆</span>
                  <div>
                    <h3 className="font-extrabold text-xl">{award.name}</h3>
                    {award.track && (
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {award.track.name} Track
                      </span>
                    )}
                  </div>
                </div>

                {award.submission ? (
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl space-y-2 border dark:border-neutral-800">
                    <div className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                      {award.submission.title}
                    </div>
                    {award.submission.tagline && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        {award.submission.tagline}
                      </p>
                    )}
                    <div className="text-xs text-neutral-500">
                      Team: <span className="font-medium text-neutral-700 dark:text-neutral-300">{award.submission.team.name}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400 italic">Winner pending announcement</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
