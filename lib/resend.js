import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// TODO: onboarding@resend.dev is Resend's shared test sender — it only
// works for a Resend *test* account and (until a domain is verified) can
// only deliver to the email address your Resend account itself is
// registered with, not arbitrary customer inboxes. Swap this for a real
// address on your own verified domain (e.g. "no-reply@hameedlove.com")
// before this goes anywhere near real customers.
const FROM_ADDRESS = "Hameed the Love Recipe <onboarding@resend.dev>";

export async function sendVerificationEmail({ to, name, verifyUrl }) {
  const { error } = await resend.emails.send({
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

  if (error) {
    throw new Error(error.message || "Failed to send verification email.");
  }
}
