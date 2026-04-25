"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Check, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { storySchema, type StoryInput } from "@/lib/utils/validation";
import { useAutoSave } from "@/lib/hooks/use-auto-save";
import { logger } from "@/lib/utils/logger";
import { cn } from "@/lib/utils/cn";
import type { Propiedad } from "@/lib/types/database";

interface StoryFormProps {
  property: Propiedad;
}

function counterTone(length: number): string {
  if (length >= 1000) return "text-error";
  if (length >= 800) return "text-warning";
  if (length >= 200) return "text-brand-teal";
  return "text-brand-muted";
}

export function StoryForm({ property }: StoryFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<StoryInput>({
    resolver: zodResolver(storySchema),
    defaultValues: {
      seller_story: property.seller_story ?? "",
      description_short: property.description_short ?? "",
    },
  });

  const story = watch("seller_story") ?? "";
  const tagline = watch("description_short") ?? "";
  const watched = watch();

  async function persist(values: StoryInput) {
    const res = await fetch(`/api/property/${property.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seller_story: values.seller_story || null,
        description_short: values.description_short || null,
      }),
    });
    if (!res.ok) {
      logger.warn("story.save_failed", { propertyId: property.id, status: res.status });
      throw new Error("save_failed");
    }
    logger.info("story.saved", { propertyId: property.id });
  }

  const autoSaveStatus = useAutoSave({
    values: watched,
    enabled: isDirty,
    delay: 1500,
    save: async (v) => {
      const parsed = storySchema.safeParse(v);
      if (!parsed.success) return;
      await persist(parsed.data);
      router.refresh();
    },
  });

  async function onSubmit(values: StoryInput) {
    setSubmitting(true);
    try {
      await persist(values);
      toast.success("Saved");
      router.refresh();
    } catch (err) {
      logger.error("story.save_exception", { error: err });
      toast.error("Couldn't save story.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <section className="space-y-4 rounded-lg border border-brand-light-gray bg-white p-6">
        <div className="space-y-2">
          <Label htmlFor="description_short">Tagline</Label>
          <Input
            id="description_short"
            placeholder="A sun-drenched 3BR in the heart of the neighborhood."
            maxLength={280}
            {...register("description_short")}
          />
          <div className="flex justify-between text-xs text-brand-muted">
            <span>One line buyers see first.</span>
            <span>{tagline.length}/280</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="seller_story">Your story</Label>
          <Textarea
            id="seller_story"
            rows={10}
            maxLength={2000}
            {...register("seller_story")}
            aria-invalid={!!errors.seller_story}
          />
          <div className="flex justify-between text-xs">
            <span className="text-brand-muted">Aim for 200–500 characters.</span>
            <span className={cn("font-medium", counterTone(story.length))}>
              {story.length}/2000
            </span>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        <AutoSaveBadge status={autoSaveStatus} />
        <Button type="submit" disabled={submitting || !isDirty}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save changes
        </Button>
      </div>
    </form>
  );
}

function AutoSaveBadge({ status }: { status: ReturnType<typeof useAutoSave> }) {
  if (status === "idle") return null;
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-brand-muted">
        <Loader2 className="h-3 w-3 animate-spin" /> Saving…
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-brand-teal">
        <Check className="h-3 w-3" strokeWidth={3} /> Saved
      </span>
    );
  }
  return <span className="text-xs text-error">Couldn&apos;t save</span>;
}
