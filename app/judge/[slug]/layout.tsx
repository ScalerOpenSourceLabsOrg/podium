import Link from "next/link";
import { requireJudge } from "@/lib/auth";

export default async function JudgeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireJudge(slug);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href={`/judge/${slug}`} className="font-bold text-lg text-amber-400 flex items-center gap-2">
              <span>⚖️</span>
              <span>Podium Judge</span>
            </Link>
          </div>
          <Link
            href={`/e/${slug}`}
            className="text-xs px-3 py-1.5 border border-neutral-700 rounded-md hover:bg-neutral-800 transition-colors"
          >
            Public Event Page &rarr;
          </Link>
        </div>
      </header>
      <div className="py-6">{children}</div>
    </div>
  );
}
