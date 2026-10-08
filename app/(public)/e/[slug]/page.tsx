import Link from "next/link";
import { getEventWithDetails } from "@/lib/queries/events";
import { auth } from "@/lib/auth";

type Params = { params: Promise<{ slug: string }> };

export default async function PublicEventPage({ params }: Params) {
  const { slug } = await params;
  const event = await getEventWithDetails(slug);
  const session = await auth();

  if (!event) {
    return <main className="max-w-xl mx-auto p-12 text-center">Event not found.</main>;
  }

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <header className="border-b bg-white dark:bg-neutral-900 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href={`/e/${slug}`} className="font-extrabold text-xl tracking-tight">
            {event.name}
          </Link>
          <div className="flex items-center gap-4 text-sm font-medium">
            {event.galleryPublic && (
              <Link href={`/e/${slug}/gallery`} className="hover:text-blue-600">
                Gallery
              </Link>
            )}
            {event.winnersPublic && (
              <Link href={`/e/${slug}/winners`} className="hover:text-blue-600">
                Winners
              </Link>
            )}
            {session?.user ? (
              <Link
                href={`/dashboard/${slug}/team`}
                className="px-4 py-2 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-md text-sm font-semibold"
              >
                Go to Dashboard &rarr;
              </Link>
            ) : (
              <Link
                href="/api/auth/signin"
                className="px-4 py-2 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-md text-sm font-semibold"
              >
                Sign In to Participate
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        <div className="space-y-4 text-center sm:text-left">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{event.name}</h1>
          {event.tagline && (
            <p className="text-xl text-neutral-600 dark:text-neutral-400">{event.tagline}</p>
          )}
          <div className="flex flex-wrap gap-4 pt-4 justify-center sm:justify-start">
            <Link
              href={`/dashboard/${slug}/team`}
              className="px-6 py-3 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-lg text-base font-bold shadow hover:opacity-90 transition-opacity"
            >
              Register & Manage Team
            </Link>
          </div>
        </div>

        {event.tracks.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Event Tracks</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {event.tracks.map((t) => (
                <div
                  key={t.id}
                  className="p-5 border rounded-xl bg-white dark:bg-neutral-900 dark:border-neutral-800 space-y-2"
                >
                  <h3 className="font-bold text-lg">{t.name}</h3>
                  {t.description && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">{t.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {event.rulesMd && (
          <div className="space-y-4 border-t pt-8 dark:border-neutral-800">
            <h2 className="text-2xl font-bold">Rules & Guidelines</h2>
            <div className="prose dark:prose-invert max-w-none text-neutral-700 dark:text-neutral-300 font-mono text-sm whitespace-pre-line bg-white dark:bg-neutral-900 p-6 rounded-xl border dark:border-neutral-800">
              {event.rulesMd}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
