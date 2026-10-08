import Link from "next/link";
import { getEventWithDetails } from "@/lib/queries/events";
import { CsvExportButton } from "@/components/shared/CsvExportButton";

type Params = { params: Promise<{ slug: string }> };

export default async function AdminOverviewPage({ params }: Params) {
  const { slug } = await params;
  const event = await getEventWithDetails(slug);

  if (!event) return <main className="p-8">Event not found.</main>;

  return (
    <main className="max-w-6xl mx-auto px-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold">{event.name} Dashboard</h1>
          <p className="text-sm text-neutral-500">Status: {event.status}</p>
        </div>
        <div className="flex gap-2">
          <CsvExportButton slug={slug} type="registrations" label="Export Registrations" />
          <CsvExportButton slug={slug} type="submissions" label="Export Submissions" />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-6">
        <div className="border rounded-xl p-6 bg-white dark:bg-neutral-900 dark:border-neutral-800">
          <div className="text-xs uppercase font-semibold text-neutral-500">Registrations</div>
          <div className="text-3xl font-bold mt-2">{event._count.registrations}</div>
          <Link
            href={`/admin/${slug}/check-in`}
            className="inline-block mt-4 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Manage Check-in &rarr;
          </Link>
        </div>

        <div className="border rounded-xl p-6 bg-white dark:bg-neutral-900 dark:border-neutral-800">
          <div className="text-xs uppercase font-semibold text-neutral-500">Teams</div>
          <div className="text-3xl font-bold mt-2">{event._count.teams}</div>
          <div className="text-xs text-neutral-500 mt-4">
            Max team size: {event.maxTeamSize}
          </div>
        </div>

        <div className="border rounded-xl p-6 bg-white dark:bg-neutral-900 dark:border-neutral-800">
          <div className="text-xs uppercase font-semibold text-neutral-500">Submissions</div>
          <div className="text-3xl font-bold mt-2">{event._count.submissions}</div>
          <Link
            href={`/admin/${slug}/submissions`}
            className="inline-block mt-4 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Review Moderation Queue &rarr;
          </Link>
        </div>
      </div>

      <div className="border rounded-xl p-6 bg-white dark:bg-neutral-900 dark:border-neutral-800 space-y-4">
        <h2 className="text-lg font-semibold">Event Configuration</h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-neutral-500">Registration Opens:</span>{" "}
            {event.registrationOpensAt ? new Date(event.registrationOpensAt).toLocaleString() : "Not set"}
          </div>
          <div>
            <span className="text-neutral-500">Registration Closes:</span>{" "}
            {event.registrationClosesAt ? new Date(event.registrationClosesAt).toLocaleString() : "Not set"}
          </div>
          <div>
            <span className="text-neutral-500">Submission Opens:</span>{" "}
            {event.submissionOpensAt ? new Date(event.submissionOpensAt).toLocaleString() : "Not set"}
          </div>
          <div>
            <span className="text-neutral-500">Submission Closes:</span>{" "}
            {event.submissionClosesAt ? new Date(event.submissionClosesAt).toLocaleString() : "Not set"}
          </div>
        </div>
      </div>
    </main>
  );
}
