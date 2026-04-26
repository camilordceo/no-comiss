"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Image as ImageIcon, Loader2, Star, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CIUDADES,
  TIPOS_INMUEBLE,
  TIPOS_NEGOCIO,
  listingSchema,
  type ListingInput,
} from "@/lib/utils/validation";
import { uploadFile, generateStoragePath } from "@/lib/services/storage";
import { logger } from "@/lib/utils/logger";
import { cn } from "@/lib/utils/cn";

const MAX_PHOTO_MB = 10;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

interface PhotoTicket {
  id: string;
  file: File;
  previewUrl: string;
}

interface Props {
  empresaId: string;
}

export function ListingForm({ empresaId }: Props) {
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoTicket[]>([]);
  const [heroId, setHeroId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ListingInput>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      tipo_negocio: "venta",
      tipo_inmueble: "",
      ciudad: "",
      ubicacion: "",
      habitaciones: 0,
      banos: 0,
      parqueaderos: 0,
      area_m2: 0,
      precio: 0,
      descripcion: "",
    },
  });

  const handleFiles = useCallback(
    (incoming: FileList | File[]) => {
      const next: PhotoTicket[] = [];
      const rejected: string[] = [];

      for (const file of Array.from(incoming)) {
        if (!ACCEPTED.includes(file.type)) {
          rejected.push(`${file.name}: formato no soportado`);
          continue;
        }
        if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
          rejected.push(`${file.name}: pesa más de ${MAX_PHOTO_MB} MB`);
          continue;
        }
        next.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          previewUrl: URL.createObjectURL(file),
        });
      }

      if (rejected.length > 0) toast.error(rejected.join("\n"));
      if (next.length > 0) {
        setPhotos((prev) => {
          const combined = [...prev, ...next];
          if (heroId === null && combined.length > 0) setHeroId(combined[0].id);
          return combined;
        });
      }
    },
    [heroId],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const removePhoto = useCallback(
    (id: string) => {
      setPhotos((prev) => {
        const target = prev.find((p) => p.id === id);
        if (target) URL.revokeObjectURL(target.previewUrl);
        return prev.filter((p) => p.id !== id);
      });
      setHeroId((current) => (current === id ? null : current));
    },
    [],
  );

  const onSubmit = useCallback(
    async (values: ListingInput) => {
      if (photos.length === 0) {
        toast.error("Sube al menos una foto del inmueble.");
        return;
      }

      setSubmitting(true);
      setSubmitProgress("Creando inmueble…");

      try {
        // 1) Create the listing
        const createRes = await fetch("/api/property", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const createBody = await createRes.json();
        if (!createRes.ok) {
          logger.warn("listing.create_failed", { body: createBody });
          throw new Error(createBody?.message || "No se pudo crear el inmueble");
        }
        const propertyId: string = createBody.property.id;
        logger.info("listing.created", { propertyId });

        // 2) Upload each photo and register media row
        const orderedHeroFirst = heroId
          ? [
              ...photos.filter((p) => p.id === heroId),
              ...photos.filter((p) => p.id !== heroId),
            ]
          : photos;

        for (let i = 0; i < orderedHeroFirst.length; i++) {
          const ticket = orderedHeroFirst[i];
          setSubmitProgress(`Subiendo foto ${i + 1} de ${orderedHeroFirst.length}…`);

          const path = generateStoragePath(empresaId, propertyId, ticket.file.name);
          const upload = await uploadFile(ticket.file, "listing-photos", path);

          const mediaRes = await fetch("/api/media/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              propiedad_id: propertyId,
              media_type: "photo",
              storage_path: upload.storagePath,
              public_url: upload.publicUrl,
              file_size_bytes: ticket.file.size,
              mime_type: ticket.file.type,
            }),
          });
          if (!mediaRes.ok) {
            const err = await mediaRes.json().catch(() => ({}));
            logger.warn("listing.media_register_failed", { propertyId, err });
            // Don't fail hard — listing exists, photo's in storage. Surface and keep going.
            toast.error(`Foto ${i + 1}: registro falló, pero el archivo quedó subido.`);
          }
        }

        toast.success("Inmueble publicado.");
        router.push(`/dashboard/property/${propertyId}`);
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error desconocido";
        logger.error("listing.submit_exception", { message });
        toast.error(message);
      } finally {
        setSubmitting(false);
        setSubmitProgress(null);
      }
    },
    [photos, heroId, empresaId, router],
  );

  const photoCount = photos.length;
  const heroLabel = useMemo(() => {
    if (!heroId) return null;
    const idx = photos.findIndex((p) => p.id === heroId);
    return idx >= 0 ? `Portada: foto ${idx + 1}` : null;
  }, [heroId, photos]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Operación */}
      <Section
        title="Operación"
        hint="Decide qué quieres publicar y dónde queda."
      >
        <Field label="Tipo de negocio" htmlFor="tipo_negocio" error={errors.tipo_negocio?.message}>
          <Controller
            name="tipo_negocio"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-2" id="tipo_negocio">
                {TIPOS_NEGOCIO.map((opt) => {
                  const active = field.value === opt.value;
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => field.onChange(opt.value)}
                      className={cn(
                        "h-10 rounded-sm border text-sm font-semibold transition-all",
                        active
                          ? "border-brand-green bg-brand-green/15 text-brand-green"
                          : "border-border bg-surface-3 text-muted-foreground hover:border-brand-green/50 hover:text-white",
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          />
        </Field>

        <Field
          label="Tipo de inmueble"
          htmlFor="tipo_inmueble"
          error={errors.tipo_inmueble?.message}
        >
          <Controller
            name="tipo_inmueble"
            control={control}
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger id="tipo_inmueble" aria-invalid={!!errors.tipo_inmueble}>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_INMUEBLE.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field label="Ciudad" htmlFor="ciudad" error={errors.ciudad?.message}>
          <Controller
            name="ciudad"
            control={control}
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger id="ciudad" aria-invalid={!!errors.ciudad}>
                  <SelectValue placeholder="Selecciona una ciudad" />
                </SelectTrigger>
                <SelectContent>
                  {CIUDADES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field
          label="Barrio o sector"
          htmlFor="ubicacion"
          error={errors.ubicacion?.message}
          hint="Ej: Chapinero Alto, El Poblado, Granada"
        >
          <Input
            id="ubicacion"
            placeholder="Chapinero Alto"
            aria-invalid={!!errors.ubicacion}
            {...register("ubicacion")}
          />
        </Field>
      </Section>

      {/* Características */}
      <Section title="Características" hint="Lo que un comprador quiere saber primero.">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Habitaciones" htmlFor="habitaciones" error={errors.habitaciones?.message}>
            <Input
              id="habitaciones"
              type="number"
              min={0}
              inputMode="numeric"
              aria-invalid={!!errors.habitaciones}
              {...register("habitaciones")}
            />
          </Field>
          <Field label="Baños" htmlFor="banos" error={errors.banos?.message}>
            <Input
              id="banos"
              type="number"
              min={0}
              inputMode="numeric"
              aria-invalid={!!errors.banos}
              {...register("banos")}
            />
          </Field>
          <Field label="Parqueaderos" htmlFor="parqueaderos" error={errors.parqueaderos?.message}>
            <Input
              id="parqueaderos"
              type="number"
              min={0}
              inputMode="numeric"
              aria-invalid={!!errors.parqueaderos}
              {...register("parqueaderos")}
            />
          </Field>
          <Field label="Área (m²)" htmlFor="area_m2" error={errors.area_m2?.message}>
            <Input
              id="area_m2"
              type="number"
              min={10}
              inputMode="numeric"
              aria-invalid={!!errors.area_m2}
              {...register("area_m2")}
            />
          </Field>
        </div>
      </Section>

      {/* Precio */}
      <Section title="Precio" hint="En pesos colombianos. Lo puedes ajustar después.">
        <Field label="Precio (COP)" htmlFor="precio" error={errors.precio?.message}>
          <Input
            id="precio"
            type="number"
            min={100000}
            step={1000}
            inputMode="numeric"
            placeholder="450000000"
            aria-invalid={!!errors.precio}
            {...register("precio")}
          />
        </Field>
      </Section>

      {/* Descripción */}
      <Section
        title="Descripción"
        hint="Cuenta lo bueno: vista, terraza, vecindario, remodelación reciente."
      >
        <Field label="Descripción" htmlFor="descripcion" error={errors.descripcion?.message}>
          <Textarea
            id="descripcion"
            rows={6}
            placeholder="Apartamento en piso alto, vista a los cerros, totalmente remodelado en 2024…"
            aria-invalid={!!errors.descripcion}
            {...register("descripcion")}
          />
        </Field>
      </Section>

      {/* Fotos */}
      <Section
        title="Fotos"
        hint="Mínimo 1, idealmente 5+. Buena luz natural y horizontal."
      >
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={onDrop}
          className="rounded-lg border-2 border-dashed border-border bg-surface-2 p-8 text-center transition-colors hover:border-brand-green/60"
        >
          <Upload className="mx-auto mb-3 h-6 w-6 text-muted-foreground" aria-hidden />
          <p className="text-sm font-semibold text-white">
            Arrastra tus fotos aquí o
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-2 inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface-3 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-foreground transition-all hover:border-brand-green hover:text-white"
          >
            <ImageIcon className="h-3.5 w-3.5" aria-hidden />
            Seleccionar archivos
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <p className="mt-3 text-xs text-muted-foreground">
            JPG, PNG o WEBP · Máx {MAX_PHOTO_MB} MB c/u
          </p>
        </div>

        {photoCount > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {photoCount} foto{photoCount === 1 ? "" : "s"} lista
                {photoCount === 1 ? "" : "s"}
                {heroLabel ? ` · ${heroLabel}` : ""}
              </div>
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {photos.map((p, idx) => {
                const isHero = p.id === heroId;
                return (
                  <li
                    key={p.id}
                    className={cn(
                      "group relative overflow-hidden rounded-md border bg-surface-3",
                      isHero ? "border-brand-green" : "border-border",
                    )}
                  >
                    <div className="aspect-square w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.previewUrl}
                        alt={`Foto ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {isHero ? (
                      <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-pill bg-brand-green px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        <Star className="h-2.5 w-2.5 fill-white" aria-hidden /> Portada
                      </div>
                    ) : null}
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/60 p-2 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => setHeroId(p.id)}
                        disabled={isHero}
                        className="inline-flex items-center gap-1 rounded-sm bg-surface-3 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground transition-colors hover:text-brand-green disabled:opacity-40"
                      >
                        <Star className="h-3 w-3" aria-hidden /> Portada
                      </button>
                      <button
                        type="button"
                        onClick={() => removePhoto(p.id)}
                        className="inline-flex items-center gap-1 rounded-sm bg-surface-3 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-error transition-colors hover:bg-error/15"
                      >
                        <Trash2 className="h-3 w-3" aria-hidden />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </Section>

      <div className="sticky bottom-0 -mx-4 border-t border-border bg-surface-1/95 px-4 py-4 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
        <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitProgress ?? "Publicar inmueble"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface-3 p-5">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-error">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
