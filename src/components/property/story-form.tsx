"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { storySchema, type StoryInput } from "@/lib/utils/validation";
import { logger } from "@/lib/utils/logger";
import type { Propiedad } from "@/lib/types/database";

interface StoryFormProps {
  property: Propiedad;
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

  async function onSubmit(values: StoryInput) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/property/${property.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seller_story: values.seller_story || null,
          description_short: values.description_short || null,
        }),
      });
      if (!res.ok) {
        toast.error("Couldn't save story.");
        return;
      }
      logger.info("story.saved", { propertyId: property.id });
      toast.success("Saved");
      router.refresh();
    } catch (err) {
      logger.error("story.save_exception", { error: err });
      toast.error("Network error.");
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
          <div className="flex justify-between text-xs text-brand-muted">
            <span>Aim for 100–500 characters.</span>
            <span>{story.length}/2000</span>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting || !isDirty}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save changes
        </Button>
      </div>
    </form>
  );
}
