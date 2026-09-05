import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma.js";

// One-off rename: "Original (Not Spicy)" -> "Original" for the Spice Level
// variant option, by request. Only touches the option's display name —
// OrderItemVariantSelection rows read the name live via the variantOption
// relation (never snapshotted, see schema.prisma), so past orders will show
// the new label too, same as this app's existing addon-name behavior.
// Same SETUP_SECRET gate and delete-when-done lifecycle as the other
// one-off setup routes.
export async function GET(request) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.SETUP_SECRET || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await prisma.itemVariantOption.updateMany({
    where: { name: "Original (Not Spicy)" },
    data: { name: "Original" },
  });

  return NextResponse.json({ ok: true, renamed: result.count });
}
