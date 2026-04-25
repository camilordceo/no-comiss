"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ONBOARDING_STEPS } from "@/lib/types/app";
import { cn } from "@/lib/utils/cn";

interface WizardShellProps {
  currentStep: number;
  children: React.ReactNode;
  onBack?: () => void;
  saveExitHref?: string;
  showSaveExit?: boolean;
}

export function WizardShell({
  currentStep,
  children,
  onBack,
  saveExitHref = "/dashboard",
  showSaveExit = true,
}: WizardShellProps) {
  const totalSteps = ONBOARDING_STEPS.length;
  const stepInfo = ONBOARDING_STEPS.find((s) => s.id === currentStep) ?? ONBOARDING_STEPS[0];
  const progress = Math.max(0, Math.min(100, (currentStep / totalSteps) * 100));

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            {onBack ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onBack}
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            ) : null}
            <span className="font-medium text-brand-black">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-brand-muted">· {stepInfo.label}</span>
          </div>
          {showSaveExit ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={saveExitHref}>Save & finish later</Link>
            </Button>
          ) : null}
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-brand-medium-gray"
          role="progressbar"
          aria-valuenow={currentStep}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
        >
          <div className={cn("h-full progress-fill")} style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div>{children}</div>
    </div>
  );
}
