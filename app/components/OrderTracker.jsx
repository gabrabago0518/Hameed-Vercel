import { Check } from "lucide-react";

// Horizontal progress stepper for the customer order page. `stages` comes
// from lib/orderStatus.js's buildOrderTracker() — each one already carries
// reached/current flags and its first-reached timestamp.
export default function OrderTracker({ stages }) {
  return (
    <div className="flex items-start">
      {stages.map((stage, index) => (
        <div key={stage.status} className="flex flex-1 items-center last:flex-none">
          {index > 0 && (
            <div className={`h-0.5 flex-1 ${stage.reached ? "bg-red-500" : "bg-zinc-200"}`} />
          )}
          <div className="flex flex-col items-center px-1 text-center">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                stage.reached
                  ? "border-red-500 bg-red-500 text-white"
                  : "border-zinc-300 bg-white text-zinc-300"
              } ${stage.current ? "ring-4 ring-red-100 animate-pulse" : ""}`}
            >
              {stage.reached ? (
                <Check size={16} strokeWidth={3} />
              ) : (
                <span className="h-2 w-2 rounded-full bg-current" />
              )}
            </div>
            <p
              className={`mt-2 max-w-[5.5rem] text-xs font-medium ${
                stage.reached ? "text-zinc-900" : "text-zinc-400"
              }`}
            >
              {stage.label}
            </p>
            {stage.timestamp && (
              <p className="mt-0.5 text-[11px] text-zinc-400">
                {stage.current ? "since " : ""}
                {stage.timestamp.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
