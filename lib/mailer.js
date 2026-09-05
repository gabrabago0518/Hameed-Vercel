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
  // nodemailer rejects the promise on failure (unlike Resend's { error }
  // shape) — that thrown error is exactly what issueVerificationEmail's own
  // callers already expect and handle (see app/signup/actions.js).
  await transporter.sendMail({
    from: FROM_ADDRESS,
    to,
    subject: "Verify your email — Hameed the Love Recipe",
    html: `
      <p>Hi ${name},</p>
      <p>Thanks for signing up! Click the link below to verify your email
      address and activate your account:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>This link expires in 24 hours. If you didn't sign up, you can
      safely ignore this email.</p>
    `,
  });
}
