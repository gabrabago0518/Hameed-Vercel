import Link from "next/link";
import { consumeVerificationToken } from "../../lib/emailVerification.js";
import ResendExpiredForm from "./ResendExpiredForm.jsx";

export default async function VerifyEmailPage({ searchParams }) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-zinc-900">
          Invalid link
        </h1>
        <p className="mt-2 text-zinc-600">This verification link is missing its token.</p>
      </main>
    );
  }

  const result = await consumeVerificationToken(token);

  if (result.status === "verified") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-emerald-800">
          Email verified!
        </h1>
        <p className="mt-2 text-zinc-600">Your account is now active.</p>
        <Link
          href="/login"
          className="mt-6 rounded-full bg-red-600 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-red-700"
        >
          Log in
        </Link>
      </main>
    );
  }

  if (result.status === "already_verified") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-zinc-900">
          Already verified
        </h1>
        <p className="mt-2 text-zinc-600">
          This account is already verified — you can log in.
        </p>
        <Link
          href="/login"
          className="mt-6 rounded-full bg-red-600 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-red-700"
        >
          Log in
        </Link>
      </main>
    );
  }

  if (result.status === "expired") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-zinc-900">
          Link expired
        </h1>
        <p className="mt-2 text-zinc-600">
          This verification link has expired. We can send you a new one.
        </p>
        <ResendExpiredForm userId={result.userId} />
      </main>
    );
  }

  // "invalid" — deliberately generic, no account info leaked.
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-zinc-900">
        Invalid link
      </h1>
      <p className="mt-2 text-zinc-600">
        This verification link is invalid. If you need a new one, try signing up
        again or check the link you clicked for typos.
      </p>
    </main>
  );
}
