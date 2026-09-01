import { CheckCircleIcon as CheckCircle, XCircleIcon as XCircle } from "@phosphor-icons/react/dist/ssr";

export interface ComparisonRow {
  feature: string;
  coachevaos: string | boolean;
  competitor: string | boolean;
  /** Highlights this row (used for the dedicated AI-features row). */
  emphasize?: boolean;
}

function Cell({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <CheckCircle className="h-4.5 w-4.5 text-accent-600" weight="fill" />
    ) : (
      <XCircle className="h-4.5 w-4.5 text-neutral-300" weight="fill" />
    );
  }
  return <span className="text-sm text-neutral-700">{value}</span>;
}

// Structured feature-by-feature data, not a prose comparison — extracts far
// more accurately for both a human skimming and an AI system building a
// citation. Accuracy matters here more than anywhere else on the site: this
// gets fact-checked by prospects who've actually used the competitor.
export default function ComparisonTable({
  competitorName,
  rows,
}: {
  competitorName: string;
  rows: ComparisonRow[];
}) {
  return (
    <div className="overflow-x-auto rounded-[16px] border border-neutral-200">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50">
            <th className="px-4 py-3 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              Feature
            </th>
            <th className="px-4 py-3 text-xs font-semibold tracking-wide text-accent-600 uppercase">
              CoachevaOS
            </th>
            <th className="px-4 py-3 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              {competitorName}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.feature}
              className={`border-b border-neutral-200 last:border-b-0 ${row.emphasize ? "bg-accent-100/40" : ""}`}
            >
              <td className="px-4 py-3 text-sm font-medium text-neutral-900">{row.feature}</td>
              <td className="px-4 py-3">
                <Cell value={row.coachevaos} />
              </td>
              <td className="px-4 py-3">
                <Cell value={row.competitor} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
