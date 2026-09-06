import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma.js";

// One-off rename: the branch stored as "Maharlika Branch" is actually
// "Lower Bicutan Branch" — confirmed once the real store photos were
// uploaded under that name. Renaming here (rather than just fixing the
// homepage) is what makes StoreLocationsSection.jsx automatically pick up
// public/images/stores/lower-bicutan-branch.webp, since that component
// derives the photo filename from the branch's own name field. Same
// SETUP_SECRET gate and delete-when-done lifecycle as the other one-off
// setup routes.
export async function GET(request) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.SETUP_SECRET || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const branch = await prisma.branch.findFirst({ where: { name: "Maharlika Branch" } });
  if (!branch) {
    // Already renamed (or never existed under that name) — idempotent.
    const existing = await prisma.branch.findFirst({ where: { name: "Lower Bicutan Branch" } });
    return NextResponse.json({
      ok: true,
      changed: false,
      result: existing ? "already renamed" : "no 'Maharlika Branch' found",
    });
  }

  const updated = await prisma.branch.update({
    where: { id: branch.id },
    data: { name: "Lower Bicutan Branch" },
  });

  return NextResponse.json({
    ok: true,
    changed: true,
    branch: { id: updated.id, name: updated.name, address: updated.address, city: updated.city },
  });
}
