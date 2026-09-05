import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../lib/prisma.js";
import { restaurantSeedData } from "../../../prisma/seedData.js";

// One-time setup endpoint for a freshly created database (e.g. right after
// pointing DATABASE_URL at a new Neon project) where nobody has a terminal
// with direct Postgres access — Vercel's own servers can reach Neon over a
// normal TCP connection even when a given Claude Code session's sandbox
// can't. Visiting this URL once (with the right secret) does what
// `npm run db:seed` + `npm run db:create-staff` (+ create-admin, if
// ADMIN_EMAIL/ADMIN_PASSWORD are set) would otherwise do from a terminal.
//
// Gated by SETUP_SECRET (set it in Vercel's environment variables to any
// random string) so a stranger can't hit this and mess with the database.
// DELETE THIS FILE once the database is set up — it has no reason to exist
// in production after that, and leaving it around is unnecessary attack
// surface even with the secret check.
export async function GET(request) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.SETUP_SECRET || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const results = {};

  // Safe to call more than once — only seeds the menu if nothing exists yet,
  // rather than creating a duplicate restaurant on a second visit.
  const existingRestaurant = await prisma.restaurant.findFirst();
  if (existingRestaurant) {
    results.menuSeed = `skipped — "${existingRestaurant.name}" already exists`;
  } else {
    const restaurant = await prisma.restaurant.create({ data: restaurantSeedData });
    results.menuSeed = `created "${restaurant.name}" with branches, categories, and menu items`;
  }

  // Upsert, like prisma/create-staff.js — safe to call again (e.g. to reset
  // the password back to the default).
  const staffEmail = process.env.STAFF_EMAIL || "staff@gmail.com";
  const staffPassword = process.env.STAFF_PASSWORD || "test1234";
  const staffPasswordHash = await bcrypt.hash(staffPassword, 10);
  const staff = await prisma.user.upsert({
    where: { email: staffEmail },
    update: { passwordHash: staffPasswordHash, role: "STAFF", isVerified: true },
    create: {
      email: staffEmail,
      name: process.env.STAFF_NAME || "Staff",
      passwordHash: staffPasswordHash,
      role: "STAFF",
      isVerified: true,
    },
  });
  results.staff = staff.email;

  // Only attempted if you've set these in Vercel — same as create-admin.js
  // requiring them, so this never invents an admin account on its own.
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const adminPasswordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    const admin = await prisma.user.upsert({
      where: { email: process.env.ADMIN_EMAIL },
      update: { passwordHash: adminPasswordHash, role: "ADMIN", isVerified: true },
      create: {
        email: process.env.ADMIN_EMAIL,
        name: process.env.ADMIN_NAME || "Admin",
        passwordHash: adminPasswordHash,
        role: "ADMIN",
        isVerified: true,
      },
    });
    results.admin = admin.email;
  } else {
    results.admin = "skipped — ADMIN_EMAIL/ADMIN_PASSWORD not set";
  }

  return NextResponse.json({ ok: true, results });
}
