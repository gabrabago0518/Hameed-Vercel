import { redirect } from "next/navigation";
import { getCurrentUser } from "./session.js";

// ADMIN only. A logged-out visitor goes to /login, a STAFF user gets sent to
// their own /staff/dashboard (not a bare error page), and a CUSTOMER — even
// one who guesses the URL directly — gets bounced home.
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "STAFF") redirect("/staff/dashboard");
  if (user.role !== "ADMIN") redirect("/");
  return user;
}

// ADMIN or STAFF. Admins are let into /staff too (they're a superset of
// staff access — an admin should be able to see the kitchen view, not just
// the reporting side), but a plain CUSTOMER never gets in.
export async function requireStaff() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN" && user.role !== "STAFF") redirect("/");
  return user;
}
