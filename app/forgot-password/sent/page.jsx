import ResendForm from "./ResendForm.jsx";

// Deliberately the same message regardless of whether the email actually
// belongs to an account — requestPasswordResetAction already redirects here
// unconditionally except on a genuine rate-limit hit, so this page never
// needs to distinguish "sent" from "no such account" either.
export default async function PasswordResetSentPage({ searchParams }) {
  const { email } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <h1 className="font-[family-name:var(--font-heading)] text-xl font-bold text-zinc-900 sm:text-2xl">
        Check your email
      </h1>
      <p className="mt-3 text-sm text-zinc-600">
        If an account exists for {email ? <strong>{email}</strong> : "that email"}, we&apos;ve sent
        a link to reset your password. The link expires in 1 hour.
      </p>

      <ResendForm initialEmail={email ?? ""} />
    </main>
  );
}
