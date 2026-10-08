import Link from "next/link";
import { getEventBySlug, getTracksForEvent } from "@/lib/queries/events";
import { getGallerySubmissions } from "@/lib/queries/submissions";
import { EmptyState } from "@/components/shared/EmptyState";

type Params = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ trackId?: string; search?: string; sortBy?: "newest" | "oldest" | "title" }>;
};

export default async function PublicGalleryPage({ params, searchParams }: Params) {
  const { slug } = await params;
  const { trackId, search, sortBy } = await searchParams;
  const event = await getEventBySlug(slug);

  if (!event) return <main className="p-8">Event not found.</main>;

  if (!event.galleryPublic) {
    return (
      <main className="max-w-4xl mx-auto p-12 text-center space-y-4">
        <EmptyState
          icon="🔒"
          title="Gallery Private"
          description="The public gallery has not been published by the organizers yet."
        />
        <Link href={`/e/${slug}`} className="text-sm font-medium text-blue-600 hover:underline">
          &larr; Back to Event Page
        </Link>
      </main>
    );
  }

  const submissions = await getGallerySubmissions(slug, { trackId, search, sortBy });
  const tracks = await getTracksForEvent(event.id);

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <header className="border-b bg-white dark:bg-neutral-900 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <Link href={`/e/${slug}`} className="text-xs text-neutral-500 hover:underline">
              &larr; {event.name}
            </Link>
            <h1 className="text-2xl font-bold">Project Gallery</h1>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <form method="GET" className="flex flex-wrap items-center gap-4 bg-white dark:bg-neutral-900 p-4 rounded-xl border dark:border-neutral-800">
          <input
            name="search"
            type="text"
            defaultValue={search || ""}
            placeholder="Search projects by title, tagline..."
            className="flex-1 min-w-[200px] px-3 py-2 text-sm border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
          />

          <select
            name="trackId"
            defaultValue={trackId || ""}
            className="px-3 py-2 text-sm border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
          >
            <option value="">All Tracks</option>
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <select
            name="sortBy"
            defaultValue={sortBy || "newest"}
            className="px-3 py-2 text-sm border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
          >
            <option value="newest">Sort by Newest</option>
            <option value="oldest">Sort by Oldest</option>
            <option value="title">Sort by Title</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-md text-sm font-medium"
          >
            Apply Filters
          </button>
        </form>

        {submissions.length === 0 ? (
          <EmptyState
            title="No gallery submissions found"
            description="Try changing your search terms or filters."
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="border rounded-xl p-6 bg-white dark:bg-neutral-900 dark:border-neutral-800 flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg">{sub.title}</h3>
                    {sub.track && (
                      <span className="text-xs px-2.5 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded font-medium">
                        {sub.track.name}
                      </span>
                    )}
                  </div>
                  {sub.tagline && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                      {sub.tagline}
                    </p>
                  )}
                  <div className="text-xs text-neutral-500">
                    By <span className="font-medium">{sub.team.name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t dark:border-neutral-800 text-xs font-mono">
                  {sub.repoUrl && (
                    <a
                      href={sub.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      🔗 Code Repo
                    </a>
                  )}
                  {sub.demoUrl && (
                    <a
                      href={sub.demoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      🚀 Live Demo
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
