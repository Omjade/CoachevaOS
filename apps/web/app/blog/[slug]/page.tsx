import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleWavyCheckIcon as CircleWavyCheck } from "@phosphor-icons/react/dist/ssr";
import { Eyebrow } from "@/components/ui";
import { blogPosts, getBlogPost } from "@/lib/blog-posts";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const related = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <div className="p-3 md:p-4">
        <div className="mx-auto w-full max-w-2xl px-3 py-16 md:px-4">
          <Link href="/" className="mb-8 inline-flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-neutral-100">
              <CircleWavyCheck className="h-3.5 w-3.5" weight="fill" />
            </span>
            <span className="font-heading text-sm font-bold text-neutral-900">CoachevaOS</span>
          </Link>

          <Eyebrow className="mb-4">{post.tag}</Eyebrow>
          <h1 className="font-heading mb-3 text-[32px] font-semibold tracking-tight text-neutral-900 md:text-[40px]">
            {post.title}
          </h1>
          <p className="mb-10 text-xs text-neutral-500">
            {formattedDate} · {post.readTime}
          </p>

          <div className="flex flex-col gap-8">
            {post.sections.map((s) => (
              <div key={s.heading}>
                <h2 className="font-heading mb-3 text-lg font-semibold text-neutral-900">
                  {s.heading}
                </h2>
                <div className="flex flex-col gap-3">
                  {s.paragraphs.map((p, i) => (
                    <p key={i} className="text-sm leading-relaxed text-neutral-600">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 rounded-[19px] border border-neutral-300/50 bg-white px-6 py-6 shadow-[0_10px_24px_rgba(28,29,31,0.06)]">
            <h3 className="font-heading mb-1.5 text-base font-semibold text-neutral-900">
              Run your practice from one calm dashboard
            </h3>
            <p className="mb-4 text-sm text-neutral-600">
              CoachevaOS keeps clients, leads, sessions, and follow-ups in one place — free for 14
              days.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center rounded-full bg-neutral-900 px-5 py-2.5 text-xs font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
            >
              Start free trial
            </Link>
          </div>

          {related.length > 0 && (
            <div className="mt-14">
              <p className="mb-4 text-xs font-medium tracking-wide text-neutral-500 uppercase">
                More from the blog
              </p>
              <div className="flex flex-col gap-3">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/blog/${r.slug}`}
                    className="text-sm font-medium text-neutral-800 hover:text-accent-600"
                  >
                    {r.title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-14 flex gap-5 border-t border-divider pt-6 text-xs text-neutral-500">
            <Link href="/blog" className="hover:text-accent-600">
              All posts
            </Link>
            <Link href="/privacy" className="hover:text-accent-600">
              Privacy
            </Link>
            <Link href="/" className="hover:text-accent-600">
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
