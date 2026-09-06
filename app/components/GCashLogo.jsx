// Stylized placeholder standing in for the real GCash brand mark — this
// sandbox has no network access to fetch GCash's actual trademarked logo
// asset, so this is a simple text badge in their brand blue rather than an
// attempt to freehand-recreate their real graphic. GCash/PayMongo provide an
// official logo file to registered merchants — drop it in
// public/images/payment/gcash-logo.svg and swap this component to render
// that <img> instead, whenever it's on hand.
export default function GCashLogo({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect width="24" height="24" rx="6" fill="#0072CE" />
      <text
        x="12"
        y="15.5"
        textAnchor="middle"
        fontSize="9"
        fontWeight="700"
        fontFamily="Arial, sans-serif"
        fill="#ffffff"
      >
        GC
      </text>
    </svg>
  );
}
