"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { detailsSchema, type DetailsInput, PROPERTY_TYPES } from "@/lib/utils/validation";
import { logger } from "@/lib/utils/logger";
import type { Propiedad, PropertyType } from "@/lib/types/database";

interface StepDetailsProps {
  property: Propiedad;
}

export function StepDetails({ property }: StepDetailsProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DetailsInput>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      tipo_inmueble: (property.tipo_inmueble as DetailsInput["tipo_inmueble"]) ?? "single_family",
      habitaciones: property.habitaciones ?? 3,
      banos: property.banos ?? 2,
      sqft: property.sqft ?? 1500,
      lot_sqft: property.lot_sqft ?? null,
      year_built: property.year_built ?? null,
      stories: property.stories ?? 1,
      garage_spaces: property.garage_spaces ?? 0,
      hoa_monthly: property.hoa_monthly ?? null,
      precio: property.precio ?? 500000,
    },
  });

  const tipoInmuebleValue = watch("tipo_inmueble");
  const precioValue = watch("precio");
  const hoaValue = watch("hoa_monthly");

  async function onSubmit(values: DetailsInput) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/property/${property.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, onboarding_step: 3 }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        logger.warn("wizard.step2_failed", { status: res.status, data });
        toast.error("Couldn't save details.");
        return;
      }
      logger.info("wizard.step2_complete", { propertyId: property.id });
      router.push(`/dashboard/property/new?id=${property.id}&step=3`);
    } catch (err) {
      logger.error("wizard.step2_exception", { error: err });
      toast.error("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-medium tracking-tight text-brand-black md:text-3xl">
          Tell us about your home
        </h1>
        <p className="text-sm text-brand-muted">A few quick details. You can edit later.</p>
      </div>

      <div className="space-y-4 rounded-lg border border-brand-light-gray bg-white p-6">
        <div className="space-y-2">
          <Label htmlFor="tipo_inmueble">Property type</Label>
          <Select
            value={tipoInmuebleValue}
            onValueChange={(v) =>
              setValue("tipo_inmueble", v as PropertyType, { shouldValidate: true })
            }
          >
            <SelectTrigger id="tipo_inmueble">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField id="habitaciones" label="Bedrooms" min={0} reg={register("habitaciones")} error={errors.habitaciones?.message} />
          <NumberField id="banos" label="Bathrooms" min={0} step="0.5" reg={register("banos")} error={errors.banos?.message} />
          <NumberField id="sqft" label="Living area (sqft)" min={100} reg={register("sqft")} error={errors.sqft?.message} />
          <NumberField id="lot_sqft" label="Lot size (sqft, optional)" min={0} reg={register("lot_sqft")} error={errors.lot_sqft?.message} />
          <NumberField id="year_built" label="Year built (optional)" min={1700} reg={register("year_built")} error={errors.year_built?.message} />
          <NumberField id="stories" label="Stories" min={1} max={10} reg={register("stories")} error={errors.stories?.message} />
          <NumberField id="garage_spaces" label="Garage spaces" min={0} reg={register("garage_spaces")} error={errors.garage_spaces?.message} />
          <div className="space-y-2">
            <Label htmlFor="hoa_monthly">HOA $/month (optional)</Label>
            <CurrencyInput
              id="hoa_monthly"
              value={hoaValue ?? null}
              onChange={(v) =>
                setValue("hoa_monthly", v as DetailsInput["hoa_monthly"], { shouldValidate: true })
              }
              placeholder="0"
              aria-invalid={!!errors.hoa_monthly}
            />
            {errors.hoa_monthly ? (
              <p className="text-xs text-error">{errors.hoa_monthly.message}</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="precio">Asking price (USD)</Label>
          <CurrencyInput
            id="precio"
            value={precioValue ?? null}
            onChange={(v) =>
              setValue("precio", (v ?? 0) as DetailsInput["precio"], { shouldValidate: true })
            }
            placeholder="500,000"
            aria-invalid={!!errors.precio}
          />
          {errors.precio ? <p className="text-xs text-error">{errors.precio.message}</p> : null}
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

function NumberField({
  id,
  label,
  reg,
  error,
  min,
  max,
  step,
}: {
  id: string;
  label: string;
  reg: UseFormRegisterReturn;
  error?: string;
  min?: number;
  max?: number;
  step?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step ?? "1"}
        aria-invalid={!!error}
        {...reg}
      />
      {error ? <p className="text-xs text-error">{error}</p> : null}
    </div>
  );
}
