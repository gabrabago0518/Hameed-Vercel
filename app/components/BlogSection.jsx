import Image from "next/image";
import Link from "next/link";

// Static placeholder data — NOT connected to Prisma. Shaped the way a real
// "posts" table/query result would be (slug, title, excerpt, image) so
// swapping this for `await prisma.blogPost.findMany()` later only means
// changing this one array into a query, not touching the JSX below it.
export const blogPosts = [
  {
    slug: "story-behind-our-pastil-recipe",
    title: "The Story Behind Our Pastil Recipe",
    excerpt:
      "Every family in Mindanao has their own way of making pastil. Here's how ours came to be, and why we've never changed it.",
    image: "/images/blog/story-behind-our-pastil-recipe.webp",
  },
  {
    slug: "why-pastil-is-trending",
    title: "Why Pastil Is Trending Right Now",
    excerpt:
      "From a home-cooked Mindanaoan staple to a Metro Manila food trend — a quick look at pastil's moment in the spotlight.",
    image: "/images/blog/why-pastil-is-trending.webp",
  },
  {
    slug: "how-we-pack-your-order",
    title: "How We Pack Every Order for Delivery",
    excerpt:
      "Banana leaf, sealed containers, and a lot of care — a behind-the-scenes look at how your food travels from our kitchen to your door.",
    image: "/images/blog/how-we-pack-your-order.webp",
  },
];

export default function BlogSection() {
  return (
    <section className="w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <h2 className="text-center font-[family-name:var(--font-heading)] text-2xl uppercase tracking-wide text-zinc-900 sm:text-3xl">
        From the Blog
      </h2>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {blogPosts.map((post) => (
          <article
            key={post.slug}
            className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
          >
            <div className="relative aspect-[16/10] w-full bg-zinc-100">
              <Image
                src={post.image}
                alt={post.title}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="font-[family-name:var(--font-heading)] text-base uppercase tracking-wide text-zinc-900">
                {post.title}
              </h3>
              <p className="mt-2 flex-1 text-sm text-zinc-600">{post.excerpt}</p>
              <Link
                href={`/blog/${post.slug}`}
                className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-red-600 hover:underline"
              >
                Read More →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
