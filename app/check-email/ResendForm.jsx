"use client";

import { useActionState } from "react";
import { resendByEmailAction } from "./actions.js";

const initialState = { message: null, error: null };

export default function ResendForm({ initialEmail }) {
  const [state, formAction, pending] = useActionState(resendByEmailAction, initialState);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-3">
      <div>
        <label htmlFor="email" className="text-sm font-medium text-zinc-700">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={initialEmail}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
        />
      </div>

      {state.message && <p className="text-sm text-emerald-700">{state.message}</p>}
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
      >
        {pending ? "Sending..." : "Resend verification email"}
      </button>
    </form>
  );
}
