"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { customLoginAction, signOutAction } from "./actions";

type Role = "ORGANIZER" | "JUDGE" | "REGISTRANT";

type SignInFormProps = {
  activeEventSlug?: string;
  currentUser?: { name?: string | null; email?: string | null } | null;
  initialRole?: Role;
  callbackUrl?: string;
};

export function SignInForm({
  activeEventSlug,
  currentUser,
  initialRole,
  callbackUrl,
}: SignInFormProps) {
  const [isPending, startTransition] = useTransition();
  const [role, setRole] = useState<Role>(initialRole || "ORGANIZER");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getDestination = () => {
    if (callbackUrl) return callbackUrl;
    if (role === "ORGANIZER") {
      return activeEventSlug ? `/admin/${activeEventSlug}` : "/admin/new";
    }
    if (role === "JUDGE") {
      return activeEventSlug ? `/judge/${activeEventSlug}` : "/";
    }
    return activeEventSlug ? `/dashboard/${activeEventSlug}/team` : "/";
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage("Please enter an email address.");
      return;
    }
    setErrorMessage(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await customLoginAction(formData);
      } catch (err: any) {
        if (err?.message && !err.message.includes("NEXT_REDIRECT")) {
          setErrorMessage(err.message || "Sign in failed. Please try again.");
        }
      }
    });
  };

  const getRoleTheme = () => {
    if (role === "ORGANIZER") return { color: "purple", label: "Organizer", border: "border-purple-500/30", btn: "bg-purple-600 hover:bg-purple-500 shadow-purple-600/30" };
    if (role === "JUDGE") return { color: "amber", label: "Judge", border: "border-amber-500/30", btn: "bg-amber-600 hover:bg-amber-500 shadow-amber-600/30" };
    return { color: "cyan", label: "Registrant", border: "border-cyan-500/30", btn: "bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/30" };
  };

  const theme = getRoleTheme();

  return (
    <div className="space-y-6">
      {currentUser?.email && (
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/80 text-xs font-mono space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase">Currently Signed In</span>
              <span className="text-emerald-400 font-bold">{currentUser.email}</span>
            </div>
            <form action={async () => { await signOutAction(); }}>
              <button
                type="submit"
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded text-neutral-300 text-xs transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
          {initialRole && (
            <p className="text-[11px] text-amber-400/90 border-t border-neutral-800 pt-2 font-sans">
              ⚠️ An {initialRole} account is required to access this resource. Switch accounts below if needed.
            </p>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl border border-red-500/40 bg-red-950/60 text-xs text-red-300 font-mono">
          [ERROR]: {errorMessage}
        </div>
      )}

      <div className="border border-neutral-800 bg-[#0d0e12]/95 rounded-2xl p-6 space-y-5 shadow-2xl backdrop-blur-md">
        <div className="space-y-1.5">
          <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400">
            Account Role
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-black rounded-xl border border-neutral-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => { setRole("ORGANIZER"); setErrorMessage(null); }}
              className={`py-2 font-bold rounded-lg transition-all ${
                role === "ORGANIZER" ? "bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]" : "text-neutral-400 hover:text-white"
              }`}
            >
              👑 Organizer
            </button>
            <button
              type="button"
              onClick={() => { setRole("JUDGE"); setErrorMessage(null); }}
              className={`py-2 font-bold rounded-lg transition-all ${
                role === "JUDGE" ? "bg-amber-600 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)]" : "text-neutral-400 hover:text-white"
              }`}
            >
              ⚖️ Judge
            </button>
            <button
              type="button"
              onClick={() => { setRole("REGISTRANT"); setErrorMessage(null); }}
              className={`py-2 font-bold rounded-lg transition-all ${
                role === "REGISTRANT" ? "bg-cyan-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]" : "text-neutral-400 hover:text-white"
              }`}
            >
              💻 Registrant
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="role" value={role} />
          <input type="hidden" name="redirectTo" value={getDestination()} />

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
              Email Address *
            </label>
            <input
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                role === "ORGANIZER"
                  ? "organizer@podium.test"
                  : role === "JUDGE"
                  ? "judge1@podium.test"
                  : "registrant1@podium.test"
              }
              className="w-full px-3.5 py-2.5 bg-black border border-neutral-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
              Display Name (Optional)
            </label>
            <input
              name="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              className="w-full px-3.5 py-2.5 bg-black border border-neutral-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="text-[11px] font-mono text-neutral-500 flex items-center justify-between">
            <span>Destination:</span>
            <span className="text-emerald-400 truncate max-w-[240px]">{getDestination()}</span>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className={`w-full py-3 text-white font-mono font-bold text-xs rounded-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50 shadow-lg ${theme.btn}`}
          >
            {isPending ? "AUTHENTICATING..." : `[ SIGN IN AS ${role} → ]`}
          </button>
        </form>
      </div>

      <div className="text-center font-mono">
        <Link href="/" className="text-xs text-neutral-500 hover:text-emerald-400 transition-colors">
          &lt; return_to_home /&gt;
        </Link>
      </div>
    </div>
  );
}
