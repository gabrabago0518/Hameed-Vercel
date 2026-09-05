import { redirect } from "next/navigation";

// /staff itself isn't a real page anymore — /staff/dashboard is the actual
// landing page after staff login (see app/login/actions.js). This just
// catches anyone who types /staff directly or follows an old bookmark/link.
export default function StaffIndexRedirect() {
  redirect("/staff/dashboard");
}
