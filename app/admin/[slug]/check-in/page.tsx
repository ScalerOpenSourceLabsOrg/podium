import { getEventBySlug } from "@/lib/queries/events";
import { getRegistrationsForEvent } from "@/lib/queries/registrations";
import { CsvExportButton } from "@/components/shared/CsvExportButton";
import { checkInParticipantAction } from "../actions";

type Params = { params: Promise<{ slug: string }>; searchParams: Promise<{ q?: string }> };

export default async function AdminCheckInPage({ params, searchParams }: Params) {
  const { slug } = await params;
  const { q } = await searchParams;
  const event = await getEventBySlug(slug);

  if (!event) return <main className="p-8">Event not found.</main>;

  const registrations = await getRegistrationsForEvent(event.id, q);
  const checkedInCount = registrations.filter((r) => r.checkedInAt).length;

  return (
    <main className="max-w-6xl mx-auto px-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold">Check-In Desk</h1>
          <p className="text-sm text-neutral-500">
            {checkedInCount} of {registrations.length} participants checked in.
          </p>
        </div>
        <CsvExportButton slug={slug} type="registrations" label="Export Registrations CSV" />
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-neutral-900 p-4 rounded-xl border dark:border-neutral-800">
        <form method="GET" className="flex items-center gap-2 w-full max-w-md">
          <input
            name="q"
            type="text"
            defaultValue={q || ""}
            placeholder="Search by name, email, or GitHub handle..."
            className="w-full px-3 py-2 text-sm border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-md text-sm font-medium"
          >
            Search
          </button>
        </form>
      </div>

      <div className="border rounded-xl bg-white dark:bg-neutral-900 dark:border-neutral-800 overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b bg-neutral-50 dark:bg-neutral-800/50 dark:border-neutral-800 text-neutral-500 text-xs font-semibold uppercase">
              <th className="p-3">Participant</th>
              <th className="p-3">College / Year</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-neutral-800">
            {registrations.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-neutral-500">
                  No registrations found.
                </td>
              </tr>
            ) : (
              registrations.map((r) => (
                <tr key={r.id}>
                  <td className="p-3">
                    <div className="font-semibold">{r.user.name || r.user.email}</div>
                    <div className="text-xs text-neutral-500">{r.user.email}</div>
                  </td>
                  <td className="p-3 text-xs">
                    {r.college || "N/A"} {r.yearOfStudy ? `(${r.yearOfStudy})` : ""}
                  </td>
                  <td className="p-3">
                    {r.checkedInAt ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-semibold rounded">
                        ✓ Checked in at {new Date(r.checkedInAt).toLocaleTimeString()}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 text-xs rounded">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {!r.checkedInAt && (
                      <form action={checkInParticipantAction.bind(null, slug, r.id)}>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded transition-colors"
                        >
                          Check In
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
