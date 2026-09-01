// Shared route-level loading placeholder — one implementation instead of the
// 17 near-identical bare-spinner loading.tsx files that used to exist under
// app/(app)/[slug]/*. Shaped roughly like real page content (a heading bar
// plus a few card blocks) so a route switch reads as "content is arriving"
// rather than "something might be broken."
export default function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 rounded-full bg-neutral-200" />
        <div className="h-9 w-28 rounded-full bg-neutral-200" />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-32 rounded-[22px] border border-neutral-200 bg-neutral-100" />
        ))}
      </div>
      <div className="h-48 rounded-[22px] border border-neutral-200 bg-neutral-100" />
    </div>
  );
}
