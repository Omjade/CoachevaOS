// A self-contained 40-70 word "what is X" block placed immediately after a
// page's H1 — the single block most likely to get lifted verbatim into a
// Google AI Overview or a ChatGPT/Perplexity citation, so the copy passed in
// must make complete sense with zero surrounding page context (no "as
// mentioned above," no pronouns without an antecedent in the same sentence).
export default function DirectAnswer({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-8 max-w-[640px] text-[15px] leading-relaxed text-neutral-700 md:text-base">
      {children}
    </p>
  );
}
