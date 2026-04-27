import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { NUDGE_COPY, nextScoreTarget, type ContentScoreResult } from "@/lib/content/score";

interface Props {
  score: ContentScoreResult;
  propertyId: string | null;
}

export function ContentScoreTile({ score, propertyId }: Props) {
  const { target, deltaLabel } = nextScoreTarget(score.total);
  const nudge = score.primaryNudge ? NUDGE_COPY[score.primaryNudge] : null;
  const detail = nudge ? nudge.headline : deltaLabel;

  return (
    <div className="stat-tile">
      <div className="flex items-center justify-between">
        <div className="data-key">Content score</div>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-3">
          / 100
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="stat-value text-3xl">{score.total}</div>
        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-3">
          → {target}
        </div>
      </div>
      <p className="mt-2 text-xs text-text-3">{detail}</p>
      <div
        className="mt-3 h-1 w-full overflow-hidden rounded-sm bg-crema-2"
        aria-hidden
      >
        <div
          className={cn(
            "h-full transition-all duration-300",
            score.total >= 80 ? "bg-coral" : "bg-espresso",
          )}
          style={{ width: `${Math.max(2, Math.min(100, score.total))}%` }}
        />
      </div>
      {nudge && propertyId ? (
        <Link
          href={nudge.ctaHref(propertyId)}
          className="mt-3 inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-coral transition-colors hover:text-coral-deep"
        >
          {nudge.ctaLabel} <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}
