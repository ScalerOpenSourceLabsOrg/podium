import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { getActiveEvent } from "@/lib/queries/events";

export default async function LandingPage() {
  const session = await auth();
  const activeEvent = await getActiveEvent();

  return (
    <div className="min-h-screen bg-[#070709] text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black antialiased">
      <div className="fixed inset-0 bg-[radial-gradient(#1c1d22_1px,transparent_1px)] [bg-size:16px_16px] opacity-40 pointer-events-none" />

      {/* Header Navigation */}
      <header className="relative z-10 border-b border-neutral-800/80 bg-[#070709]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 font-mono">
            <Link href="/" className="font-bold text-sm text-white tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 led-glow-emerald animate-pulse" />
              <span>podium</span>
              <span className="text-neutral-600">//</span>
              <span className="text-xs text-neutral-400 font-normal">engine</span>
            </Link>
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-neutral-800 bg-neutral-900/80 text-emerald-400 font-mono">
              v1.0.4
            </span>
          </div>

          <nav className="flex items-center gap-5 text-xs font-mono">
            {activeEvent && (
              <>
                <Link href={`/e/${activeEvent.slug}`} className="text-neutral-400 hover:text-emerald-400 transition-colors">/event</Link>
                <Link href={`/e/${activeEvent.slug}/gallery`} className="text-neutral-400 hover:text-emerald-400 transition-colors">/gallery</Link>
                <Link href={`/admin/${activeEvent.slug}`} className="text-neutral-400 hover:text-emerald-400 transition-colors">/admin</Link>
              </>
            )}
            {session?.user ? (
              <div className="flex items-center gap-3 border-l border-neutral-800/80 pl-4">
                <span className="text-[11px] text-emerald-400/80 font-mono hidden sm:inline">
                  [{session.user.email}]
                </span>
                <Link
                  href="/admin/new"
                  className="px-3 py-1 rounded bg-emerald-500 text-black hover:bg-emerald-400 font-bold text-xs transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                >
                  + New Event
                </Link>
                <form action={async () => { "use server"; await signOut(); }}>
                  <button type="submit" className="px-3 py-1 rounded border border-neutral-800 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-400 text-xs transition-colors">
                    Sign Out
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="px-3 py-1 rounded bg-emerald-500 text-black hover:bg-emerald-400 font-bold text-xs transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)]"
              >
                [ Sign In ]
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-10 px-6 text-center max-w-4xl mx-auto space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>~/podium $ run hackathons --no-spreadsheets</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
          Open-Source Hackathon Infrastructure.
        </h1>

        <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl mx-auto font-mono leading-relaxed">
          Multi-tenant hackathon engine with z-score judge normalization, real-time deadline enforcement, and stage-by-stage CSV auditability.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3 font-mono text-xs">
          {activeEvent ? (
            <>
              <Link
                href={`/e/${activeEvent.slug}`}
                className="px-5 py-2.5 rounded bg-emerald-500 text-black hover:bg-emerald-400 font-bold shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all transform hover:-translate-y-0.5"
              >
                [ VIEW EVENT: {activeEvent.name.toUpperCase()} ]
              </Link>
              <Link
                href={`/admin/${activeEvent.slug}`}
                className="px-5 py-2.5 rounded border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 font-medium transition-all"
              >
                &lt; ORGANIZER_ADMIN /&gt;
              </Link>
            </>
          ) : session?.user ? (
            <Link
              href="/admin/new"
              className="px-5 py-2.5 rounded bg-emerald-500 text-black hover:bg-emerald-400 font-bold shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all"
            >
              [ + CREATE FIRST EVENT ]
            </Link>
          ) : (
            <Link
              href="/auth/signin"
              className="px-5 py-2.5 rounded bg-emerald-500 text-black hover:bg-emerald-400 font-bold shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all"
            >
              [ SIGN IN TO GET STARTED ]
            </Link>
          )}
        </div>
      </section>

      {/* Active Event Hub */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-2 w-full">
        <div className="border border-neutral-800 bg-[#0d0e12]/90 rounded-xl p-5 space-y-5 cyber-border shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4 font-mono">
            <div>
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span className="text-emerald-400 font-bold">STATUS</span>
                <span>//</span>
                <span>WORKSPACE_STATE</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1 font-sans">
                {activeEvent ? activeEvent.name : "No Event Loaded"}
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5 font-sans">
                {activeEvent ? activeEvent.tagline || "Active hackathon event" : "Database has no published events. Create one to begin."}
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-neutral-800 bg-neutral-950 text-xs text-emerald-400 self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-400 led-glow-emerald" />
              <span>{activeEvent ? `EVENT: ${activeEvent.status}` : "CLEARED"}</span>
            </div>
          </div>

          {activeEvent ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
              <Link
                href={`/dashboard/${activeEvent.slug}/team`}
                className="p-3.5 rounded-lg border border-neutral-800 bg-neutral-950/80 hover:border-emerald-500/50 hover:bg-neutral-900 transition-all group"
              >
                <div className="text-neutral-500 mb-1 text-[10px]">01 // REGISTRANT</div>
                <div className="font-bold text-white group-hover:text-emerald-400 transition-colors font-sans">Team Hub</div>
                <div className="text-[11px] text-neutral-500 mt-0.5 font-sans">Teams & submissions</div>
              </Link>
              <Link
                href={`/dashboard/${activeEvent.slug}/teams`}
                className="p-3.5 rounded-lg border border-neutral-800 bg-neutral-950/80 hover:border-cyan-500/50 hover:bg-neutral-900 transition-all group"
              >
                <div className="text-neutral-500 mb-1 text-[10px]">02 // DISCOVERY</div>
                <div className="font-bold text-white group-hover:text-cyan-400 transition-colors font-sans">Open Teams</div>
                <div className="text-[11px] text-neutral-500 mt-0.5 font-sans">Filtered team browser</div>
              </Link>
              <Link
                href={`/judge/${activeEvent.slug}`}
                className="p-3.5 rounded-lg border border-neutral-800 bg-neutral-950/80 hover:border-amber-500/50 hover:bg-neutral-900 transition-all group"
              >
                <div className="text-neutral-500 mb-1 text-[10px]">03 // EVALUATION</div>
                <div className="font-bold text-white group-hover:text-amber-400 transition-colors font-sans">Judge Station</div>
                <div className="text-[11px] text-neutral-500 mt-0.5 font-sans">Queue & rubric scoring</div>
              </Link>
              <Link
                href={`/admin/${activeEvent.slug}/results`}
                className="p-3.5 rounded-lg border border-neutral-800 bg-neutral-950/80 hover:border-pink-500/50 hover:bg-neutral-900 transition-all group"
              >
                <div className="text-neutral-500 mb-1 text-[10px]">04 // RESULTS</div>
                <div className="font-bold text-white group-hover:text-pink-400 transition-colors font-sans">Leaderboard</div>
                <div className="text-[11px] text-neutral-500 mt-0.5 font-sans">Z-score normalization</div>
              </Link>
            </div>
          ) : (
            <div className="p-6 text-center text-xs font-mono text-neutral-400 space-y-3 border border-dashed border-neutral-800 rounded-lg">
              <p>[ SYS_EMPTY ] Database contains 0 published events.</p>
              <Link
                href={session?.user ? "/admin/new" : "/auth/signin"}
                className="inline-block px-4 py-2 bg-emerald-500 text-black font-bold text-xs rounded hover:bg-emerald-400 transition-all"
              >
                {session?.user ? "+ CREATE EVENT NOW" : "[ SIGN IN TO CREATE EVENT ]"}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-800/80 bg-[#050507] py-6 text-center text-xs text-neutral-600 font-mono">
        <p>podium-engine // open source hackathon platform</p>
      </footer>
    </div>
  );
}
