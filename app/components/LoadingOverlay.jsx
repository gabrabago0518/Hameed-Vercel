import LogoSpinner from "./LogoSpinner.jsx";

// Centered, page-level loading indicator — fixed over the whole viewport
// rather than inline inside whatever button triggered it. Doesn't block
// clicks on the rest of the page (pointer-events-none): it's feedback that
// an action is in flight, not a blocking modal. The backdrop itself
// (bg-white/70 + backdrop-blur-sm) blurs whatever's behind it so the
// spinning logo reads as clearly "loading," not just a small icon floating
// over an otherwise-normal-looking page — the blur is on this same fixed
// element, not the logo itself, so the logo stays crisp on top of it.
export default function LoadingOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
      <LogoSpinner size={140} />
    </div>
  );
}
