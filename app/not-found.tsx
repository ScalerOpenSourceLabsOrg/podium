import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#070709] text-neutral-100 flex flex-col justify-center items-center p-6 font-sans antialiased">
      <div className="fixed inset-0 bg-[radial-gradient(#1c1d22_1px,transparent_1px)] [bg-size:16px_16px] opacity-40 pointer-events-none" />

      <main className="relative z-10 w-full max-w-md border border-neutral-800 bg-[#0d0e12]/95 rounded-2xl p-8 space-y-6 text-center shadow-2xl backdrop-blur-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-neutral-700 bg-neutral-900 text-neutral-400 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>404 // RESOURCE_NOT_FOUND</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black text-white tracking-tight">Page Not Found</h1>
          <p className="text-xs text-neutral-400 leading-relaxed font-mono">
            The event slug or page you requested could not be located or may have been archived.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-block w-full py-2.5 px-4 rounded-lg bg-emerald-500 text-black font-bold text-xs font-mono hover:bg-emerald-400 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            [ &larr; Return to Podium Home ]
          </Link>
        </div>
      </main>
    </div>
  );
}
