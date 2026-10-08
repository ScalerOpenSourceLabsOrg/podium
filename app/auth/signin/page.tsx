"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function CustomSignInPage() {
  const [role, setRole] = useState<"ORGANIZER" | "PARTICIPANT" | "JUDGE">("PARTICIPANT");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDevSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await signIn("dev", {
        email,
        name: name || undefined,
        role,
        callbackUrl: role === "ORGANIZER" ? "/admin/new" : "/",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (quickEmail: string, quickName: string, quickRole: "ORGANIZER" | "PARTICIPANT" | "JUDGE") => {
    setLoading(true);
    try {
      await signIn("dev", {
        email: quickEmail,
        name: quickName,
        role: quickRole,
        callbackUrl: quickRole === "ORGANIZER" ? "/admin/new" : "/",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] text-neutral-100 flex flex-col justify-center items-center p-6 selection:bg-emerald-500 selection:text-black font-sans antialiased">
      {/* Background Cyber Grid Pattern */}
      <div className="fixed inset-0 bg-[radial-gradient(#1c1d22_1px,transparent_1px)] [bg-size:16px_16px] opacity-40 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6 font-mono">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white tracking-tight">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 led-glow-emerald animate-pulse" />
            <span className="font-bold text-base">podium</span>
            <span className="text-neutral-600">//</span>
            <span className="text-xs text-neutral-400">auth-gate</span>
          </Link>
          <h1 className="text-xl font-bold text-white pt-2 font-sans tracking-tight">AUTHENTICATION GATEWAY</h1>
          <p className="text-xs text-neutral-400 font-sans">
            Select target workspace role and initialize session.
          </p>
        </div>

        {/* Main Sign-In Card */}
        <div className="border border-neutral-800 bg-[#0d0e12]/90 rounded-xl p-6 space-y-5 cyber-border shadow-2xl backdrop-blur-md">
          {/* Role Selector */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-neutral-400">
              <span>SELECT TARGET ROLE</span>
              <span className="text-emerald-400">● {role} MODE</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-black rounded-lg border border-neutral-800 text-xs">
              <button
                type="button"
                onClick={() => setRole("PARTICIPANT")}
                className={`py-1.5 font-bold rounded transition-all ${
                  role === "PARTICIPANT"
                    ? "bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Participant
              </button>
              <button
                type="button"
                onClick={() => setRole("ORGANIZER")}
                className={`py-1.5 font-bold rounded transition-all ${
                  role === "ORGANIZER"
                    ? "bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Organizer
              </button>
              <button
                type="button"
                onClick={() => setRole("JUDGE")}
                className={`py-1.5 font-bold rounded transition-all ${
                  role === "JUDGE"
                    ? "bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Judge
              </button>
            </div>
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleDevSignIn} className="space-y-4 font-sans">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-3.5 py-2.5 bg-black border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                Full Name (Optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivers"
                className="w-full px-3.5 py-2.5 bg-black border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-500 text-black font-mono font-bold text-xs rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:bg-emerald-400 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? "INITIALIZING SESSION..." : `[ CONTINUE AS ${role} ]`}
            </button>
          </form>

          {/* Quick Demo Login Chips */}
          <div className="pt-3 border-t border-neutral-800 space-y-2">
            <div className="text-[10px] text-neutral-500 text-center uppercase tracking-wider">
              QUICK TEST CREDENTIALS
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("organizer@podium.test", "Ada Organizer", "ORGANIZER")}
                className="p-2 bg-black border border-neutral-800 hover:border-emerald-500/50 rounded-lg text-left transition-colors"
              >
                <div className="font-bold text-[10px] text-purple-400">ORGANIZER</div>
                <div className="text-[10px] text-neutral-400 truncate">ada@org</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("participant1@podium.test", "Sam Participant", "PARTICIPANT")}
                className="p-2 bg-black border border-neutral-800 hover:border-emerald-500/50 rounded-lg text-left transition-colors"
              >
                <div className="font-bold text-[10px] text-blue-400">PARTICIPANT</div>
                <div className="text-[10px] text-neutral-400 truncate">sam@dev</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("judge1@podium.test", "Dr. Vance", "JUDGE")}
                className="p-2 bg-black border border-neutral-800 hover:border-emerald-500/50 rounded-lg text-left transition-colors"
              >
                <div className="font-bold text-[10px] text-amber-400">JUDGE</div>
                <div className="text-[10px] text-neutral-400 truncate">vance@judge</div>
              </button>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link href="/" className="text-xs text-neutral-500 hover:text-emerald-400 transition-colors">
            &lt; return_to_home /&gt;
          </Link>
        </div>
      </div>
    </div>
  );
}
