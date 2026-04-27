"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BUDGET_RANGES,
  CONTINGENCY_OPTIONS,
  FINANCING_OPTIONS,
  PRE_APPROVED_OPTIONS,
  TIMELINES,
  TIME_SLOTS,
  inquirySchema,
  offerSchema,
  showingSchema,
  type InquiryInput,
  type OfferInput,
  type ShowingInput,
} from "@/lib/utils/validation";
import { logger } from "@/lib/utils/logger";
import { cn } from "@/lib/utils/cn";

type Mode = "inquiry" | "showing" | "offer";

interface Props {
  propertySlug: string;
  defaultMode?: Mode;
  origen?: "mini_site" | "direct_form" | "shared_link";
  className?: string;
}

const MODE_LABEL: Record<Mode, string> = {
  inquiry: "I'm interested",
  showing: "Schedule a showing",
  offer: "Make an offer",
};

const MODE_EYEBROW: Record<Mode, string> = {
  inquiry: "Interested in this home?",
  showing: "Schedule a showing",
  offer: "Submit an offer",
};

export function ContactForm({
  propertySlug,
  defaultMode = "inquiry",
  origen = "mini_site",
  className,
}: Props) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [submittedAs, setSubmittedAs] = useState<Mode | null>(null);
  const [utm, setUtm] = useState<{ source?: string; medium?: string; campaign?: string }>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setUtm({
      source: params.get("utm_source") ?? undefined,
      medium: params.get("utm_medium") ?? undefined,
      campaign: params.get("utm_campaign") ?? undefined,
    });
  }, []);

  if (submittedAs) {
    return (
      <div className={cn("border border-rule bg-ivory p-7 text-center", className)}>
        <div className="mx-auto mb-4 inline-flex h-10 w-10 items-center justify-center rounded-sm bg-coral text-white">
          <Check className="h-5 w-5" aria-hidden />
        </div>
        <h3 className="font-serif text-2xl font-medium leading-tight text-text">
          {submittedAs === "offer"
            ? "Offer received."
            : submittedAs === "showing"
              ? "Showing requested."
              : "Inquiry sent."}
        </h3>
        <p className="mt-2 text-sm text-text-2">
          {submittedAs === "offer"
            ? "The homeowner will review and respond. No agent in the middle."
            : submittedAs === "showing"
              ? "The homeowner will confirm your showing within 24 hours."
              : "The homeowner will get back to you shortly. No agent in the middle."}
        </p>
        <button
          type="button"
          onClick={() => setSubmittedAs(null)}
          className="mt-5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text-3 transition-colors hover:text-text"
        >
          Send another →
        </button>
      </div>
    );
  }

  return (
    <div className={cn("border border-rule bg-ivory", className)}>
      <div role="tablist" className="flex border-b border-rule">
        {(Object.keys(MODE_LABEL) as Mode[]).map((m) => (
          <button
            key={m}
            role="tab"
            type="button"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              "relative flex-1 px-3 py-3 text-center font-mono text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors",
              mode === m ? "text-text" : "text-text-3 hover:text-text",
              "after:absolute after:inset-x-0 after:-bottom-px after:h-[3px]",
              mode === m ? "after:bg-coral" : "after:bg-transparent",
            )}
          >
            {MODE_LABEL[m]}
          </button>
        ))}
      </div>

      <div className="space-y-6 p-6 md:p-7">
        <div className="eyebrow eyebrow-coral">{MODE_EYEBROW[mode]}</div>

        {mode === "inquiry" ? (
          <InquiryForm
            propertySlug={propertySlug}
            origen={origen}
            utm={utm}
            onSuccess={() => setSubmittedAs("inquiry")}
          />
        ) : null}
        {mode === "showing" ? (
          <ShowingForm
            propertySlug={propertySlug}
            origen={origen}
            utm={utm}
            onSuccess={() => setSubmittedAs("showing")}
          />
        ) : null}
        {mode === "offer" ? (
          <OfferForm
            propertySlug={propertySlug}
            origen={origen}
            utm={utm}
            onSuccess={() => setSubmittedAs("offer")}
          />
        ) : null}
      </div>
    </div>
  );
}

interface SubFormProps {
  propertySlug: string;
  origen: Props["origen"];
  utm: { source?: string; medium?: string; campaign?: string };
  onSuccess: () => void;
}

async function submitLead(payload: unknown): Promise<void> {
  const res = await fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error || "Couldn't send. Try again.");
  }
}

/* ─── Inquiry ─── */

function InquiryForm({ propertySlug, origen, utm, onSuccess }: SubFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<InquiryInput>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      form_type: "inquiry",
      property_slug: propertySlug,
      origen,
      nombre: "",
      email: "",
      telefono: "",
      pre_approved: false,
      budget_range: "",
      timeline: "",
      message: "",
    },
  });

  const onSubmit = async (values: InquiryInput) => {
    setSubmitting(true);
    setError(null);
    try {
      await submitLead({
        ...values,
        utm_source: utm.source,
        utm_medium: utm.medium,
        utm_campaign: utm.campaign,
      });
      logger.info("public.lead_sent", { type: "inquiry", slug: propertySlug });
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Submit failed";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <NameEmailPhone register={register as unknown as NameProps["register"]} errors={errors} requirePhone={false} />

      <Controller
        name="pre_approved"
        control={control}
        render={({ field }) => (
          <label className="flex items-center gap-2 text-sm text-text-2">
            <Checkbox
              checked={field.value ?? false}
              onCheckedChange={(v) => field.onChange(v === true)}
            />
            I&apos;m pre-approved
          </label>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Budget range" htmlFor="budget_range">
          <Controller
            name="budget_range"
            control={control}
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger id="budget_range">
                  <SelectValue placeholder="Pick a range" />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_RANGES.map((b) => (
                    <SelectItem key={b.value} value={b.value}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FieldGroup>

        <FieldGroup label="Timeline" htmlFor="timeline">
          <Controller
            name="timeline"
            control={control}
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger id="timeline">
                  <SelectValue placeholder="When?" />
                </SelectTrigger>
                <SelectContent>
                  {TIMELINES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FieldGroup>
      </div>

      <FieldGroup label="Message (optional)" htmlFor="inquiry_message">
        <Textarea
          id="inquiry_message"
          rows={3}
          placeholder="Anything you want the homeowner to know?"
          {...register("message")}
        />
      </FieldGroup>

      <FormError error={error} />

      <Button type="submit" variant="spark" size="lg" disabled={submitting} className="w-full">
        {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        Send inquiry
      </Button>
      <p className="text-xs text-text-3">
        Your info goes directly to the homeowner. No agents involved.
      </p>
    </form>
  );
}

/* ─── Showing ─── */

function ShowingForm({ propertySlug, origen, utm, onSuccess }: SubFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ShowingInput>({
    resolver: zodResolver(showingSchema),
    defaultValues: {
      form_type: "showing",
      property_slug: propertySlug,
      origen,
      nombre: "",
      email: "",
      telefono: "",
      preferred_date: undefined,
      preferred_time: undefined,
      pre_approved: false,
      message: "",
    },
  });

  const onSubmit = async (values: ShowingInput) => {
    setSubmitting(true);
    setError(null);
    try {
      await submitLead({
        ...values,
        utm_source: utm.source,
        utm_medium: utm.medium,
        utm_campaign: utm.campaign,
      });
      logger.info("public.lead_sent", { type: "showing", slug: propertySlug });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <NameEmailPhone register={register as unknown as NameProps["register"]} errors={errors} requirePhone />

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Preferred date" htmlFor="preferred_date" error={errors.preferred_date?.message}>
          <Input
            id="preferred_date"
            type="date"
            min={tomorrow}
            {...register("preferred_date")}
          />
        </FieldGroup>
        <FieldGroup label="Time of day" htmlFor="preferred_time">
          <Controller
            name="preferred_time"
            control={control}
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger id="preferred_time">
                  <SelectValue placeholder="Pick a window" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FieldGroup>
      </div>

      <Controller
        name="pre_approved"
        control={control}
        render={({ field }) => (
          <label className="flex items-center gap-2 text-sm text-text-2">
            <Checkbox
              checked={field.value ?? false}
              onCheckedChange={(v) => field.onChange(v === true)}
            />
            I&apos;m pre-approved
          </label>
        )}
      />

      <FieldGroup label="Notes (optional)" htmlFor="showing_message">
        <Textarea
          id="showing_message"
          rows={2}
          placeholder="Anything specific to mention?"
          {...register("message")}
        />
      </FieldGroup>

      <FormError error={error} />

      <Button type="submit" variant="spark" size="lg" disabled={submitting} className="w-full">
        {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        Request showing
      </Button>
      <p className="text-xs text-text-3">
        The homeowner will confirm your showing within 24 hours.
      </p>
    </form>
  );
}

/* ─── Offer ─── */

function OfferForm({ propertySlug, origen, utm, onSuccess }: SubFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<OfferInput>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      form_type: "offer",
      property_slug: propertySlug,
      origen,
      nombre: "",
      email: "",
      telefono: "",
      offer_price: 0,
      earnest_money: undefined,
      financing: undefined,
      pre_approved_status: undefined,
      closing_date: undefined,
      contingencies: [],
      message: "",
    },
  });

  const onSubmit = async (values: OfferInput) => {
    setSubmitting(true);
    setError(null);
    try {
      await submitLead({
        ...values,
        utm_source: utm.source,
        utm_medium: utm.medium,
        utm_campaign: utm.campaign,
      });
      logger.info("public.lead_sent", { type: "offer", slug: propertySlug });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <NameEmailPhone register={register as unknown as NameProps["register"]} errors={errors} requirePhone />

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Offer price" htmlFor="offer_price" error={errors.offer_price?.message}>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-base text-text-3">
              $
            </span>
            <Input
              id="offer_price"
              type="number"
              min={1000}
              step={1000}
              inputMode="numeric"
              placeholder="425000"
              className="pl-7"
              {...register("offer_price")}
            />
          </div>
        </FieldGroup>

        <FieldGroup label="Earnest money" htmlFor="earnest_money">
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-base text-text-3">
              $
            </span>
            <Input
              id="earnest_money"
              type="number"
              min={0}
              step={500}
              inputMode="numeric"
              placeholder="5000"
              className="pl-7"
              {...register("earnest_money")}
            />
          </div>
        </FieldGroup>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Financing" htmlFor="financing">
          <Controller
            name="financing"
            control={control}
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger id="financing">
                  <SelectValue placeholder="How are you paying?" />
                </SelectTrigger>
                <SelectContent>
                  {FINANCING_OPTIONS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FieldGroup>

        <FieldGroup label="Pre-approved?" htmlFor="pre_approved_status">
          <Controller
            name="pre_approved_status"
            control={control}
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger id="pre_approved_status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {PRE_APPROVED_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FieldGroup>
      </div>

      <FieldGroup label="Desired closing date" htmlFor="closing_date">
        <Input id="closing_date" type="date" {...register("closing_date")} />
      </FieldGroup>

      <fieldset className="space-y-2">
        <legend className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-text-3">
          Contingencies
        </legend>
        <Controller
          name="contingencies"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-3 gap-2">
              {CONTINGENCY_OPTIONS.map((c) => {
                const value = c.value;
                const checked = (field.value ?? []).includes(value);
                return (
                  <label
                    key={value}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-sm border px-3 py-2 text-sm transition-colors",
                      checked
                        ? "border-espresso bg-espresso/5 text-text"
                        : "border-rule-strong text-text-2 hover:border-espresso/50",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        const set = new Set(field.value ?? []);
                        if (v === true) set.add(value);
                        else set.delete(value);
                        field.onChange(Array.from(set));
                      }}
                    />
                    {c.label}
                  </label>
                );
              })}
            </div>
          )}
        />
      </fieldset>

      <FieldGroup label="Notes (optional)" htmlFor="offer_message">
        <Textarea
          id="offer_message"
          rows={3}
          placeholder="Anything you'd like the homeowner to know?"
          {...register("message")}
        />
      </FieldGroup>

      <FormError error={error} />

      <Button type="submit" variant="spark" size="lg" disabled={submitting} className="w-full">
        {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        Submit offer
      </Button>
      <p className="text-xs text-rust">
        ⚠ Non-binding expression of interest. Not a legal contract.
      </p>
    </form>
  );
}

/* ─── Helpers ─── */

interface NameProps {
  // Loosely typed — the three sub-forms each have different generics, but the
  // shared fields (nombre/email/telefono) all exist with matching string types.
  register: (name: "nombre" | "email" | "telefono") => Record<string, unknown>;
  errors: { nombre?: { message?: string }; email?: { message?: string }; telefono?: { message?: string } };
  requirePhone: boolean;
}

function NameEmailPhone({ register, errors, requirePhone }: NameProps) {
  return (
    <>
      <FieldGroup label="Full name" htmlFor="nombre" error={errors.nombre?.message}>
        <Input id="nombre" placeholder="Your name" {...register("nombre")} />
      </FieldGroup>
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            inputMode="email"
            placeholder="you@example.com"
            {...register("email")}
          />
        </FieldGroup>
        <FieldGroup
          label={requirePhone ? "Phone" : "Phone (optional)"}
          htmlFor="telefono"
          error={errors.telefono?.message}
        >
          <Input
            id="telefono"
            type="tel"
            inputMode="tel"
            placeholder="(305) 555-0148"
            {...register("telefono")}
          />
        </FieldGroup>
      </div>
    </>
  );
}

function FieldGroup({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-rust">{error}</p> : null}
    </div>
  );
}

function FormError({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p
      role="alert"
      className="rounded-sm border border-rust/40 bg-rust/10 px-3 py-2 text-xs text-rust"
    >
      {error}
    </p>
  );
}
