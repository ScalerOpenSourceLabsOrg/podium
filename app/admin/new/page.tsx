import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { NewEventForm } from "./NewEventForm";

export default async function NewEventPage() {
  await requireUser("/admin/new");

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

        <NewEventForm />
      </div>
    </main>
  );
}
