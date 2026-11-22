"use client";

import { useState, useTransition } from "react";
import { addEventRoleAction } from "./actions";

export function AddUserModal({ slug }: { slug: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState<"ORGANIZER" | "JUDGE">("JUDGE");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email address is required.");
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.append("slug", slug);
    formData.append("email", email);
    formData.append("role", role);
    if (name.trim()) formData.append("name", name);

    startTransition(async () => {
      try {
        await addEventRoleAction(formData);
        setEmail("");
        setName("");
        setIsOpen(false);
      } catch (err: any) {
        setError(err.message || "Failed to add user.");
      }
    });
  };

  return (
    <>
      <button
        onClick={() => { setIsOpen(true); setError(null); }}
        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold font-mono transition-all shadow-[0_0_12px_rgba(168,85,247,0.3)]"
      >
        + Add Organizer / Judge
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0d0e12] border border-neutral-800 rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h2 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <span>⚡</span> Add Event Member
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-500 hover:text-white text-xs font-mono"
              >
                [Esc / Close]
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-lg font-mono">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
                  Target Role *
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-black rounded-lg border border-neutral-800 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setRole("ORGANIZER")}
                    className={`py-2 rounded font-bold transition-all ${
                      role === "ORGANIZER"
                        ? "bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    👑 Organizer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("JUDGE")}
                    className={`py-2 rounded font-bold transition-all ${
                      role === "JUDGE"
                        ? "bg-amber-600 text-white shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    ⚖️ Judge
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@podium.test"
                  className="w-full px-3 py-2 bg-black border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
                  Display Name (Optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-3 py-2 bg-black border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-2 pt-2 font-mono">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs text-neutral-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold"
                >
                  {isPending ? "Adding..." : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
