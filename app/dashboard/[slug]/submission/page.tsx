import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getEventBySlug, getTracksForEvent } from "@/lib/queries/events";
import { getTeamForUser } from "@/lib/queries/teams";
import { getSubmissionForTeam } from "@/lib/queries/submissions";
import { Countdown } from "@/components/shared/Countdown";
import { saveDraftAction, submitAction } from "./actions";

type Params = { params: Promise<{ slug: string }> };

export default async function SubmissionPage({ params }: Params) {
  const { slug } = await params;
  const user = await requireUser();
  const event = await getEventBySlug(slug);

  if (!event) return <main className="p-8">Event not found.</main>;

  const team = await getTeamForUser(event.id, user.id);
  if (!team) {
    return (
      <main className="max-w-xl mx-auto p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold">Team Required</h1>
        <p className="text-neutral-500">
          You must create or join a team before submitting a project.
        </p>
        <Link
          href={`/dashboard/${slug}/team`}
          className="inline-block px-4 py-2 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-md font-medium text-sm"
        >
          Go to Team Setup
        </Link>
      </main>
    );
  }

  const submission = await getSubmissionForTeam(event.id, team.id);
  const tracks = await getTracksForEvent(event.id);

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold">Project Submission</h1>
          <p className="text-sm text-neutral-500">
            Team: <span className="font-semibold">{team.name}</span>
          </p>
        </div>
        <Countdown targetDate={event.submissionClosesAt} timezone={event.timezone} />
      </div>

      {submission?.status === "SUBMITTED" && (
        <div className="p-4 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 rounded-lg text-sm font-medium">
          ✓ Submitted on {new Date(submission.submittedAt!).toLocaleString()}. You can update your submission until the deadline.
        </div>
      )}

      <form className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Project Title *</label>
          <input
            name="title"
            type="text"
            required
            defaultValue={submission?.title || ""}
            className="w-full px-3 py-2 border rounded-md dark:bg-neutral-900 dark:border-neutral-800"
            placeholder="e.g. Podium"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tagline</label>
          <input
            name="tagline"
            type="text"
            defaultValue={submission?.tagline || ""}
            className="w-full px-3 py-2 border rounded-md dark:bg-neutral-900 dark:border-neutral-800"
            placeholder="One line elevator pitch"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Track</label>
          <select
            name="trackId"
            defaultValue={submission?.trackId || ""}
            className="w-full px-3 py-2 border rounded-md dark:bg-neutral-900 dark:border-neutral-800"
          >
            <option value="">General (No track)</option>
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">GitHub Repo URL</label>
            <input
              name="repoUrl"
              type="url"
              defaultValue={submission?.repoUrl || ""}
              className="w-full px-3 py-2 border rounded-md dark:bg-neutral-900 dark:border-neutral-800"
              placeholder="https://github.com/org/repo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Live Demo URL</label>
            <input
              name="demoUrl"
              type="url"
              defaultValue={submission?.demoUrl || ""}
              className="w-full px-3 py-2 border rounded-md dark:bg-neutral-900 dark:border-neutral-800"
              placeholder="https://demo.vercel.app"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Video Pitch / Demo URL</label>
          <input
            name="videoUrl"
            type="url"
            defaultValue={submission?.videoUrl || ""}
            className="w-full px-3 py-2 border rounded-md dark:bg-neutral-900 dark:border-neutral-800"
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description (Markdown)</label>
          <textarea
            name="descriptionMd"
            rows={6}
            defaultValue={submission?.descriptionMd || ""}
            className="w-full px-3 py-2 border rounded-md font-mono text-sm dark:bg-neutral-900 dark:border-neutral-800"
            placeholder="Describe the problem, solution, architecture, and tools used..."
          />
        </div>

        <div className="flex items-center gap-4 pt-4 border-t dark:border-neutral-800">
          <button
            formAction={saveDraftAction.bind(null, slug)}
            type="submit"
            className="px-5 py-2.5 bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 rounded-md font-medium text-sm hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
          >
            Save Draft
          </button>
          <button
            formAction={submitAction.bind(null, slug)}
            type="submit"
            className="px-5 py-2.5 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-md font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Submit Final Entry
          </button>
        </div>
      </form>
    </main>
  );
}
