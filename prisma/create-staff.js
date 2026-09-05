import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";

// Mirrors create-admin.js — same upsert-so-it's-safe-to-rerun shape, same
// bcryptjs hashing (this project's password hashing everywhere, chosen over
// plain bcrypt to avoid needing a native build toolchain on Windows). Reads
// from .env like create-admin.js does, but — unlike ADMIN_EMAIL/PASSWORD,
// which are required — falls back to the exact test credentials the
// original request asked for (staff@gmail.com / test1234) if STAFF_EMAIL/
// STAFF_PASSWORD aren't set, so `npm run db:create-staff` works out of the
// box for local testing without any .env changes.
async function main() {
  const email = process.env.STAFF_EMAIL || "staff@gmail.com";
  const password = process.env.STAFF_PASSWORD || "test1234";
  const name = process.env.STAFF_NAME || "Staff";

  const passwordHash = await bcrypt.hash(password, 10);

  const staff = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "STAFF", name, isVerified: true },
    create: { email, passwordHash, role: "STAFF", name, isVerified: true },
  });

  console.log(`Staff account ready: ${staff.email} (role: ${staff.role})`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
