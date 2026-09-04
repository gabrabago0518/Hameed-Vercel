"use client";

import { useActionState } from "react";
import { resendForExpiredTokenAction } from "./actions.js";

const initialState = { message: null, error: null };

export default function ResendExpiredForm({ userId }) {
  const [state, formAction, pending] = useActionState(resendForExpiredTokenAction, initialState);

  return (
    <form action={formAction} className="mt-4 flex flex-col items-center">
      <input type="hidden" name="userId" value={userId} />
      {state.message && <p className="mb-3 text-sm text-emerald-700">{state.message}</p>}
      {state.error && <p className="mb-3 text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
      >
        {pending ? "Sending..." : "Send me a new link"}
      </button>
    </form>
  );
}
