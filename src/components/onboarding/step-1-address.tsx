"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { addressSchema, type AddressInput, US_STATES } from "@/lib/utils/validation";
import { logger } from "@/lib/utils/logger";
import type { Propiedad } from "@/lib/types/database";

interface StepAddressProps {
  property: Propiedad | null;
}

export function StepAddress({ property }: StepAddressProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      address_line1: property?.address_line1 ?? "",
      address_line2: property?.address_line2 ?? "",
      ciudad: property?.ciudad ?? "",
      state: (property?.state as AddressInput["state"]) ?? undefined,
      zip_code: property?.zip_code ?? "",
    },
  });

  const stateValue = watch("state");

  async function onSubmit(values: AddressInput) {
    setSubmitting(true);
    try {
      const url = property ? `/api/property/${property.id}` : "/api/property";
      const method = property ? "PATCH" : "POST";
      const body = property
        ? { ...values, onboarding_step: 2 }
        : values;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        logger.warn("wizard.step1_failed", { status: res.status, data });
        toast.error("Couldn't save address. Try again.");
        return;
      }
      const propertyId = data.property.id;
      logger.info("wizard.step1_complete", { propertyId });
      router.push(`/dashboard/property/new?id=${propertyId}&step=2`);
    } catch (err) {
      logger.error("wizard.step1_exception", { error: err });
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-medium tracking-tight text-brand-black md:text-3xl">
          What&apos;s your home address?
        </h1>
        <p className="text-sm text-brand-muted">
          We need this to set up your listing. It won&apos;t be public until you&apos;re ready.
        </p>
      </div>

      <div className="space-y-4 rounded-lg border border-brand-light-gray bg-white p-6">
        <div className="space-y-2">
          <Label htmlFor="address_line1">Street address</Label>
          <Input
            id="address_line1"
            placeholder="123 Main St"
            autoComplete="address-line1"
            aria-invalid={!!errors.address_line1}
            {...register("address_line1")}
          />
          {errors.address_line1 ? (
            <p className="text-xs text-error">{errors.address_line1.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address_line2">Apartment / suite (optional)</Label>
          <Input
            id="address_line2"
            placeholder="Apt 4B"
            autoComplete="address-line2"
            {...register("address_line2")}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="ciudad">City</Label>
            <Input
              id="ciudad"
              placeholder="Miami"
              autoComplete="address-level2"
              aria-invalid={!!errors.ciudad}
              {...register("ciudad")}
            />
            {errors.ciudad ? <p className="text-xs text-error">{errors.ciudad.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Select
              value={stateValue}
              onValueChange={(v) => setValue("state", v as AddressInput["state"], { shouldValidate: true })}
            >
              <SelectTrigger id="state" aria-invalid={!!errors.state}>
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.state ? <p className="text-xs text-error">{errors.state.message}</p> : null}
          </div>
        </div>

        <div className="space-y-2 sm:max-w-[200px]">
          <Label htmlFor="zip_code">ZIP code</Label>
          <Input
            id="zip_code"
            placeholder="33101"
            autoComplete="postal-code"
            inputMode="numeric"
            aria-invalid={!!errors.zip_code}
            {...register("zip_code")}
          />
          {errors.zip_code ? <p className="text-xs text-error">{errors.zip_code.message}</p> : null}
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
