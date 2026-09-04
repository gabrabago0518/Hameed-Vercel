"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const AUTO_ADVANCE_MS = 4500;
const SWIPE_THRESHOLD_PX = 50;

// Hero carousel for the homepage — hand-rolled (no carousel library) since
// this is the very first thing a mobile visitor downloads. Each slide can
// optionally carry a heading + CTA button; slides that only set `alt` render
// as a plain photo with no overlay.
export default function HeroCarousel({ slides }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(null);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [paused, slides.length]);

  function goTo(nextIndex) {
    setIndex((nextIndex + slides.length) % slides.length);
  }

  function handleTouchStart(event) {
    touchStartX.current = event.touches[0].clientX;
  }

  function handleTouchEnd(event) {
    if (touchStartX.current === null) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX.current;
    if (deltaX > SWIPE_THRESHOLD_PX) goTo(index - 1);
    else if (deltaX < -SWIPE_THRESHOLD_PX) goTo(index + 1);
    touchStartX.current = null;
  }

  const slide = slides[index];

  return (
    <div
      className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden shadow-lg"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9]">
        {slides.map((s, i) => (
          <div
            key={s.src}
            className={`absolute inset-0 transition-opacity duration-500 ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <Image
              src={s.src}
              alt={s.alt}
              fill
              sizes="100vw"
              className="object-cover"
              priority={i === 0}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          </div>
        ))}

        {(slide.title || slide.ctaLabel) && (
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-4 pb-10 text-center sm:pb-14">
            {slide.title && (
              <h2 className="font-[family-name:var(--font-heading)] text-2xl uppercase tracking-wide text-white drop-shadow sm:text-4xl lg:text-5xl">
                {slide.title}
              </h2>
            )}
            {slide.ctaLabel && slide.ctaHref && (
              <Link
                href={slide.ctaHref}
                className="min-h-11 rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-red-700 sm:text-base"
              >
                {slide.ctaLabel}
              </Link>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => goTo(index - 1)}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-zinc-900 shadow transition-colors hover:bg-white sm:left-6"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        type="button"
        onClick={() => goTo(index + 1)}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-zinc-900 shadow transition-colors hover:bg-white sm:right-6"
      >
        <ChevronRight size={22} />
      </button>

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        {slides.map((s, i) => (
          <button
            key={s.src}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-5 bg-white" : "w-2 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
