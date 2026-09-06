import nodemailer from "nodemailer";
import path from "node:path";

// Replaces lib/resend.js — Resend's free tier can only deliver to the email
// address the Resend account itself is registered with until a domain is
// verified, which blocked sending real verification emails to actual
// customer inboxes. Gmail SMTP can send to any address from day one, at the
// cost of Gmail's own sending limits (500/day on a plain Gmail account,
// 2000/day on Workspace) — plenty for this project's current scale.
//
// Gmail SMTP requires an "App Password" (a 16-character code), not the
// normal Gmail password — Google only offers this once 2-Step Verification
// is turned on for the account. Generate one at
// https://myaccount.google.com/apppasswords, then set these in .env (and in
// Vercel's Environment Variables for the live site):
//   GMAIL_USER          the full gmail.com address sending the email
//   GMAIL_APP_PASSWORD  the 16-character app password, no spaces
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const FROM_ADDRESS = `"Hameed the Love Recipe" <${process.env.GMAIL_USER}>`;

// The actual logo (public/branding/logo-email.png — a small PNG export of
// the real "Hameed Logo stroke" artwork, transparent outside the circular
// badge) is sent as an inline CID attachment rather than linked by URL. A
// URL-based <img src> depends on the live site actually being reachable at
// whatever domain the email happens to be sent from (this broke the first
// version of this email — a preview build referenced a placeholder domain
// and the logo never loaded); a CID attachment travels inside the email
// itself, so it renders the same regardless of domain, and works even
// before the site is deployed. PNG (not the site's usual .webp) is still
// the right call here — WebP silently fails to render in Outlook desktop
// and some other mail clients.
const LOGO_PATH = path.join(process.cwd(), "public/branding/logo-email.png");
const LOGO_CID = "hameed-logo";

export async function sendVerificationEmail({ to, name, verifyUrl }) {
  // nodemailer rejects the promise on failure (unlike Resend's { error }
  // shape) — that thrown error is exactly what issueVerificationEmail's own
  // callers already expect and handle (see app/signup/actions.js).
  await transporter.sendMail({
    from: FROM_ADDRESS,
    to,
    subject: "Verify your email — Hameed the Love Recipe",
    attachments: [
      {
        filename: "hameed-logo.png",
        path: LOGO_PATH,
        cid: LOGO_CID,
      },
    ],
    html: `
<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background-color:#f4f4f5;font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0"
                 style="max-width:480px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background-color:#dc2626;padding:24px 32px;text-align:center;">
                <img src="cid:${LOGO_CID}" width="72" height="72" alt="Hameed the Love Recipe"
                     style="display:block;margin:0 auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#18181b;">
                  Verify your email
                </h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46;">
                  Hi ${name}, thanks for signing up for <strong>Hameed the Love Recipe</strong>!
                  Confirm this is your email address to activate your account.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
                  <tr>
                    <td style="border-radius:9999px;background-color:#dc2626;">
                      <a href="${verifyUrl}"
                         style="display:inline-block;padding:12px 32px;font-size:15px;font-weight:600;
                                color:#ffffff;text-decoration:none;border-radius:9999px;">
                        Verify Email
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#71717a;">
                  Or paste this link into your browser:<br />
                  <a href="${verifyUrl}" style="color:#dc2626;word-break:break-all;">${verifyUrl}</a>
                </p>
                <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#a1a1aa;">
                  This link expires in 24 hours. If you didn't sign up, you can safely ignore this
                  email.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:20px 0 0;font-size:12px;color:#a1a1aa;">
            Hameed the Love Recipe
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
    `,
  });
}

// Plain internal ops alert — not customer-facing, so no logo/branded
// template, just enough formatting to be readable. Sent to ADMIN_EMAIL (the
// same env var prisma/create-admin.js reads), since that's already the
// convention for "the site owner's own inbox" in this project rather than
// introducing a second admin-contact env var. Callers (the PayMongo webhook,
// the payment reconciliation sweep) already wrap this in try/catch and only
// log on failure — an alert email failing to send should never itself break
// the payment-handling code path that triggered it.
export async function sendAdminAlertEmail({ subject, message }) {
  const to = process.env.ADMIN_EMAIL;
  if (!to) {
    throw new Error("ADMIN_EMAIL is not set — cannot send admin alert email.");
  }

  await transporter.sendMail({
    from: FROM_ADDRESS,
    to,
    subject: `[Hameed alert] ${subject}`,
    html: `
<!doctype html>
<html>
  <body style="margin:0;padding:24px;background-color:#f4f4f5;font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"
                 style="max-width:560px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background-color:#b91c1c;padding:16px 24px;">
                <p style="margin:0;font-size:14px;font-weight:700;color:#ffffff;">⚠ Hameed the Love Recipe — needs a look</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <h1 style="margin:0 0 12px;font-size:17px;font-weight:700;color:#18181b;">${subject}</h1>
                <pre style="margin:0;padding:12px;background-color:#f4f4f5;border-radius:8px;font-size:13px;
                            line-height:1.6;color:#3f3f46;white-space:pre-wrap;word-break:break-word;">${message}</pre>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
    `,
  });
}

export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  await transporter.sendMail({
    from: FROM_ADDRESS,
    to,
    subject: "Reset your password — Hameed the Love Recipe",
    attachments: [
      {
        filename: "hameed-logo.png",
        path: LOGO_PATH,
        cid: LOGO_CID,
      },
    ],
    html: `
<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background-color:#f4f4f5;font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0"
                 style="max-width:480px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background-color:#dc2626;padding:24px 32px;text-align:center;">
                <img src="cid:${LOGO_CID}" width="72" height="72" alt="Hameed the Love Recipe"
                     style="display:block;margin:0 auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#18181b;">
                  Reset your password
                </h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46;">
                  Hi ${name}, we got a request to reset the password on your
                  <strong>Hameed the Love Recipe</strong> account. Click below to choose a new one.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
                  <tr>
                    <td style="border-radius:9999px;background-color:#dc2626;">
                      <a href="${resetUrl}"
                         style="display:inline-block;padding:12px 32px;font-size:15px;font-weight:600;
                                color:#ffffff;text-decoration:none;border-radius:9999px;">
                        Reset Password
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#71717a;">
                  Or paste this link into your browser:<br />
                  <a href="${resetUrl}" style="color:#dc2626;word-break:break-all;">${resetUrl}</a>
                </p>
                <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#a1a1aa;">
                  This link expires in 1 hour. If you didn't request this, you can safely ignore this
                  email — your password won't change unless you click the link above and choose a
                  new one.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:20px 0 0;font-size:12px;color:#a1a1aa;">
            Hameed the Love Recipe
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
    `,
  });
}
