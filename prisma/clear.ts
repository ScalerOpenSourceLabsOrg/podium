import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log("Cleaning database...");

  // Delete child records first to respect FK constraints
  await prisma.score.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.award.deleteMany({});
  await prisma.submission.deleteMany({});
  await prisma.teamMember.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.registration.deleteMany({});
  await prisma.criterion.deleteMany({});
  await prisma.track.deleteMany({});
  await prisma.eventMembership.deleteMany({});
  await prisma.event.deleteMany({});

  // Auth & Identity tables
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.verificationToken.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("✓ All dummy data and database records deleted successfully.");
}

clearDatabase()
  .catch((e) => {
    console.error("Error clearing database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
