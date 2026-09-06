import Link from "next/link";
import { MapPin, Clock, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-auto w-full bg-zinc-900 text-zinc-300">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6 sm:py-12">
        <div>
          <h3 className="font-[family-name:var(--font-heading)] text-lg uppercase tracking-wide text-white">
            Hameed the Love Recipe
          </h3>
          <p className="mt-2 text-base" lang="ar" dir="rtl">
            ٱلْحَمْدُ لِلَّٰهِ
          </p>
          <div className="mt-4 flex gap-4">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center text-sm font-medium underline-offset-2 hover:text-white hover:underline"
            >
              Facebook
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center text-sm font-medium underline-offset-2 hover:text-white hover:underline"
            >
              Instagram
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-white">Contact</h4>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            <li className="flex items-start gap-2">
              <Phone size={16} className="mt-0.5 shrink-0" />
              <a href="tel:+639774230395" className="hover:text-white hover:underline">
                0977 423 0395
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0" />
              <span>Lower Bicutan &amp; New Lower Bicutan, Taguig City</span>
            </li>
            <li className="flex items-start gap-2">
              <Clock size={16} className="mt-0.5 shrink-0" />
              <span>Daily, 9:00 AM – 9:00 PM</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-white">Explore</h4>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            <li>
              <Link href="/menu" className="hover:text-white">
                Menu
              </Link>
            </li>
            <li>
              <Link href="/account" className="hover:text-white">
                My Account
              </Link>
            </li>
            <li>
              <Link href="/orders" className="hover:text-white">
                My Orders
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-4 text-center sm:px-6">
        <p className="text-[11px] text-zinc-500">Made by Gab</p>
      </div>
    </footer>
  );
}
