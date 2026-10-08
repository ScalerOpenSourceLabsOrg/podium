import { PrismaClient } from "@prisma/client";
import {
  CRITERIA,
  DOMAIN,
  hoursFromNow,
  JUDGE_COUNT,
  JUDGES_PER_SUBMISSION,
  SLUG,
  SUBMISSION_COUNT,
  TEAM_COUNT,
  teamSize,
  TRACKS,
} from "./seed-fixtures";

const prisma = new PrismaClient();

async function main() {
  await prisma.event.deleteMany({ where: { slug: SLUG } });
  // Users are global, so the event cascade does not reach them.
  await prisma.user.deleteMany({
    where: { email: { endsWith: `@${DOMAIN}` } },
  });

  const event = await prisma.event.create({
    data: {
      slug: SLUG,
      name: "HackDay 26",
      tagline: "36 hours, one weekend",
      rulesMd: "Build something new. Ship it before the deadline.",
      status: "PUBLISHED",
      maxTeamSize: 4,
      registrationOpensAt: hoursFromNow(-72),
      registrationClosesAt: hoursFromNow(-12),
      submissionOpensAt: hoursFromNow(-12),
      submissionClosesAt: hoursFromNow(12),
      judgingOpensAt: hoursFromNow(12),
      judgingClosesAt: hoursFromNow(24),
      galleryPublic: true,
    },
  });

  const tracks = await Promise.all(
    TRACKS.map((name) =>
      prisma.track.create({ data: { eventId: event.id, name } }),
    ),
  );

  const criteria = await Promise.all(
    CRITERIA.map((criterion, position) =>
      prisma.criterion.create({
        data: { ...criterion, position, eventId: event.id },
      }),
    ),
  );

  const organizer = await prisma.user.create({
    data: {
      name: "Ada Organizer",
      email: `organizer@${DOMAIN}`,
      githubHandle: "ada",
    },
  });
  await prisma.eventMembership.create({
    data: { eventId: event.id, userId: organizer.id, role: "ORGANIZER" },
  });

  const judges: { id: string; email: string }[] = [];
  for (let i = 1; i <= JUDGE_COUNT; i++) {
    const judge = await prisma.user.create({
      data: { name: `Judge ${i}`, email: `judge${i}@${DOMAIN}` },
    });
    await prisma.eventMembership.create({
      data: { eventId: event.id, userId: judge.id, role: "JUDGE" },
    });
    judges.push(judge);
  }

  const leaders: { id: string; email: string }[] = [];
  let registrantNumber = 0;

  for (let t = 0; t < TEAM_COUNT; t++) {
    const team = await prisma.team.create({
      data: {
        eventId: event.id,
        name: `Team ${t + 1}`,
        inviteCode: `JOIN${String(t + 1).padStart(3, "0")}`,
        isOpen: t % 3 === 0,
        lookingFor: t % 3 === 0 ? ["design", "backend"] : [],
      },
    });

    for (let m = 0; m < teamSize(t); m++) {
      registrantNumber++;
      const user = await prisma.user.create({
        data: {
          name: `Registrant ${registrantNumber}`,
          email: `registrant${registrantNumber}@${DOMAIN}`,
        },
      });
      await prisma.registration.create({
        data: {
          eventId: event.id,
          userId: user.id,
          college: "Example Institute of Technology",
          yearOfStudy: String((registrantNumber % 4) + 1),
          phone: `+9190000${String(registrantNumber).padStart(5, "0")}`,
          // Four teams never showed up, which is what a real event looks like.
          checkedInAt: t < 8 ? hoursFromNow(-10) : null,
        },
      });
      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: user.id,
          role: m === 0 ? "LEADER" : "MEMBER",
        },
      });
      if (m === 0) leaders.push(user);
    }

    if (t < SUBMISSION_COUNT) {
      await prisma.submission.create({
        data: {
          eventId: event.id,
          teamId: team.id,
          trackId: tracks[t % tracks.length].id,
          title: `Project ${t + 1}`,
          tagline: "A thing that does a thing",
          descriptionMd: "Built over one weekend.",
          repoUrl: `https://github.com/example/project-${t + 1}`,
          videoUrl: `https://youtube.com/watch?v=seed${t + 1}`,
          tech: ["typescript", "postgres"],
          status: "SUBMITTED",
          visibility: "GALLERY",
          submittedAt: hoursFromNow(-1),
        },
      });
    }
  }

  const submissions = await prisma.submission.findMany({
    where: { eventId: event.id },
    orderBy: { title: "asc" },
  });

  // Round-robin, no anchors yet: lib/scoring/assign.ts replaces this.
  let cursor = 0;
  let assignmentIndex = 0;
  for (const submission of submissions) {
    for (let j = 0; j < JUDGES_PER_SUBMISSION; j++) {
      const judgeIndex = cursor++ % judges.length;
      const judge = judges[judgeIndex];
      const scored = assignmentIndex++ % 5 < 3; // ~60% of the queue is done
      const assignment = await prisma.assignment.create({
        data: {
          eventId: event.id,
          submissionId: submission.id,
          judgeId: judge.id,
          completedAt: scored ? hoursFromNow(-0.5) : null,
        },
      });
      if (!scored) continue;
      for (const criterion of criteria) {
        await prisma.score.create({
          data: {
            assignmentId: assignment.id,
            criterionId: criterion.id,
            // Biased per judge on purpose, so normalization has work to do.
            value:
              1 + ((judgeIndex + criterion.position + j) % criterion.maxScore),
            comment: "Clear demo, solid execution.",
          },
        });
      }
    }
  }
  console.log(`\nSeeded "${event.name}" (/e/${SLUG})`);
  console.log(
    `${registrantNumber} registrants, ${TEAM_COUNT} teams, ` +
      `${submissions.length} submissions, ${assignmentIndex} assignments`,
  );
  console.log("\nSign in at http://localhost:3000/api/auth/signin with:");
  console.log(`  organizer   ${organizer.email}   -> /admin/${SLUG}`);
  console.log(`  judge       ${judges[0].email}       -> /judge/${SLUG}`);
  console.log(`  participant ${leaders[0].email} -> /dashboard/${SLUG}`);
  console.log(
    "\nThese addresses have no mailbox. See README for local sign-in.\n",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
