/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Camera } from "lucide-react";

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}
import { cn } from "@/lib/utils";

interface ProfileFormProps {
  userId: string;
  initialData: {
    full_name: string;
    phone: string;
    email: string;
    avatar_url?: string | null;
    bio?: string | null;
    tiktok_handle?: string | null;
    instagram_handle?: string | null;
  };
}

function completionScore(data: ProfileFormProps["initialData"]): number {
  let score = 0;
  if (data.full_name?.trim()) score += 20;
  if (data.phone?.trim()) score += 20;
  if (data.avatar_url) score += 25;
  if ((data.bio ?? "").trim().length > 30) score += 20;
  if (data.tiktok_handle || data.instagram_handle) score += 15;
  return Math.min(score, 100);
}

const COMPLETION_TIPS = [
  { key: "name",   label: "Add your full name",            done: (d: ProfileFormProps["initialData"]) => !!d.full_name?.trim() },
  { key: "phone",  label: "Add your phone number",         done: (d: ProfileFormProps["initialData"]) => !!d.phone?.trim() },
  { key: "avatar", label: "Upload a profile photo",        done: (d: ProfileFormProps["initialData"]) => !!d.avatar_url },
  { key: "bio",    label: "Write a short bio (30+ chars)", done: (d: ProfileFormProps["initialData"]) => (d.bio?.trim().length ?? 0) > 30 },
  { key: "social", label: "Connect social handles",        done: (d: ProfileFormProps["initialData"]) => !!(d.tiktok_handle || d.instagram_handle) },
];

export function ProfileForm({ userId, initialData }: ProfileFormProps) {
  const [fullName, setFullName]       = useState(initialData.full_name);
  const [phone, setPhone]             = useState(initialData.phone);
  const [bio, setBio]                 = useState(initialData.bio ?? "");
  const [tiktok, setTiktok]           = useState(initialData.tiktok_handle ?? "");
  const [instagram, setInstagram]     = useState(initialData.instagram_handle ?? "");
  const [avatarUrl, setAvatarUrl]     = useState(initialData.avatar_url ?? "");
  const [uploading, setUploading]     = useState(false);
  const [loading, setLoading]         = useState(false);
  const [saved, setSaved]             = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const live: ProfileFormProps["initialData"] = {
    full_name: fullName,
    phone,
    avatar_url: avatarUrl || null,
    bio,
    tiktok_handle: tiktok || null,
    instagram_handle: instagram || null,
    email: initialData.email,
  };
  const score = completionScore(live);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Photo must be under 5MB"); return; }

    setUploading(true);
    setError(null);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `avatars/${userId}-${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage.from("listing-photos").upload(path, file, { upsert: true });
    if (upErr) { setError("Upload failed. Please try again."); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from("listing-photos").getPublicUrl(path);
    setAvatarUrl(urlData.publicUrl);
    setUploading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    setError(null);

    const supabase = createClient();
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone,
        avatar_url: avatarUrl || null,
        bio: bio || null,
        tiktok_handle: tiktok.replace(/^@/, "") || null,
        instagram_handle: instagram.replace(/^@/, "") || null,
        profile_completion_score: score,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    setLoading(false);
    if (updateErr) {
      setError("Failed to save. Please try again.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* Completion bar */}
      <div className="p-4 rounded-[8px] bg-[#f8f8f8] border border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Profile completion</span>
          <span className={cn("text-sm font-semibold", score === 100 ? "text-primary" : score >= 60 ? "text-amber-500" : "text-gray-400")}>
            {score}%
          </span>
        </div>
        <div className="h-1.5 bg-[#e5e5e5] rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${score}%` }} />
        </div>
        {score < 100 && (
          <div className="mt-3 space-y-1.5">
            {COMPLETION_TIPS.filter((t) => !t.done(live)).slice(0, 2).map((tip) => (
              <p key={tip.key} className="text-xs text-gray-500 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                {tip.label}
              </p>
            ))}
          </div>
        )}
        {score === 100 && (
          <p className="mt-2 text-xs text-primary flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Profile complete — you&apos;re ready to sell
          </p>
        )}
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-[#f0f0f0] border border-border overflow-hidden flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-semibold text-gray-400">
                {fullName?.charAt(0)?.toUpperCase() ?? "?"}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center hover:bg-[#38c98d] transition-colors"
            aria-label="Upload photo"
          >
            <Camera className="w-3 h-3" />
          </button>
        </div>
        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-sm text-primary hover:underline font-medium"
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload photo"}
          </button>
          <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WebP — max 5MB</p>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} />
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Smith" required />
        <Input label="Email" type="email" value={initialData.email} disabled hint="Email cannot be changed" />
      </div>

      <Input label="Phone" type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Bio <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell buyers a bit about yourself — your connection to the home, how long you've lived there, what you love about the area."
          rows={3}
          maxLength={500}
          className="w-full px-3 py-2.5 rounded-[8px] border border-border bg-[#f0f0f0] text-sm text-foreground placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all resize-none"
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{bio.length}/500</p>
      </div>

      {/* Social handles */}
      <div>
        <p className="text-sm font-medium text-foreground mb-2">
          Social handles <span className="text-gray-400 font-normal">(optional)</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">@</span>
            <input
              type="text"
              placeholder="tiktok"
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value.replace(/^@/, ""))}
              className="w-full pl-7 pr-3 py-2.5 rounded-[8px] border border-border bg-[#f0f0f0] text-sm text-foreground placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="relative">
            <IconInstagram className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="instagram"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value.replace(/^@/, ""))}
              className="w-full pl-8 pr-3 py-2.5 rounded-[8px] border border-border bg-[#f0f0f0] text-sm text-foreground placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-[8px] px-3 py-2">{error}</p>
      )}

      <Button type="submit" size="md" loading={loading} disabled={uploading}>
        {saved ? "Saved!" : "Save changes"}
      </Button>
    </form>
  );
}
