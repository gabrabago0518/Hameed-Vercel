import Link from "next/link";
import { checkPasswordResetToken } from "../../lib/passwordReset.js";
import SetNewPasswordForm from "./SetNewPasswordForm.jsx";
import ResendExpiredForm from "./ResendExpiredForm.jsx";

export default async function ResetPasswordPage({ searchParams }) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="font-[family-name:var(--font-heading)] text-xl font-bold text-zinc-900 sm:text-2xl">
          Invalid link
        </h1>
        <p className="mt-2 text-zinc-600">This reset link is missing its token.</p>
      </main>
    );
  }

  const result = await checkPasswordResetToken(token);

  if (result.status === "valid") {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
        <h1 className="font-[family-name:var(--font-heading)] text-xl font-bold text-zinc-900 sm:text-2xl">
          Set a new password
        </h1>
        <SetNewPasswordForm token={token} />
      </main>
    );
  }

  if (result.status === "expired") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="font-[family-name:var(--font-heading)] text-xl font-bold text-zinc-900 sm:text-2xl">
          Link expired
        </h1>
        <p className="mt-2 text-zinc-600">
          This reset link has expired. We can send you a new one.
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
        This reset link is invalid or has already been used.{" "}
        <Link href="/forgot-password" className="font-medium text-red-600 hover:underline">
          Request a new one
        </Link>
        .
      </p>
    </main>
  );
}
