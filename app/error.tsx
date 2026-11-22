"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected errors securely without leaking sensitive information
    console.error("[Podium Runtime Error]:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#070709] text-neutral-100 flex flex-col justify-center items-center p-6 font-sans antialiased">
      <div className="fixed inset-0 bg-[radial-gradient(#1c1d22_1px,transparent_1px)] [bg-size:16px_16px] opacity-40 pointer-events-none" />

      <main className="relative z-10 w-full max-w-lg border border-red-500/30 bg-[#0d0e12]/95 rounded-2xl p-8 space-y-6 text-center shadow-[0_0_40px_rgba(239,68,68,0.15)] backdrop-blur-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          <span>500 // UNHANDLED_EXCEPTION</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Something Went Wrong</h1>
          <p className="text-xs text-neutral-400 leading-relaxed font-mono">
            An unexpected error occurred while processing this request. Our state boundary intercepted the fault to protect data integrity.
          </p>
        </div>

        {error.digest && (
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-[11px] font-mono text-neutral-500 text-left">
            <span>ERROR_DIGEST: {error.digest}</span>
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row gap-3 font-mono text-xs">
          <button
            onClick={() => reset()}
            className="flex-1 py-2.5 px-4 rounded-lg bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.25)]"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="flex-1 py-2.5 px-4 rounded-lg border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 transition-colors flex items-center justify-center"
          >
            &larr; Return Home
          </Link>
        </div>
      </main>
    </div>
  );
}
