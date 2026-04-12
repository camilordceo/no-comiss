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
import { StepVideo } from "./step-video";

// Step order matches the roadmap:
// Dirección → Detalles → Fotos → Video → Historia → Calendario
const STEPS = [
  { label: "Dirección", short: "1" },
  { label: "Detalles",  short: "2" },
  { label: "Fotos",     short: "3" },
  { label: "Video",     short: "4" },
  { label: "Historia",  short: "5" },
  { label: "Calendario", short: "6" },
];

export interface WizardData {
  // Step 1 — Address
  address: string;
  city: string;
  neighborhood: string;
  rentcast_data?: Record<string, unknown>;
  // Step 2 — Details
  property_type: "apartment" | "house" | "studio" | "commercial" | "land";
  price: number;
  area_m2: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  floor?: number;
  stratum?: number;
  amenities: string[];
  // Step 3 — Photos
  photos: string[];
  photo_rooms: string[];
  // Step 4 — Video
  video_url: string;
  // Step 5 — Story
  story: string;
  // Step 6 — Calendar
  calendar_setup: boolean;
}

const INITIAL_DATA: WizardData = {
  address: "",
  city: "",
  neighborhood: "",
  property_type: "apartment",
  price: 0,
  area_m2: 0,
  bedrooms: 2,
  bathrooms: 1,
  parking: 0,
  amenities: [],
  photos: [],
  photo_rooms: [],
  video_url: "",
  story: "",
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
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    setSubmitError(null);

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          user_id: userId,
          // Map internal fields to API fields
          seller_story: data.story,
          video_url: data.video_url || null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setSubmitError(json.error ?? "No se pudo crear el inmueble. Intenta de nuevo.");
        return;
      }

      if (!json.id) {
        setSubmitError("Respuesta inesperada del servidor. Intenta de nuevo.");
        return;
      }

      // Redirect to AI generation page so user immediately creates their listing copy
      router.push(`/dashboard/listings/${json.id}/generate`);
    } catch {
      setSubmitError("Error de red. Verifica tu conexión e intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  const stepProps = { data, updateData, onNext: next, onBack: back };

  return (
    <div>
      {/* Progress bar */}
      <div className="flex items-center gap-1.5 mb-8 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 flex-1 min-w-0">
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
                  "flex-1 h-0.5 transition-colors duration-200 min-w-[8px]",
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
        {step === 0 && <StepAddress {...stepProps} />}
        {step === 1 && <StepDetails {...stepProps} isFirst={false} />}
        {step === 2 && <StepPhotos {...stepProps} />}
        {step === 3 && <StepVideo {...stepProps} />}
        {step === 4 && <StepStory {...stepProps} />}
        {step === 5 && (
          <StepCalendar
            {...stepProps}
            onFinish={handleFinish}
            submitting={submitting}
          />
        )}
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="mt-4 rounded-[8px] bg-red-50 border border-red-100 px-3 py-2.5">
          <p className="text-sm text-red-600">{submitError}</p>
        </div>
      )}
    </div>
  );
}
