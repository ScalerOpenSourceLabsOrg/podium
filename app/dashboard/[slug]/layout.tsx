import Link from "next/link";
import { requireUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireUser();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <header className="border-b bg-white dark:bg-neutral-900 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href={`/dashboard/${slug}/team`} className="font-bold text-lg text-purple-600 dark:text-purple-400">
              Participant Hub
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium">
              <Link href={`/dashboard/${slug}/team`} className="hover:text-purple-600">
                My Team
              </Link>
              <Link href={`/dashboard/${slug}/teams`} className="hover:text-purple-600">
                Browse Open Teams
              </Link>
              <Link href={`/dashboard/${slug}/submission`} className="hover:text-purple-600">
                Project Submission
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
