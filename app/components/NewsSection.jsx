import Image from "next/image";

// Static list — swap in real clips as they're provided. `poster` is the
// thumbnail shown before the viewer presses play (required so the video file
// itself never loads until they do — see `preload="none"` below). A plain
// photo entry (no `src`/`poster` pair, just `photo`) renders as a still image
// instead of a <video> — used for real press coverage that only exists as a
// photo of the broadcast (a TV screenshot), not an actual video file.
const newsClips = [
  {
    photo: "/images/news/trending-right-now.webp",
    credit: "Featured on One PH's Inay Ko Po — “Trending Chicken Pastil”",
  },
  {
    src: "/videos/news/clip-2.mp4",
    poster: "/images/news/clip-2-poster.webp",
    credit: "Featured on [Show Name], [Date]",
  },
];

export default function NewsSection() {
  return (
    <section className="w-full bg-zinc-50 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <h2 className="text-center font-[family-name:var(--font-heading)] text-2xl uppercase tracking-wide text-zinc-900 sm:text-3xl">
          As Seen On TV
        </h2>
        <p className="mx-auto mt-2 max-w-md text-center text-sm text-zinc-600">
          Hameed&apos;s has been featured as one of Metro Manila&apos;s
          trending pastil spots.
        </p>

        <div className="mt-8 flex snap-x gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible">
          {newsClips.map((clip) => (
            <div key={clip.photo ?? clip.src} className="w-[85%] shrink-0 snap-start sm:w-auto">
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-black shadow-md">
                {clip.photo ? (
                  <Image
                    src={clip.photo}
                    alt={clip.credit}
                    fill
                    sizes="(min-width: 640px) 50vw, 85vw"
                    className="object-cover"
                  />
                ) : (
                  // preload="none" + a poster image — the actual video file
                  // only downloads once the viewer presses play, so this
                  // section never slows down initial page load.
                  <video controls preload="none" poster={clip.poster} className="h-full w-full">
                    <source src={clip.src} type="video/mp4" />
                    Your browser doesn&apos;t support embedded video.
                  </video>
                )}
              </div>
              <p className="mt-2 text-center text-xs text-zinc-500 sm:text-sm">{clip.credit}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
