"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { storySchema, type StoryInput } from "@/lib/utils/validation";
import { logger } from "@/lib/utils/logger";
import type { Propiedad } from "@/lib/types/database";

interface StepStoryProps {
  property: Propiedad;
}

const PROMPTS = [
  "What's your favorite room and why?",
  "What will you miss most?",
  "What makes the neighborhood special?",
  "Best memory in this home?",
];

export function StepStory({ property }: StepStoryProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<StoryInput>({
    resolver: zodResolver(storySchema),
    defaultValues: {
      seller_story: property.seller_story ?? "",
      description_short: property.description_short ?? "",
    },
  });

  const story = watch("seller_story") ?? "";
  const tagline = watch("description_short") ?? "";

  async function onSubmit(values: StoryInput) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/property/${property.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seller_story: values.seller_story || null,
          description_short: values.description_short || null,
          onboarding_step: 6,
        }),
      });
      if (!res.ok) {
        toast.error("Couldn't save story.");
        return;
      }
      logger.info("wizard.step5_complete", { propertyId: property.id });
      router.push(`/dashboard/property/new?id=${property.id}&step=6`);
    } catch (err) {
      logger.error("wizard.step5_exception", { error: err });
      toast.error("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-medium tracking-tight text-brand-black md:text-3xl">
          Tell buyers your home&apos;s story
        </h1>
        <p className="text-sm text-brand-muted">
          A few honest sentences sell better than a paragraph of cliches.
        </p>
      </div>

      <div className="space-y-4 rounded-lg border border-brand-light-gray bg-white p-6">
        <div className="space-y-2">
          <Label htmlFor="description_short">Tagline (optional)</Label>
          <Input
            id="description_short"
            placeholder="A sun-drenched 3BR in the heart of the neighborhood."
            maxLength={280}
            aria-invalid={!!errors.description_short}
            {...register("description_short")}
          />
          <div className="flex justify-between text-xs text-brand-muted">
            <span>One sentence buyers see first.</span>
            <span>{tagline.length}/280</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="seller_story">Your story</Label>
          <div className="flex flex-wrap gap-2">
            {PROMPTS.map((p) => (
              <span
                key={p}
                className="rounded-full border border-brand-light-gray bg-brand-bg-alt px-3 py-1 text-xs text-brand-muted"
              >
                {p}
              </span>
            ))}
          </div>
          <Textarea
            id="seller_story"
            rows={8}
            placeholder="The morning light in the kitchen is unreal. We've hosted ten Thanksgivings here…"
            maxLength={2000}
            aria-invalid={!!errors.seller_story}
            {...register("seller_story")}
          />
          <div className="flex justify-between text-xs text-brand-muted">
            <span>Aim for 100–500 characters.</span>
            <span>{story.length}/2000</span>
          </div>
          {errors.seller_story ? (
            <p className="text-xs text-error">{errors.seller_story.message}</p>
          ) : null}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitting ? "Saving..." : "Continue"}
          {!submitting ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>
      </div>
    </form>
  );
}
