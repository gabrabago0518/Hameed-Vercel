import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../lib/prisma.js";

// One-off password reset for an existing account (the admin account, in
// practice) that's locked out. Deliberately a real HTML form rather than a
// query-param/JSON endpoint like the other one-off setup routes — a new
// password should never travel through Claude's own hands or sit visibly in
// a URL/chat log, same reasoning as prisma/create-admin.js reading
// ADMIN_PASSWORD from .env instead of being typed here. The customer types
// the new password directly into their own browser; this route only ever
// sees it over the POST body of that one request. Same SETUP_SECRET gate and
// delete-when-done lifecycle as the other one-off setup routes.
export const maxDuration = 30;

function checkSecret(secret) {
  return Boolean(process.env.SETUP_SECRET) && secret === process.env.SETUP_SECRET;
}

function formPage({ secret, email = "", message = "", isError = false }) {
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><title>Reset password</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 420px; margin: 60px auto; padding: 0 16px; }
  label { display: block; margin-top: 12px; font-size: 14px; font-weight: 600; }
  input { width: 100%; padding: 8px; margin-top: 4px; font-size: 14px; box-sizing: border-box; }
  button { margin-top: 20px; padding: 10px 20px; background: #dc2626; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
  p.message { padding: 10px; border-radius: 6px; ${isError ? "background:#fee2e2;color:#991b1b;" : "background:#dcfce7;color:#166534;"} }
</style>
</head>
<body>
  <h2>Reset account password</h2>
  ${message ? `<p class="message">${message}</p>` : ""}
  <form method="POST">
    <input type="hidden" name="secret" value="${secret}" />
    <label>Account email</label>
    <input type="email" name="email" value="${email}" required />
    <label>New password</label>
    <input type="password" name="newPassword" minlength="8" required />
    <button type="submit">Set new password</button>
  </form>
</body>
</html>`;
}

export async function GET(request) {
  const secret = request.nextUrl.searchParams.get("secret") ?? "";
  if (!checkSecret(secret)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return new NextResponse(formPage({ secret }), {
    headers: { "Content-Type": "text/html" },
  });
}

export async function POST(request) {
  const form = await request.formData();
  const secret = form.get("secret")?.toString() ?? "";
  if (!checkSecret(secret)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const email = form.get("email")?.toString().trim().toLowerCase();
  const newPassword = form.get("newPassword")?.toString();

  if (!email || !newPassword || newPassword.length < 8) {
    return new NextResponse(
      formPage({
        secret,
        email: email ?? "",
        message: "Please provide an email and a password of at least 8 characters.",
        isError: true,
      }),
      { headers: { "Content-Type": "text/html" }, status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return new NextResponse(
      formPage({ secret, email, message: `No account found for ${email}.`, isError: true }),
      { headers: { "Content-Type": "text/html" }, status: 404 },
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    // Also force isVerified — irrelevant for the admin account (already
    // verified), but harmless, and means this same route works for a
    // locked-out staff/customer account too without a separate code path.
    data: { passwordHash, isVerified: true },
  });

  return new NextResponse(
    formPage({
      secret,
      email,
      message: `Password updated for ${email} (role: ${user.role}). You can log in with it now.`,
    }),
    { headers: { "Content-Type": "text/html" } },
  );
}
