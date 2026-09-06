"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { loginAction } from "./actions.js";

const initialState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const lastEmailRef = useRef("");

  // React resets every uncontrolled field in a <form action={...}> back to
  // empty once the action finishes — not just the one we actually want
  // cleared. That's what was still wiping the email on a failed login even
  // after the earlier fix: the password's own explicit clear below was
  // (unknowingly) redundant with this built-in reset, which was also
  // wiping the email the whole time. onSubmit fires before that reset, so
  // it's used here to snapshot the email's value; the effect below restores
  // it afterward, but only on an error — the password is left cleared,
  // which is the one field that should reset on a wrong attempt.
  useEffect(() => {
    if (state.error && emailRef.current) {
      emailRef.current.value = lastEmailRef.current;
    }
  }, [state]);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <h1 className="font-[family-name:var(--font-heading)] text-xl font-bold text-zinc-900 sm:text-2xl">
        Log in
      </h1>

      <form
        action={formAction}
        onSubmit={() => {
          lastEmailRef.current = emailRef.current?.value ?? "";
        }}
        className="mt-6 flex flex-col gap-4"
      >
        <div>
          <label htmlFor="email" className="text-sm font-medium text-zinc-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            ref={emailRef}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium text-zinc-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            ref={passwordRef}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
          />
        </div>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
        >
          {pending ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-600">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-red-600 hover:underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}
