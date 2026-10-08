import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { convertToCsv } from "@/lib/csv";
import { getEventRoles, getEventBySlug } from "@/lib/queries/events";
import { getRegistrationsForEvent } from "@/lib/queries/registrations";
import { getModerationSubmissions } from "@/lib/queries/submissions";
import { getEventAssignments } from "@/lib/queries/judging";
import { getRankingsForEvent } from "@/lib/queries/results";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ resource: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { resource } = await params;
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return new NextResponse("Missing slug parameter", { status: 400 });
  }

  const event = await getEventBySlug(slug);
  if (!event) {
    return new NextResponse("Event not found", { status: 404 });
  }

  const roles = await getEventRoles(slug, session.user.id);
  if (!roles.includes("ORGANIZER")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let csvData = "";
  const filename = `${resource}-${slug}.csv`;

  switch (resource) {
    case "registrations": {
      const regs = await getRegistrationsForEvent(event.id);
      const rows = regs.map((r) => ({
        id: r.id,
        name: r.user.name ?? "",
        email: r.user.email,
        githubHandle: r.user.githubHandle ?? "",
        college: r.college ?? "",
        yearOfStudy: r.yearOfStudy ?? "",
        phone: r.phone ?? "",
        checkedInAt: r.checkedInAt ? r.checkedInAt.toISOString() : "",
        createdAt: r.createdAt.toISOString(),
      }));
      csvData = convertToCsv(rows);
      break;
    }

    case "submissions": {
      const subs = await getModerationSubmissions(event.id);
      const rows = subs.map((s) => ({
        id: s.id,
        title: s.title,
        teamName: s.team.name,
        track: s.track?.name ?? "General",
        repoUrl: s.repoUrl ?? "",
        demoUrl: s.demoUrl ?? "",
        visibility: s.visibility,
        judgeable: s.judgeable,
        submittedAt: s.submittedAt ? s.submittedAt.toISOString() : "",
      }));
      csvData = convertToCsv(rows);
      break;
    }

    case "assignments": {
      const assignments = await getEventAssignments(event.id);
      const rows = assignments.map((a) => ({
        id: a.id,
        submissionTitle: a.submission.title,
        judgeEmail: a.judge.email,
        round: a.round,
        isAnchor: a.isAnchor,
        completedAt: a.completedAt ? a.completedAt.toISOString() : "",
      }));
      csvData = convertToCsv(rows);
      break;
    }

    case "rankings": {
      const { overall } = await getRankingsForEvent(event.id);
      const rows = overall.map((r) => ({
        rank: r.rank,
        submissionTitle: r.submission?.title ?? "",
        teamName: r.submission?.team?.name ?? "",
        track: r.submission?.track?.name ?? "General",
        normalizedScore: r.total,
        judgeCount: r.judgeCount,
      }));
      csvData = convertToCsv(rows);
      break;
    }

    default:
      return new NextResponse("Invalid export resource", { status: 400 });
  }

  return new NextResponse(csvData, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
