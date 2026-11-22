import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.event.count();
    console.log(`EVENTS=${count}`);
    process.exit(count > 0 ? 0 : 2);
  } catch (err) {
    console.error("CHECK_ERROR:", err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
