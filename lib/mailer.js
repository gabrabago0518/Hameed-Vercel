import nodemailer from "nodemailer";

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

export async function sendVerificationEmail({ to, name, verifyUrl }) {
  // Logo URL is derived from verifyUrl's own origin rather than importing
  // resolveBaseUrl() separately here — verifyUrl is already the
  // request-resolved absolute URL (localhost, the ngrok tunnel, or the real
  // domain), and email clients need an absolute image URL regardless. Using
  // /icon.png (a plain PNG, not the site's .webp logos) is deliberate — PNG
  // has universal email-client support, while WebP silently fails to render
  // in Outlook desktop and some other clients.
  const logoUrl = `${new URL(verifyUrl).origin}/icon.png`;

  // nodemailer rejects the promise on failure (unlike Resend's { error }
  // shape) — that thrown error is exactly what issueVerificationEmail's own
  // callers already expect and handle (see app/signup/actions.js).
  await transporter.sendMail({
    from: FROM_ADDRESS,
    to,
    subject: "Verify your email — Hameed the Love Recipe",
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
              <td style="background-color:#dc2626;padding:28px 32px;text-align:center;">
                <img src="${logoUrl}" width="56" height="56" alt="Hameed the Love Recipe"
                     style="display:block;margin:0 auto;border-radius:9999px;background-color:#ffffff;padding:6px;" />
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
