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

// Same Manila-midnight anchor as getManilaDayRange, but N days back — for
// "last 7/30 days" style range boundaries (admin overview, admin sales,
// staff performance). Previously several of these dashboards computed their
// own "N days ago" with `new Date(); d.setHours(0,0,0,0)`, which uses the
// server's own local timezone (UTC on Vercel) rather than Manila, silently
// shifting every day-bucketed number by 8 hours — the exact bug this file
// was already written once to avoid for "today."
export function getManilaDaysAgoStart(daysAgo, reference = new Date()) {
  const { start } = getManilaDayRange(reference);
  return new Date(start.getTime() - daysAgo * 24 * 60 * 60 * 1000);
}

const MANILA_TIME_ZONE = "Asia/Manila";

// Date.prototype.toLocaleString() (and its Date/Time-only siblings), called
// with no timeZone option, formats using the server process's own timezone —
// UTC on Vercel — not the customer/staff/admin's actual Philippines time.
// Every timestamp shown on the staff/admin dashboards was quietly off by 8
// hours because of this. These three helpers force Asia/Manila explicitly so
// the displayed wall-clock time is always right regardless of where the
// Node process itself happens to be running.
export function formatManilaDate(date) {
  return date.toLocaleDateString("en-PH", { timeZone: MANILA_TIME_ZONE });
}

export function formatManilaTime(date) {
  return date.toLocaleTimeString("en-PH", {
    timeZone: MANILA_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatManilaDateTime(date) {
  return `${formatManilaDate(date)} ${formatManilaTime(date)}`;
}

export function formatManilaWeekday(date) {
  return date.toLocaleDateString("en-PH", { timeZone: MANILA_TIME_ZONE, weekday: "short" });
}

// Compact "1h 5m" / "12m" rendering for a millisecond duration — used by the
// staff handling-time dashboard. Rounds to the nearest minute since
// second-level precision isn't meaningful for "how long did this take."
export function formatDuration(ms) {
  if (ms == null) return "—";
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}
