import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";

import { requireDashboardSession } from "@/lib/hooks/use-session";
import { Button } from "@/components/ui/button";
import { ListingForm } from "./listing-form";

export const dynamic = "force-dynamic";

export default async function NewListingPage() {
  const session = await requireDashboardSession();

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-text-3 transition-colors hover:text-text"
        >
          <ArrowLeft className="h-3 w-3" aria-hidden />
          Back to terminal
        </Link>
        <div className="mt-4">
          <div className="eyebrow eyebrow-coral mb-3">New listing</div>
          <h1 className="font-serif text-[clamp(2rem,5vw,2.75rem)] font-medium leading-tight tracking-[-0.01em] text-text">
            <span className="italic">Let&apos;s list your home.</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-text-2 md:text-base">
            Five minutes of typing. Our AI takes it from there — copy, ads,
            screening, the whole thing.
          </p>
        </div>
      </div>

      {session.profile.empresa_id ? (
        <ListingForm empresaId={session.profile.empresa_id} />
      ) : (
        <div className="space-y-4 rounded-sm border border-coral/40 bg-coral-tint p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-coral-deep" aria-hidden />
            <div className="space-y-3">
              <h2 className="font-serif text-xl font-medium text-text">
                Your account isn&apos;t linked to a workspace yet.
              </h2>
              <p className="text-sm text-text-2">
                The auto-bootstrap couldn&apos;t finish setting up your workspace.
                Run <code className="rounded-sm bg-ivory px-1.5 py-0.5 font-mono text-xs">supabase/bootstrap-add-only.sql</code>
                {" "}in the Supabase SQL editor and refresh.
              </p>
              <Button asChild size="sm" variant="ghost">
                <Link href="/dashboard">Back to terminal</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
