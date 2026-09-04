// The Philippines (Asia/Manila) is UTC+8 year-round — no daylight saving —
// so "today in Manila" can be computed with a fixed offset instead of a full
// timezone library. This matters because a server (e.g. Vercel's functions)
// typically runs in UTC: doing `new Date().setHours(0, 0, 0, 0)` there gives
// UTC midnight, not Manila midnight, which is 8 hours off and would make the
// staff dashboard's "Orders Today" count reset at 8am Manila time instead of
// midnight.
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

// Returns the UTC instants that bound "today" in Asia/Manila, as real Date
// objects usable directly in a Prisma `gte`/`lt` filter — regardless of what
// timezone the server process itself is running in.
export function getManilaDayRange(reference = new Date()) {
  const manilaNow = new Date(reference.getTime() + MANILA_OFFSET_MS);
  const year = manilaNow.getUTCFullYear();
  const month = manilaNow.getUTCMonth();
  const day = manilaNow.getUTCDate();

  const start = new Date(Date.UTC(year, month, day, 0, 0, 0, 0) - MANILA_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { start, end };
}
