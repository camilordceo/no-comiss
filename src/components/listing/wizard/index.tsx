"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { StepAddress } from "./step-address";
import { StepDetails } from "./step-details";
import { StepPhotos } from "./step-photos";
import { StepVideo } from "./step-video";
import { StepStory } from "./step-story";
import { StepPricing } from "./step-pricing";
import type { WizardData } from "./types";
import { INITIAL_WIZARD_DATA } from "./types";

const STEPS = [
  { label: "Address",  short: "1" },
  { label: "Details",  short: "2" },
  { label: "Photos",   short: "3" },
  { label: "Video",    short: "4" },
  { label: "Story",    short: "5" },
  { label: "Pricing",  short: "6" },
];

interface ListingWizardProps {
  userId: string;
}

export function ListingWizard({ userId }: ListingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(INITIAL_WIZARD_DATA);
  const [submitting, setSubmitting] = useState(false);

  function update(updates: Partial<WizardData>) {
    setData((prev) => ({ ...prev, ...updates }));
  }

  function next() { setStep((s) => Math.min(s + 1, STEPS.length - 1)); }
  function back() { setStep((s) => Math.max(s - 1, 0)); }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const heroIdx = data.photos.findIndex((p) => p.isHero);
      const photoUrls = data.photos.filter((p) => !p.uploading && !p.error).map((p) => p.url);
      const photoRooms = data.photos.filter((p) => !p.uploading && !p.error).map((p) => p.room);

      const payload = {
        property_type: data.propertyType,
        address: data.address,
        city: data.rentcastData?.city ?? "",
        state: data.rentcastData?.state ?? null,
        zip_code: data.rentcastData?.zipCode ?? null,
        price: data.askingPrice,
        sqft: data.sqft || null,
        lot_sqft: data.lotSqft || null,
        year_built: data.yearBuilt || null,
        stories: data.stories || null,
        garage_spaces: data.garageSpaces || null,
        hoa_monthly: data.hoaMonthly || null,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        photos: photoUrls,
        photo_rooms: photoRooms,
        hero_photo_idx: heroIdx >= 0 ? heroIdx : 0,
        video_url: data.videoUrl || null,
        seller_story: data.story,
        rentcast_data: data.rentcastData ?? null,
      };

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Failed to create listing");
      }

      const { id } = await res.json();
      // Navigate to AI generator
      router.push(`/dashboard/listings/${id}/generate`);
    } catch (err) {
      console.error("Listing creation failed:", err);
      alert("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  const progressPct = ((step + 1) / STEPS.length) * 100;

  return (
    <div>
      {/* Progress */}
      <div className="mb-8">
        {/* Step labels */}
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((s, i) => (
            <div
              key={i}
              className={cn(
                "flex flex-col items-center gap-1 flex-1",
                i < STEPS.length - 1 && "relative"
              )}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all duration-200 z-10",
                  i < step
                    ? "bg-primary border-primary text-white"
                    : i === step
                    ? "border-primary text-primary bg-white"
                    : "border-border text-gray-400 bg-white"
                )}
              >
                {s.short}
              </div>
              <span className={cn(
                "text-[10px] font-medium hidden sm:block",
                i === step ? "text-primary" : i < step ? "text-gray-600" : "text-gray-400"
              )}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-[#e5e5e5] rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="min-h-[400px]">
        {step === 0 && (
          <StepAddress data={data} onUpdate={update} onNext={next} />
        )}
        {step === 1 && (
          <StepDetails data={data} onUpdate={update} onNext={next} onBack={back} />
        )}
        {step === 2 && (
          <StepPhotos data={data} userId={userId} onUpdate={update} onNext={next} onBack={back} />
        )}
        {step === 3 && (
          <StepVideo data={data} userId={userId} onUpdate={update} onNext={next} onBack={back} />
        )}
        {step === 4 && (
          <StepStory data={data} onUpdate={update} onNext={next} onBack={back} />
        )}
        {step === 5 && (
          <StepPricing data={data} onUpdate={update} onSubmit={handleSubmit} onBack={back} submitting={submitting} />
        )}
      </div>

      {/* Save & exit */}
      <div className="mt-6 pt-4 border-t border-border">
        <button
          type="button"
          onClick={() => router.push("/dashboard/listings")}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Save and finish later
        </button>
      </div>
    </div>
  );
}
