import Image from "next/image";

// Branded loading indicator for an in-flight action — the logo in its
// original color (shown via LoadingOverlay against the page's white
// background, not the red header, so the original colors read fine here)
// spinning on its vertical axis at 80% opacity, per request. The animation
// itself (animate-logo-flip) is defined in globals.css since Tailwind has
// no built-in flip keyframe.
export default function LogoSpinner({ size = 20 }) {
  return (
    <Image
      src="/branding/logo.webp"
      alt="Loading"
      width={size}
      height={size}
      className="animate-logo-flip opacity-80"
      style={{ width: size, height: size }}
    />
  );
}
