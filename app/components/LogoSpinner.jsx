import Image from "next/image";

// Small branded loading indicator for an in-flight action — the white
// logo (reads cleanly on the red buttons this is used inside) spinning on
// its vertical axis at 50% opacity, per request. The animation itself
// (animate-logo-flip) is defined in globals.css since Tailwind has no
// built-in flip keyframe.
export default function LogoSpinner({ size = 20 }) {
  return (
    <Image
      src="/branding/logo-white.webp"
      alt="Loading"
      width={size}
      height={size}
      className="animate-logo-flip opacity-50"
      style={{ width: size, height: size }}
    />
  );
}
