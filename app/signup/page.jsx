"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction } from "./actions.js";

const initialState = { error: null };

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signupAction, initialState);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <h1 className="font-[family-name:var(--font-heading)] text-xl font-bold text-zinc-900 sm:text-2xl">
        Create an account
      </h1>

      <form action={formAction} className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className="text-sm font-medium text-zinc-700">
              First name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="text-sm font-medium text-zinc-700">
              Last name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
            />
          </div>
        </div>

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
          <label htmlFor="phoneLocal" className="text-sm font-medium text-zinc-700">
            Contact number
          </label>
          <div className="mt-1 flex">
            <span className="flex min-h-11 items-center rounded-l-lg border border-r-0 border-zinc-300 bg-zinc-50 px-3 text-sm text-zinc-600">
              +63
            </span>
            <input
              id="phoneLocal"
              name="phoneLocal"
              type="tel"
              inputMode="numeric"
              required
              placeholder="9171234567"
              className="w-full min-w-0 rounded-r-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
            />
          </div>
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
            minLength={8}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-zinc-500">At least 8 characters.</p>
        </div>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
        >
          {pending ? "Creating account..." : "Sign up"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-red-600 hover:underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
