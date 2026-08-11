import type { Metadata } from "next";
import Link from "next/link";
import {
  CircleWavyCheckIcon as CircleWavyCheck,
  ArrowRightIcon as ArrowRight,
} from "@phosphor-icons/react/dist/ssr";
import { Eyebrow } from "@/components/ui";
import { blogPosts } from "@/lib/blog-posts";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Practical guidance for independent coaches — pricing, onboarding, retention, lead follow-up, and running a sustainable practice.",
};

export default function BlogIndexPage() {
  return (
    <div className="flex flex-1 flex-col bg-neutral-100">
      <div className="p-3 md:p-4">
        <div className="mx-auto w-full max-w-4xl px-3 py-16 md:px-4">
          <Link href="/" className="mb-8 inline-flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-neutral-100">
              <CircleWavyCheck className="h-3.5 w-3.5" weight="fill" />
            </span>
            <span className="font-heading text-sm font-bold text-neutral-900">CoachevaOS</span>
          </Link>

          <Eyebrow className="mb-4">The blog</Eyebrow>
          <h1 className="font-heading mb-3 text-[36px] font-semibold tracking-tight text-neutral-900 md:text-[44px]">
            Practical guidance for independent coaches
          </h1>
          <p className="mb-12 max-w-lg text-sm leading-relaxed text-neutral-600">
            Pricing, onboarding, retention, and the operational habits that keep a solo coaching
            practice steady — no fluff, no gated &ldquo;free&rdquo; ebook required.
          </p>

          <div className="flex flex-col gap-4">
            {blogPosts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
                <article className="rounded-[19px] border border-neutral-300/50 bg-white px-6 py-6 shadow-[0_10px_24px_rgba(28,29,31,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(28,29,31,0.1)]">
                  <div className="mb-2 flex items-center gap-2 text-[10px] font-medium tracking-wide text-accent-600 uppercase">
                    <span>{post.tag}</span>
                    <span className="text-neutral-300">•</span>
                    <span className="text-neutral-400">{post.readTime}</span>
                  </div>
                  <h2 className="font-heading mb-1.5 flex items-center gap-2 text-lg font-semibold text-neutral-900">
                    {post.title}
                    <ArrowRight className="h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-accent-600" />
                  </h2>
                  <p className="text-sm leading-relaxed text-neutral-600">{post.description}</p>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
