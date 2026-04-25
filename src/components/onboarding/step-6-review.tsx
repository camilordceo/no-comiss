"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { logger } from "@/lib/utils/logger";
import { formatPrice, formatSqft, titleCase } from "@/lib/utils/format";
import type { Propiedad, PropiedadMedia } from "@/lib/types/database";

interface StepReviewProps {
  property: Propiedad;
  media: PropiedadMedia[];
  onEdit: (step: number) => void;
}

export function StepReview({ property, media, onEdit }: StepReviewProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const photos = media.filter((m) => m.media_type === "photo");
  const videos = media.filter((m) => m.media_type === "video");

  async function handleFinish() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/property/${property.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_status: "ready",
          onboarding_step: 6,
        }),
      });
      if (!res.ok) {
        toast.error("Couldn't finalize. Try again.");
        return;
      }
      logger.info("wizard.completed", { propertyId: property.id });
      toast.success("Your listing is ready.");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      logger.error("wizard.finish_exception", { error: err });
      toast.error("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-medium tracking-tight text-brand-black md:text-3xl">
          Almost done. Review your listing.
        </h1>
        <p className="text-sm text-brand-muted">
          You can edit any of this from your dashboard later.
        </p>
      </div>

      <ReviewSection title="Address" onEdit={() => onEdit(1)}>
        <div className="space-y-1">
          <div>{property.address_line1}{property.address_line2 ? `, ${property.address_line2}` : ""}</div>
          <div className="text-brand-muted">
            {property.ciudad}, {property.state} {property.zip_code}
          </div>
        </div>
      </ReviewSection>

      <ReviewSection title="Details" onEdit={() => onEdit(2)}>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Stat label="Type" value={titleCase(property.tipo_inmueble ?? "—")} />
          <Stat label="Beds" value={property.habitaciones ?? "—"} />
          <Stat label="Baths" value={property.banos ?? "—"} />
          <Stat label="Size" value={formatSqft(property.sqft)} />
          <Stat label="Year" value={property.year_built ?? "—"} />
          <Stat label="Stories" value={property.stories ?? "—"} />
          <Stat label="Garage" value={property.garage_spaces ?? 0} />
          <Stat label="HOA" value={property.hoa_monthly ? `$${property.hoa_monthly}/mo` : "—"} />
        </div>
        <Separator className="my-4" />
        <Stat label="Asking price" value={formatPrice(property.precio, property.currency ?? "USD")} large />
      </ReviewSection>

      <ReviewSection title={`Photos (${photos.length})`} onEdit={() => onEdit(3)}>
        {photos.length === 0 ? (
          <div className="text-sm text-brand-muted">No photos yet.</div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {photos.slice(0, 6).map((p) => (
              <div
                key={p.id}
                className="aspect-square overflow-hidden rounded-md border border-brand-light-gray bg-brand-medium-gray"
              >
                {p.public_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.public_url} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
            ))}
          </div>
        )}
      </ReviewSection>

      <ReviewSection title={`Videos (${videos.length})`} onEdit={() => onEdit(4)}>
        <div className="text-sm text-brand-muted">
          {videos.length === 0 ? "None yet — that's OK." : `${videos.length} video uploaded.`}
        </div>
      </ReviewSection>

      <ReviewSection title="Story" onEdit={() => onEdit(5)}>
        {property.description_short ? (
          <p className="font-medium text-brand-black">{property.description_short}</p>
        ) : null}
        {property.seller_story ? (
          <p className="mt-2 whitespace-pre-line text-sm text-brand-muted">{property.seller_story}</p>
        ) : (
          <p className="text-sm text-brand-muted">No story yet — buyers love a personal touch.</p>
        )}
      </ReviewSection>

      <div className="rounded-lg border border-brand-teal bg-brand-mint/15 p-5 text-sm">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-brand-teal" aria-hidden />
          <div>
            <div className="font-medium text-brand-black">You&apos;re ready to go.</div>
            <p className="mt-1 text-brand-muted">
              We&apos;ll save your listing as <strong className="text-brand-black">Ready to publish</strong>.
              You can edit anything from your dashboard.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="button" size="lg" onClick={handleFinish} disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitting ? "Finalizing..." : "Finish setup"}
        </Button>
      </div>
    </div>
  );
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-brand-light-gray bg-white p-6 shadow-sm">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-medium text-brand-black">{title}</h2>
        <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="h-4 w-4" /> Edit
        </Button>
      </header>
      <div className="text-sm text-brand-black">{children}</div>
    </section>
  );
}

function Stat({
  label,
  value,
  large,
}: {
  label: string;
  value: string | number;
  large?: boolean;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-brand-muted">{label}</div>
      <div className={large ? "mt-1 text-xl font-medium text-brand-black" : "mt-1 text-sm text-brand-black"}>
        {value}
      </div>
    </div>
  );
}
