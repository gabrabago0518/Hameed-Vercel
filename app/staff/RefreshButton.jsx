"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

// Sits alongside the auto-refresh poller (StaffOrdersPoller) as a manual
// fallback — staff don't have to wait up to 5s, or trust the poller, if they
// just want the list current right now.
export default function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={isPending}
      className="flex min-h-11 items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-600 hover:border-red-200 hover:text-red-600 disabled:opacity-60"
    >
      <RefreshCw size={16} className={isPending ? "animate-spin" : ""} />
      Refresh
    </button>
  );
}
