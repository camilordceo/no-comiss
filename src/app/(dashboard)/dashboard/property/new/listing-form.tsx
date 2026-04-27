"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Image as ImageIcon,
  Loader2,
  Star,
  Trash2,
  Upload,
  Video as VideoIcon,
} from "lucide-react";

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
  PROPERTY_TYPES,
  US_STATES,
  listingSchema,
  type ListingInput,
} from "@/lib/utils/validation";
import { uploadFile, generateStoragePath } from "@/lib/services/storage";
import { logger } from "@/lib/utils/logger";
import { cn } from "@/lib/utils/cn";

const MAX_PHOTO_MB = 10;
const MAX_VIDEO_MB = 500;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const ACCEPTED_VIDEO_EXT = /\.(mp4|mov|webm|m4v)$/i;

interface PhotoTicket {
  id: string;
  file: File;
  previewUrl: string;
}

interface VideoTicket {
  id: string;
  file: File;
}

interface Props {
  empresaId: string;
}

export function ListingForm({ empresaId }: Props) {
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoTicket[]>([]);
  const [videos, setVideos] = useState<VideoTicket[]>([]);
  const [heroId, setHeroId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ListingInput>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      tipo_inmueble: "single_family",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "FL",
      zip_code: "",
      bedrooms: 0,
      bathrooms: 0,
      garage_spaces: 0,
      sqft: 0,
      price: 0,
      description: "",
    },
  });

  const handleFiles = useCallback(
    (incoming: FileList | File[]) => {
      const next: PhotoTicket[] = [];
      const rejected: string[] = [];
      for (const file of Array.from(incoming)) {
        if (!ACCEPTED.includes(file.type)) {
          rejected.push(`${file.name}: unsupported format`);
          continue;
        }
        if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
          rejected.push(`${file.name}: over ${MAX_PHOTO_MB} MB`);
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

  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
    setHeroId((current) => (current === id ? null : current));
  }, []);

  const handleVideoFiles = useCallback((incoming: FileList | File[]) => {
    const next: VideoTicket[] = [];
    const rejected: string[] = [];
    for (const file of Array.from(incoming)) {
      const isAccepted =
        file.type.startsWith("video/") || ACCEPTED_VIDEO_EXT.test(file.name);
      if (!isAccepted) {
        rejected.push(`${file.name}: We accept MP4, MOV, and WebM.`);
        continue;
      }
      if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
        rejected.push(`${file.name}: over ${MAX_VIDEO_MB} MB`);
        continue;
      }
      next.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
      });
    }
    if (rejected.length > 0) toast.error(rejected.join("\n"));
    if (next.length > 0) setVideos((prev) => [...prev, ...next]);
  }, []);

  const removeVideo = useCallback((id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const onSubmit = useCallback(
    async (values: ListingInput) => {
      if (photos.length === 0) {
        toast.error("Add at least one photo of your home.");
        return;
      }

      setSubmitting(true);
      setSubmitProgress("Creating listing…");

      try {
        const createRes = await fetch("/api/property", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const createBody = await createRes.json();
        if (!createRes.ok) {
          logger.warn("listing.create_failed", { body: createBody });
          throw new Error(createBody?.message || "Couldn't create the listing");
        }
        const propertyId: string = createBody.property.id;
        logger.info("listing.created", { propertyId });

        const orderedHeroFirst = heroId
          ? [
              ...photos.filter((p) => p.id === heroId),
              ...photos.filter((p) => p.id !== heroId),
            ]
          : photos;

        for (let i = 0; i < orderedHeroFirst.length; i++) {
          const ticket = orderedHeroFirst[i];
          setSubmitProgress(`Uploading photo ${i + 1} of ${orderedHeroFirst.length}…`);

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
            toast.error(`Photo ${i + 1}: registered upload but DB insert failed.`);
          }
        }

        for (let i = 0; i < videos.length; i++) {
          const v = videos[i];
          setSubmitProgress(`Uploading video ${i + 1} of ${videos.length}…`);

          try {
            const meta = await readVideoMeta(v.file);
            const path = generateStoragePath(empresaId, propertyId, v.file.name);
            const upload = await uploadFile(v.file, "listing-videos", path);

            let thumbnailUrl: string | null = null;
            if (meta.thumbnail) {
              try {
                const thumbName = v.file.name.replace(/\.[^.]+$/, "") + ".jpg";
                const thumbPath = generateStoragePath(
                  empresaId,
                  propertyId,
                  `thumb-${thumbName}`,
                );
                const thumbFile = new File([meta.thumbnail], thumbName, {
                  type: "image/jpeg",
                });
                const thumbUpload = await uploadFile(thumbFile, "listing-photos", thumbPath);
                thumbnailUrl = thumbUpload.publicUrl;
              } catch (err) {
                logger.warn("listing.video_thumbnail_failed", {
                  propertyId,
                  message: err instanceof Error ? err.message : String(err),
                });
              }
            }

            const videoRes = await fetch("/api/media/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                propiedad_id: propertyId,
                media_type: "video",
                storage_path: upload.storagePath,
                public_url: upload.publicUrl,
                thumbnail_url: thumbnailUrl,
                file_size_bytes: v.file.size,
                mime_type: v.file.type || "video/mp4",
                duration_seconds: meta.duration,
              }),
            });
            if (!videoRes.ok) {
              const err = await videoRes.json().catch(() => ({}));
              logger.warn("listing.video_register_failed", { propertyId, err });
              toast.error(`Video ${i + 1}: registered upload but DB insert failed.`);
            } else {
              logger.info("media.video_uploaded", {
                propertyId,
                duration: meta.duration,
                fileSize: v.file.size,
              });
            }
          } catch (err) {
            const message = err instanceof Error ? err.message : "Video upload failed";
            logger.warn("listing.video_upload_failed", { propertyId, message });
            toast.error(`Video ${i + 1}: ${message}`);
          }
        }

        toast.success("Your listing is live.");
        router.push(`/dashboard/property/${propertyId}`);
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        logger.error("listing.submit_exception", { message });
        toast.error(message);
      } finally {
        setSubmitting(false);
        setSubmitProgress(null);
      }
    },
    [photos, videos, heroId, empresaId, router],
  );

  const photoCount = photos.length;
  const heroLabel = useMemo(() => {
    if (!heroId) return null;
    const idx = photos.findIndex((p) => p.id === heroId);
    return idx >= 0 ? `Hero: photo ${idx + 1}` : null;
  }, [heroId, photos]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* ─── Property type + Address ─── */}
      <Section title="The home" hint="Tell us what you're selling and where it lives.">
        <Field
          label="Property type"
          htmlFor="tipo_inmueble"
          error={errors.tipo_inmueble?.message}
        >
          <Controller
            name="tipo_inmueble"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PROPERTY_TYPES.map((opt) => {
                  const active = field.value === opt.value;
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => field.onChange(opt.value)}
                      className={cn(
                        "h-11 rounded-sm border text-sm font-semibold transition-all",
                        active
                          ? "border-espresso bg-espresso text-text-on-dark"
                          : "border-rule-strong bg-ivory text-text-2 hover:border-espresso/50 hover:text-text",
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
          label="Street address"
          htmlFor="address_line1"
          error={errors.address_line1?.message}
        >
          <Input
            id="address_line1"
            placeholder="1234 Ocean Dr"
            aria-invalid={!!errors.address_line1}
            {...register("address_line1")}
          />
        </Field>

        <Field
          label="Apt / suite (optional)"
          htmlFor="address_line2"
          error={errors.address_line2?.message}
        >
          <Input
            id="address_line2"
            placeholder="Apt 4B"
            {...register("address_line2")}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_120px_140px]">
          <Field label="City" htmlFor="city" error={errors.city?.message}>
            <Input
              id="city"
              placeholder="Miami"
              aria-invalid={!!errors.city}
              {...register("city")}
            />
          </Field>
          <Field label="State" htmlFor="state" error={errors.state?.message}>
            <Controller
              name="state"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="state" aria-invalid={!!errors.state}>
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="ZIP" htmlFor="zip_code" error={errors.zip_code?.message}>
            <Input
              id="zip_code"
              placeholder="33139"
              inputMode="numeric"
              aria-invalid={!!errors.zip_code}
              {...register("zip_code")}
            />
          </Field>
        </div>
      </Section>

      {/* ─── Specs ─── */}
      <Section title="Specs" hint="What buyers want to know first.">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Bedrooms" htmlFor="bedrooms" error={errors.bedrooms?.message}>
            <Input
              id="bedrooms"
              type="number"
              min={0}
              inputMode="numeric"
              aria-invalid={!!errors.bedrooms}
              {...register("bedrooms")}
            />
          </Field>
          <Field label="Bathrooms" htmlFor="bathrooms" error={errors.bathrooms?.message}>
            <Input
              id="bathrooms"
              type="number"
              min={0}
              step={0.5}
              inputMode="decimal"
              aria-invalid={!!errors.bathrooms}
              {...register("bathrooms")}
            />
          </Field>
          <Field
            label="Garage"
            htmlFor="garage_spaces"
            error={errors.garage_spaces?.message}
          >
            <Input
              id="garage_spaces"
              type="number"
              min={0}
              inputMode="numeric"
              aria-invalid={!!errors.garage_spaces}
              {...register("garage_spaces")}
            />
          </Field>
          <Field label="Square feet" htmlFor="sqft" error={errors.sqft?.message}>
            <Input
              id="sqft"
              type="number"
              min={100}
              inputMode="numeric"
              aria-invalid={!!errors.sqft}
              {...register("sqft")}
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Year built (optional)"
            htmlFor="year_built"
            error={errors.year_built?.message}
          >
            <Input
              id="year_built"
              type="number"
              inputMode="numeric"
              placeholder="1998"
              {...register("year_built")}
            />
          </Field>
          <Field
            label="HOA monthly (optional)"
            htmlFor="hoa_monthly"
            error={errors.hoa_monthly?.message}
          >
            <Input
              id="hoa_monthly"
              type="number"
              min={0}
              inputMode="decimal"
              placeholder="0"
              {...register("hoa_monthly")}
            />
          </Field>
        </div>
      </Section>

      {/* ─── Price ─── */}
      <Section title="Asking price" hint="USD. You can edit later.">
        <Field label="Price" htmlFor="price" error={errors.price?.message}>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-base text-text-3">
              $
            </span>
            <Input
              id="price"
              type="number"
              min={10000}
              step={1000}
              inputMode="numeric"
              placeholder="450000"
              aria-invalid={!!errors.price}
              className="pl-7"
              {...register("price")}
            />
          </div>
        </Field>
      </Section>

      {/* ─── Description ─── */}
      <Section
        title="The story"
        hint="Why someone should fall in love with this home. Plain English. Be specific."
      >
        <Field label="Description" htmlFor="description" error={errors.description?.message}>
          <Textarea
            id="description"
            rows={6}
            placeholder="Quiet street, two blocks to the beach. Renovated kitchen 2024. The kind of front porch where you actually use the rocking chair…"
            aria-invalid={!!errors.description}
            {...register("description")}
          />
        </Field>
      </Section>

      {/* ─── Photos ─── */}
      <Section title="Photos" hint="At least 1. Five or more is best. Daylight, horizontal.">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={onDrop}
          className="rounded-sm border-2 border-dashed border-rule-strong bg-paper p-10 text-center transition-colors hover:border-espresso/60"
        >
          <Upload className="mx-auto mb-3 h-6 w-6 text-text-3" aria-hidden />
          <p className="font-serif text-lg font-medium text-text">
            Drop your high-res photos here
          </p>
          <p className="mt-1 text-sm text-text-3">JPG · PNG · WebP — up to {MAX_PHOTO_MB} MB each</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-5 inline-flex items-center gap-1.5 rounded-sm border border-rule-strong bg-ivory px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-text transition-all hover:border-espresso"
          >
            <ImageIcon className="h-3.5 w-3.5" aria-hidden />
            Select photos
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
        </div>

        {photoCount > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="data-key">
                {photoCount} photo{photoCount === 1 ? "" : "s"}
                {heroLabel ? ` · ${heroLabel}` : ""}
              </div>
            </div>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {photos.map((p, idx) => {
                const isHero = p.id === heroId;
                return (
                  <li
                    key={p.id}
                    className={cn(
                      "group relative overflow-hidden border bg-ivory",
                      isHero ? "border-coral" : "border-rule-strong",
                    )}
                  >
                    <div className="aspect-square w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.previewUrl}
                        alt={`Photo ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {isHero ? (
                      <div className="absolute left-2 top-2 inline-flex items-center gap-1 bg-coral px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-white">
                        <Star className="h-2.5 w-2.5 fill-white" aria-hidden /> Hero
                      </div>
                    ) : null}
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-espresso/80 p-2 opacity-0 backdrop-blur-sm transition-opacity duration-180 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => setHeroId(p.id)}
                        disabled={isHero}
                        className="inline-flex items-center gap-1 rounded-sm bg-ivory px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-text transition-colors hover:text-coral disabled:opacity-40"
                      >
                        <Star className="h-3 w-3" aria-hidden /> Hero
                      </button>
                      <button
                        type="button"
                        onClick={() => removePhoto(p.id)}
                        className="inline-flex items-center gap-1 rounded-sm bg-ivory px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-rust transition-colors hover:bg-rust/15"
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

      {/* ─── Videos (optional) ─── */}
      <Section
        title="Video tour"
        hint="Optional but powerful — listings with video get 73% more showings. MP4, MOV or WebM, up to 500 MB."
      >
        <div
          className="rounded-sm border-2 border-dashed border-rule-strong bg-paper p-10 text-center transition-colors hover:border-espresso/60"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer.files?.length) handleVideoFiles(e.dataTransfer.files);
          }}
        >
          <VideoIcon className="mx-auto mb-3 h-6 w-6 text-text-3" aria-hidden />
          <p className="font-serif text-lg font-medium text-text">
            Drop your home tour videos here
          </p>
          <p className="mt-1 text-sm text-text-3">
            MP4 · MOV · WebM — up to {MAX_VIDEO_MB} MB each
          </p>
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className="mt-5 inline-flex items-center gap-1.5 rounded-sm border border-rule-strong bg-ivory px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-text transition-all hover:border-espresso"
          >
            <VideoIcon className="h-3.5 w-3.5" aria-hidden />
            Select video
          </button>
          <input
            ref={videoInputRef}
            type="file"
            accept=".mp4,.mov,.webm,.m4v,video/mp4,video/quicktime,video/webm"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) handleVideoFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {videos.length > 0 ? (
          <ul className="space-y-2">
            {videos.map((v, idx) => (
              <li
                key={v.id}
                className="flex items-center justify-between gap-3 border border-rule bg-ivory px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <VideoIcon className="h-4 w-4 shrink-0 text-text-3" aria-hidden />
                  <div className="min-w-0">
                    <div className="truncate font-mono text-[11px] text-text-2">
                      {v.file.name}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-3">
                      Video {idx + 1} · {(v.file.size / (1024 * 1024)).toFixed(1)} MB
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeVideo(v.id)}
                  className="font-mono text-[10px] uppercase tracking-[0.14em] text-rust transition-colors hover:text-rust"
                  aria-label="Remove video"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </Section>

      {/* ─── Submit ─── */}
      <div className="sticky bottom-0 -mx-4 border-t border-rule bg-crema/95 px-4 py-4 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
        <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="spark" size="lg" disabled={submitting}>
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {submitProgress ?? "Publish listing"}
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
    <section className="rounded-sm border border-rule bg-ivory p-7">
      <header className="mb-5">
        <div className="eyebrow mb-1.5">{title}</div>
        {hint ? <p className="text-sm text-text-2">{hint}</p> : null}
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
        <p role="alert" className="text-xs text-rust">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-text-3">{hint}</p>
      ) : null}
    </div>
  );
}

interface VideoMeta {
  duration: number | null;
  thumbnail: Blob | null;
}

async function readVideoMeta(file: File): Promise<VideoMeta> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    const url = URL.createObjectURL(file);
    video.src = url;

    let settled = false;
    const settle = (meta: VideoMeta) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      resolve(meta);
    };

    video.onloadedmetadata = () => {
      const duration = isFinite(video.duration) ? Math.round(video.duration) : null;
      const target = Math.min(1, Math.max(0, video.duration - 0.1));
      try {
        video.currentTime = isFinite(target) ? target : 0;
      } catch {
        settle({ duration, thumbnail: null });
      }
    };
    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext("2d");
        const duration = isFinite(video.duration) ? Math.round(video.duration) : null;
        if (!ctx) {
          settle({ duration, thumbnail: null });
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => settle({ duration, thumbnail: blob }),
          "image/jpeg",
          0.85,
        );
      } catch {
        const duration = isFinite(video.duration) ? Math.round(video.duration) : null;
        settle({ duration, thumbnail: null });
      }
    };
    video.onerror = () => settle({ duration: null, thumbnail: null });
  });
}
