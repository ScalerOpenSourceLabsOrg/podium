import Link from "next/link";
import { requireOrganizer } from "@/lib/auth";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireOrganizer(slug);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <header className="border-b bg-white dark:bg-neutral-900 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href={`/admin/${slug}`} className="font-bold text-lg">
              Podium Organizer
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium">
              <Link href={`/admin/${slug}`} className="hover:text-blue-600">
                Overview
              </Link>
              <Link href={`/admin/${slug}/criteria`} className="hover:text-blue-600">
                Tracks & Criteria
              </Link>
              <Link href={`/admin/${slug}/check-in`} className="hover:text-blue-600">
                Check-in
              </Link>
              <Link href={`/admin/${slug}/submissions`} className="hover:text-blue-600">
                Moderation
              </Link>
              <Link href={`/admin/${slug}/assignments`} className="hover:text-blue-600">
                Assignments
              </Link>
              <Link href={`/admin/${slug}/results`} className="hover:text-blue-600">
                Results & Awards
              </Link>
            </nav>
          </div>
          <Link
            href={`/e/${slug}`}
            className="text-xs px-3 py-1.5 border rounded-md dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Public Event Page &rarr;
          </Link>
        </div>
      </header>
      <div className="py-6">{children}</div>
    </div>
  );
}
