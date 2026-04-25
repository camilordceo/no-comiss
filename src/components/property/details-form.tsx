"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

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
import {
  addressSchema,
  detailsSchema,
  US_STATES,
  PROPERTY_TYPES,
} from "@/lib/utils/validation";
import { logger } from "@/lib/utils/logger";
import { z } from "zod";
import type { Propiedad, PropertyType } from "@/lib/types/database";

const formSchema = addressSchema.merge(detailsSchema);
type FormValues = z.infer<typeof formSchema>;

interface DetailsFormProps {
  property: Propiedad;
}

export function DetailsForm({ property }: DetailsFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address_line1: property.address_line1 ?? "",
      address_line2: property.address_line2 ?? "",
      ciudad: property.ciudad ?? "",
      state: (property.state as FormValues["state"]) ?? undefined,
      zip_code: property.zip_code ?? "",
      tipo_inmueble: (property.tipo_inmueble as FormValues["tipo_inmueble"]) ?? "single_family",
      habitaciones: property.habitaciones ?? 0,
      banos: property.banos ?? 0,
      sqft: property.sqft ?? 0,
      lot_sqft: property.lot_sqft ?? null,
      year_built: property.year_built ?? null,
      stories: property.stories ?? 1,
      garage_spaces: property.garage_spaces ?? 0,
      hoa_monthly: property.hoa_monthly ?? null,
      precio: property.precio ?? 0,
    },
  });

  const stateValue = watch("state");
  const tipoValue = watch("tipo_inmueble");

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/property/${property.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        logger.warn("details.save_failed", { status: res.status, data });
        toast.error("Couldn't save changes.");
        return;
      }
      logger.info("details.saved", { propertyId: property.id });
      toast.success("Saved");
      router.refresh();
    } catch (err) {
      logger.error("details.save_exception", { error: err });
      toast.error("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <section className="space-y-4 rounded-lg border border-brand-light-gray bg-white p-6">
        <h2 className="text-lg font-medium text-brand-black">Address</h2>

        <div className="space-y-2">
          <Label htmlFor="address_line1">Street address</Label>
          <Input id="address_line1" {...register("address_line1")} aria-invalid={!!errors.address_line1} />
          {errors.address_line1 ? <p className="text-xs text-error">{errors.address_line1.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address_line2">Apartment / suite</Label>
          <Input id="address_line2" {...register("address_line2")} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="ciudad">City</Label>
            <Input id="ciudad" {...register("ciudad")} aria-invalid={!!errors.ciudad} />
            {errors.ciudad ? <p className="text-xs text-error">{errors.ciudad.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Select
              value={stateValue}
              onValueChange={(v) =>
                setValue("state", v as FormValues["state"], { shouldDirty: true, shouldValidate: true })
              }
            >
              <SelectTrigger id="state">
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
          <Input id="zip_code" inputMode="numeric" {...register("zip_code")} aria-invalid={!!errors.zip_code} />
          {errors.zip_code ? <p className="text-xs text-error">{errors.zip_code.message}</p> : null}
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-brand-light-gray bg-white p-6">
        <h2 className="text-lg font-medium text-brand-black">Details</h2>

        <div className="space-y-2">
          <Label htmlFor="tipo_inmueble">Property type</Label>
          <Select
            value={tipoValue}
            onValueChange={(v) =>
              setValue("tipo_inmueble", v as PropertyType, { shouldDirty: true, shouldValidate: true })
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
          <NumberField id="lot_sqft" label="Lot size (sqft)" min={0} reg={register("lot_sqft")} error={errors.lot_sqft?.message} />
          <NumberField id="year_built" label="Year built" min={1700} reg={register("year_built")} error={errors.year_built?.message} />
          <NumberField id="stories" label="Stories" min={1} max={10} reg={register("stories")} error={errors.stories?.message} />
          <NumberField id="garage_spaces" label="Garage spaces" min={0} reg={register("garage_spaces")} error={errors.garage_spaces?.message} />
          <NumberField id="hoa_monthly" label="HOA $/month" min={0} reg={register("hoa_monthly")} error={errors.hoa_monthly?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="precio">Asking price (USD)</Label>
          <Input id="precio" type="number" min={1000} {...register("precio")} aria-invalid={!!errors.precio} />
          {errors.precio ? <p className="text-xs text-error">{errors.precio.message}</p> : null}
        </div>
      </section>

      <div className="sticky bottom-4 flex justify-end gap-2">
        <Button type="submit" disabled={submitting || !isDirty}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save changes
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
      <Input id={id} type="number" inputMode="decimal" min={min} max={max} step={step ?? "1"} aria-invalid={!!error} {...reg} />
      {error ? <p className="text-xs text-error">{error}</p> : null}
    </div>
  );
}
