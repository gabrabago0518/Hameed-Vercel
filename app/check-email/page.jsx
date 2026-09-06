import ResendForm from "./ResendForm.jsx";

export default async function CheckEmailPage({ searchParams }) {
  const { email, emailFailed } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <h1 className="font-[family-name:var(--font-heading)] text-xl font-bold text-zinc-900 sm:text-2xl">
        Check your email
      </h1>

      {emailFailed ? (
        <p className="mt-3 text-sm text-amber-700">
          Your account was created, but we ran into a problem sending the
          verification email. Use the form below to try sending it again.
        </p>
      ) : (
        <p className="mt-3 text-sm text-zinc-600">
          We sent a verification link to {email ? <strong>{email}</strong> : "your email"}.
          Click it to activate your account — the link expires in 24 hours.
        </p>
      )}

      <ResendForm initialEmail={email ?? ""} />
    </main>
  );
}
