import { Video } from "lucide-react";

export function VideoEmptyState() {
  return (
    <div className="rounded-sm border border-rule bg-paper p-10 text-center">
      <Video className="mx-auto mb-4 h-10 w-10 text-text-3" aria-hidden />
      <p className="font-serif text-xl font-medium italic text-text">
        Your listing doesn&apos;t have video yet.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-text-2">
        Listings with video tours sell 2× faster. Film a 60-second walkthrough on
        your phone — we&apos;ll handle the rest.
      </p>

      <div className="mx-auto mt-6 max-w-sm space-y-1.5 text-left">
        <div className="data-key">What to film</div>
        <ul className="space-y-1 text-sm text-text-2">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 inline-block h-1 w-1 rounded-full bg-coral" aria-hidden />
            Start at the front door
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 inline-block h-1 w-1 rounded-full bg-coral" aria-hidden />
            Walk through each room slowly
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 inline-block h-1 w-1 rounded-full bg-coral" aria-hidden />
            End at your favorite spot
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 inline-block h-1 w-1 rounded-full bg-coral" aria-hidden />
            Tell buyers why you love it
          </li>
        </ul>
      </div>
    </div>
  );
}
