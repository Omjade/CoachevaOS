import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eyebrow } from "@/components/ui";
import { blogPosts, getBlogPost } from "@/lib/blog-posts";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Breadcrumbs from "@/components/Breadcrumbs";
import FAQAccordion from "@/components/FAQAccordion";
import { buildMetadata } from "@/lib/seo";
import { SITE_NAME, SITE_URL } from "@/lib/site";

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
  return buildMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    keywords: post.keywords,
  });
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

  // Sorted by date (not array order, which is append-order and not
  // necessarily chronological) so prev/next reflects an actual reading
  // sequence rather than an arbitrary insertion position.
  const byDate = [...blogPosts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const currentIndex = byDate.findIndex((p) => p.slug === post.slug);
  const prevPost = currentIndex > 0 ? byDate[currentIndex - 1] : null;
  const nextPost = currentIndex < byDate.length - 1 ? byDate[currentIndex + 1] : null;

  const related = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 2);

  const articleStructuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME, "@id": `${SITE_URL}/#organization` },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };

  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <SiteHeader variant="static" />
      <main className="p-3 md:p-4">
        <div className="mx-auto w-full max-w-2xl px-3 py-10 md:px-4">
          <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: JSON.stringify(articleStructuredData) }}
          />
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }, { label: post.title }]}
          />
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

          {post.faq && post.faq.length > 0 && (
            <div className="mt-14">
              <h2 className="font-heading mb-5 text-lg font-semibold text-neutral-900">
                Frequently asked questions
              </h2>
              <FAQAccordion items={post.faq} />
            </div>
          )}

          <div className="mt-14 rounded-[19px] border border-neutral-300/50 bg-white px-6 py-6 shadow-[0_10px_24px_rgba(28,29,31,0.06)]">
            <h3 className="font-heading mb-1.5 text-base font-semibold text-neutral-900">
              Run your practice from one calm dashboard
            </h3>
            <p className="mb-4 text-sm text-neutral-600">
              CoachevaOS keeps clients, leads, sessions, and follow-ups in one place, free for 14
              days.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center rounded-full bg-neutral-900 px-5 py-2.5 text-xs font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
            >
              Start free trial
            </Link>
          </div>

          {(prevPost || nextPost) && (
            <div className="mt-14 grid grid-cols-1 gap-3 border-t border-divider pt-8 sm:grid-cols-2">
              {prevPost ? (
                <Link
                  href={`/blog/${prevPost.slug}`}
                  className="rounded-[16px] border border-neutral-300/50 bg-white p-4 hover:border-accent-600"
                >
                  <p className="mb-1 text-[10px] font-semibold tracking-wide text-neutral-400 uppercase">
                    ← Previous
                  </p>
                  <p className="text-sm font-medium text-neutral-800">{prevPost.title}</p>
                </Link>
              ) : (
                <div />
              )}
              {nextPost && (
                <Link
                  href={`/blog/${nextPost.slug}`}
                  className="rounded-[16px] border border-neutral-300/50 bg-white p-4 text-right hover:border-accent-600"
                >
                  <p className="mb-1 text-[10px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Next →
                  </p>
                  <p className="text-sm font-medium text-neutral-800">{nextPost.title}</p>
                </Link>
              )}
            </div>
          )}

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
      </main>
      <SiteFooter />
    </div>
  );
}
