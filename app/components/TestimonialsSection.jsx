import { Star } from "lucide-react";

// Placeholder testimonials, not real customer reviews — replace with actual
// feedback before this goes live. Shaped like a real data array (id/name/
// quote/rating) so that swap is just replacing this array, same pattern as
// BlogSection's blogPosts.
const testimonials = [
  {
    id: 1,
    name: "Ana R.",
    quote: "Sobrang sarap ng pastil! Fast pa ang delivery, laging mainit pagdating.",
    rating: 5,
  },
  {
    id: 2,
    name: "Mark D.",
    quote: "Chicken Sisig is a must-try — naging paborito na namin ito sa bahay every payday.",
    rating: 5,
  },
  {
    id: 3,
    name: "Joy P.",
    quote: "Consistent yung taste every order. Sulit na sulit, worth it talaga!",
    rating: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section className="w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <h2 className="text-center font-[family-name:var(--font-heading)] text-2xl uppercase tracking-wide text-zinc-900 sm:text-3xl">
        What Our Customers Say
      </h2>
      <p className="mx-auto mt-2 max-w-md text-center text-sm text-zinc-600">
        Real feedback from real orders.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
        {testimonials.map((t) => (
          <div
            key={t.id}
            className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <div className="flex gap-0.5 text-amber-400">
              {Array.from({ length: t.rating }).map((_, i) => (
                <Star key={i} size={16} fill="currentColor" strokeWidth={0} />
              ))}
            </div>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-700">
              &ldquo;{t.quote}&rdquo;
            </p>
            <p className="mt-4 text-sm font-semibold text-zinc-900">{t.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
