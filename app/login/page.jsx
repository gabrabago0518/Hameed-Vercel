"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { loginAction } from "./actions.js";

const initialState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const passwordRef = useRef(null);

  // Both inputs are uncontrolled, so by default the browser just leaves
  // whatever was typed in place after a failed attempt — including the
  // password. By request: only the password should clear on a wrong
  // email/password, so the customer doesn't have to retype their email too.
  // Imperatively clearing the DOM node (rather than lifting this into React
  // state) is the right tool here — the email input is left completely
  // alone.
  useEffect(() => {
    if (state.error && passwordRef.current) {
      passwordRef.current.value = "";
    }
  }, [state]);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <h1 className="font-[family-name:var(--font-heading)] text-xl font-bold text-zinc-900 sm:text-2xl">
        Log in
      </h1>

      <form action={formAction} className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="text-sm font-medium text-zinc-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
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
