"use client";

import { useRouter } from "next/navigation";
import { WizardShell } from "@/components/onboarding/wizard-shell";
import { StepAddress } from "@/components/onboarding/step-1-address";
import { StepDetails } from "@/components/onboarding/step-2-details";
import { StepPhotos } from "@/components/onboarding/step-3-photos";
import { StepVideos } from "@/components/onboarding/step-4-videos";
import { StepStory } from "@/components/onboarding/step-5-story";
import { StepReview } from "@/components/onboarding/step-6-review";
import type { Propiedad, PropiedadMedia } from "@/lib/types/database";

interface WizardClientProps {
  step: number;
  property: Propiedad | null;
  empresaId: string | null;
  media: PropiedadMedia[];
}

export function WizardClient({ step, property, empresaId, media }: WizardClientProps) {
  const router = useRouter();

  function navigateToStep(target: number) {
    if (!property) return;
    router.push(`/dashboard/property/new?id=${property.id}&step=${target}`);
  }

  function handleBack() {
    if (step <= 1) {
      router.push("/dashboard");
      return;
    }
    if (!property) return;
    router.push(`/dashboard/property/new?id=${property.id}&step=${step - 1}`);
  }

  let content: React.ReactNode = null;
  if (step === 1) {
    content = <StepAddress property={property} />;
  } else if (step === 2 && property) {
    content = <StepDetails property={property} />;
  } else if (step === 3 && property && empresaId) {
    content = <StepPhotos property={property} empresaId={empresaId} initialMedia={media} />;
  } else if (step === 4 && property && empresaId) {
    content = <StepVideos property={property} empresaId={empresaId} initialMedia={media} />;
  } else if (step === 5 && property) {
    content = <StepStory property={property} />;
  } else if (step === 6 && property) {
    content = <StepReview property={property} media={media} onEdit={navigateToStep} />;
  } else {
    content = (
      <div className="rounded-lg border border-brand-light-gray bg-white p-8 text-center text-sm text-brand-muted">
        Couldn&apos;t load this step. Try going back to the dashboard.
      </div>
    );
  }

  return (
    <WizardShell currentStep={step} onBack={handleBack}>
      {content}
    </WizardShell>
  );
}
