"use client";

export default function DottedGlobe({ className }: { className?: string }) {
  const dots: { cx: number; cy: number; r: number; o: number }[] = [];
  const rows = 22;
  const cols = 34;
  const cx0 = cols / 2;
  const cy0 = rows / 2;
  const radius = Math.min(cols, rows) / 2;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const dx = col - cx0;
      const dy = (row - cy0) * (cols / rows) * 0.55;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius) {
        const falloff = 1 - dist / radius;
        dots.push({
          cx: col * 16 + 8,
          cy: row * 16 + 8,
          r: 1.4 + falloff * 1.2,
          o: 0.25 + falloff * 0.65,
        });
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${cols * 16} ${rows * 16}`}
      className={className}
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      {dots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill="currentColor" opacity={d.o} />
      ))}
    </svg>
  );
}
