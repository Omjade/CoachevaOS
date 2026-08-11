import { Card } from "@/components/ui";

export default function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <div>
      <h1 className="font-heading mb-6 text-[26px] font-semibold tracking-tight text-neutral-900">
        {title}
      </h1>
      <Card>
        <p className="text-sm text-neutral-600">Built in {phase} of the implementation plan.</p>
      </Card>
    </div>
  );
}
