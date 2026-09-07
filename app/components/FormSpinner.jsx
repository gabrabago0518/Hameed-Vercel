"use client";

import { useFormStatus } from "react-dom";
import LoadingOverlay from "./LoadingOverlay.jsx";

// Drop this anywhere inside a plain <form action={someServerAction}> (a
// Server Component form works fine — this only needs to be a descendant in
// the rendered tree, not in the same file) to show the branded spinning-logo
// overlay for as long as that specific form's submission is in flight.
// useFormStatus reads pending state from the nearest enclosing <form>, so
// this needs no wiring beyond being placed inside one — no useTransition
// conversion, no prop drilling. By request: most of this site's actions
// (staff/admin buttons, cart updates, address/account forms) are plain
// progressively-enhanced forms with no client-side pending state at all,
// which is exactly what made a slow action look stuck rather than loading.
export default function FormSpinner() {
  const { pending } = useFormStatus();
  return pending ? <LoadingOverlay /> : null;
}
