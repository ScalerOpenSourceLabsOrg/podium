import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createEventAction } from "./actions";

export default async function NewEventPage() {
  await requireUser();

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-xl border border-neutral-800 bg-neutral-900/90 rounded-2xl p-8 space-y-6 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Create New Event</h1>
            <p className="text-xs text-neutral-400 mt-1">
              Set up a new hackathon event as an organizer.
            </p>
          </div>
          <Link
            href="/"
            className="text-xs text-neutral-400 hover:text-white transition-colors"
          >
            &larr; Back to Home
          </Link>
        </div>

        <form action={createEventAction} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Event Name *
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="e.g. Buildathon 2026"
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              URL Slug *
            </label>
            <input
              name="slug"
              type="text"
              required
              placeholder="e.g. buildathon-26"
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-purple-500"
            />
            <p className="text-[11px] text-neutral-500 mt-1">
              Lowercase letters, numbers and hyphens only (e.g. /e/buildathon-26)
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Tagline
            </label>
            <input
              name="tagline"
              type="text"
              placeholder="e.g. 48 hours to ship your dream project"
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Max Team Size
            </label>
            <input
              name="maxTeamSize"
              type="number"
              min="1"
              max="20"
              defaultValue="4"
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Rules & Guidelines (Markdown)
            </label>
            <textarea
              name="rulesMd"
              rows={4}
              placeholder="Build something new. Original code only."
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-600/25 transition-all transform hover:-translate-y-0.5"
          >
            🚀 Launch Event Workspace
          </button>
        </form>
      </div>
    </main>
  );
}
