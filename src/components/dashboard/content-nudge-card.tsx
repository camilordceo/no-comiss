import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NUDGE_COPY, type ContentScoreResult } from "@/lib/content/score";

interface Props {
  score: ContentScoreResult;
  propertyId: string;
}

export function ContentNudgeCard({ score, propertyId }: Props) {
  if (score.total >= 80 || !score.primaryNudge) return null;
  const nudge = NUDGE_COPY[score.primaryNudge];

  return (
    <div className="border border-coral/30 bg-coral-tint p-5">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-coral-deep">
        {nudge.eyebrow}
      </div>
      <p className="mt-2 font-sans text-[13px] leading-relaxed text-text">
        {nudge.headline}
      </p>
      <Button asChild variant="spark" size="sm" className="mt-4 w-full">
        <Link href={nudge.ctaHref(propertyId)}>{nudge.ctaLabel}</Link>
      </Button>
    </div>
  );
}
