"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepDetails } from "./step-details";
import { StepStory } from "./step-story";
import { StepPhotos } from "./step-photos";
import { StepAddress } from "./step-address";
import { StepCalendar } from "./step-calendar";

// New order: Detalles → Historia → Fotos → Dirección → Calendario
// Reason: hook seller with savings calc + easy fields first; address last = less friction
const STEPS = [
  { label: "Tu inmueble", short: "1" },
  { label: "Historia", short: "2" },
  { label: "Fotos", short: "3" },
  { label: "Ubicación", short: "4" },
  { label: "Calendario", short: "5" },
];

export interface WizardData {
  // Step 1 — Details
  property_type: "apartment" | "house" | "studio" | "commercial" | "land";
  price: number;
  area_m2: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  floor?: number;
  stratum?: number;
  amenities: string[];
  // Step 2 — Story
  story: string;
  // Step 3 — Photos
  photos: string[];
  // Step 4 — Address
  address: string;
  city: string;
  neighborhood: string;
  rentcast_data?: Record<string, unknown>;
  // Step 5 — Calendar
  calendar_setup: boolean;
}

const INITIAL_DATA: WizardData = {
  property_type: "apartment",
  price: 0,
  area_m2: 0,
  bedrooms: 2,
  bathrooms: 1,
  parking: 0,
  amenities: [],
  story: "",
  photos: [],
  address: "",
  city: "",
  neighborhood: "",
  calendar_setup: false,
};

interface WizardProps {
  userId: string;
}

export function OnboardingWizard({ userId }: WizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(INITIAL_DATA);
  const [submitting, setSubmitting] = useState(false);

  function updateData(updates: Partial<WizardData>) {
    setData((prev) => ({ ...prev, ...updates }));
  }

  function next() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleFinish() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, user_id: userId }),
      });
      const listing = await res.json();
      if (listing.id) {
        router.push(`/dashboard/listings/${listing.id}`);
      }
    } catch {
      setSubmitting(false);
    }
  }

  const stepProps = { data, updateData, onNext: next, onBack: back };

  return (
    <div>
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-all duration-200",
                i < step
                  ? "bg-primary text-white"
                  : i === step
                  ? "bg-primary text-white ring-4 ring-primary/20"
                  : "bg-surface text-gray-400 border border-border"
              )}
            >
              {i < step ? <CheckCircle2 className="w-4 h-4" /> : s.short}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 transition-colors duration-200",
                  i < step ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step label */}
      <p className="text-xs text-gray-500 text-center mb-6">
        Paso {step + 1} de {STEPS.length} —{" "}
        <span className="font-medium text-foreground">{STEPS[step].label}</span>
      </p>

      {/* Step content */}
      <div className="bg-white rounded-[12px] border border-border shadow-sm p-6">
        {step === 0 && <StepDetails {...stepProps} isFirst />}
        {step === 1 && <StepStory {...stepProps} />}
        {step === 2 && <StepPhotos {...stepProps} />}
        {step === 3 && <StepAddress {...stepProps} />}
        {step === 4 && (
          <StepCalendar
            {...stepProps}
            onFinish={handleFinish}
            submitting={submitting}
          />
        )}
      </div>
    </div>
  );
}
