"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Camera, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { profileSchema, type ProfileInput } from "@/lib/utils/validation";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/utils/logger";

interface ProfileSettingsFormProps {
  userId: string;
  email: string;
  nombre: string;
  avatarUrl: string | null;
}

export function ProfileSettingsForm({
  userId,
  email,
  nombre,
  avatarUrl: initialAvatar,
}: ProfileSettingsFormProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatar);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { nombre, bio: "" },
  });

  async function onSubmit(values: ProfileInput) {
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ nombre: values.nombre })
        .eq("id", userId);
      if (error) {
        logger.warn("settings.profile_update_failed", { message: error.message });
        toast.error("Couldn't save changes.");
        return;
      }
      logger.info("settings.profile_updated", { userId });
      toast.success("Saved.");
      router.refresh();
    } catch (err) {
      logger.error("settings.profile_exception", { error: err });
      toast.error("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Avatar must be under 2 MB");
      return;
    }
    setUploadingAvatar(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadErr) {
        logger.error("settings.avatar_upload_failed", { message: uploadErr.message });
        toast.error("Couldn't upload avatar.");
        return;
      }
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("id", userId);
      if (updateErr) {
        logger.error("settings.avatar_save_failed", { message: updateErr.message });
        toast.error("Couldn't save avatar.");
        return;
      }
      setAvatarUrl(data.publicUrl);
      logger.info("settings.avatar_updated", { userId });
      toast.success("Avatar updated.");
      router.refresh();
    } catch (err) {
      logger.error("settings.avatar_exception", { error: err });
    } finally {
      setUploadingAvatar(false);
    }
  }

  const initials =
    nombre
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "U";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <section className="border border-rule bg-ivory p-7">
        <div className="eyebrow mb-1">Avatar</div>
        <p className="text-sm text-text-2">
          PNG or JPG up to 2 MB. Shown to buyers across NoComiss.
        </p>
        <div className="mt-5 flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-rule-strong bg-crema-2 font-serif text-xl font-medium text-text">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span aria-hidden>{initials}</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
              {uploadingAvatar ? "Uploading…" : "Upload new"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleAvatarChange}
            />
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-3">
              JPG · PNG · WebP — max 2 MB
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4 border border-rule bg-ivory p-7">
        <div className="eyebrow mb-2">Profile</div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} disabled readOnly />
          <p className="text-xs text-text-3">Email changes require support.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nombre">Full name</Label>
          <Input id="nombre" aria-invalid={!!errors.nombre} {...register("nombre")} />
          {errors.nombre ? (
            <p className="text-xs text-rust">{errors.nombre.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio (optional)</Label>
          <Input
            id="bio"
            placeholder="Homeowner in Miami, selling a 3BR ranch"
            maxLength={500}
            {...register("bio")}
          />
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting || !isDirty}>
          {submitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Save changes
        </Button>
      </div>
    </form>
  );
}
