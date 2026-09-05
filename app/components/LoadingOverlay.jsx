import LogoSpinner from "./LogoSpinner.jsx";

// Centered, page-level loading indicator — fixed over the whole viewport
// rather than inline inside whatever button triggered it. Doesn't block
// clicks on the rest of the page (pointer-events-none): it's feedback that
// an action is in flight, not a blocking modal.
export default function LoadingOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <LogoSpinner size={72} />
    </div>
  );
}
