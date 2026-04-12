/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useCallback, useRef } from "react";
import { ArrowRight, ArrowLeft, Upload, X, CheckCircle2, MapPin, Home, Camera, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type Photo = {
  id: string;
  url: string;
  path: string;
  room: string;
  file: File;
  uploading: boolean;
  error: string | null;
};

type RentCastData = {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFootage: number | null;
  yearBuilt: number | null;
  estimatedValue: number | null;
};

type WizardState = {
  sessionId: string;
  address: string;
  rentcastData: RentCastData | null;
  photos: Photo[];
  story: string;
  videoUrl: string;
  aiDescription: string | null;
};

const ROOM_OPTIONS = [
  "Living Room", "Kitchen", "Primary Bedroom", "Bedroom 2", "Bedroom 3",
  "Bathroom", "Primary Bathroom", "Dining Room", "Office", "Garage",
  "Backyard", "Front Exterior", "Other",
];

const STEPS = [
  { id: 1, label: "Address", icon: MapPin },
  { id: 2, label: "Photos", icon: Camera },
  { id: 3, label: "Story", icon: FileText },
  { id: 4, label: "Preview", icon: Home },
];

function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

// ─── Step 1: Address ─────────────────────────────────────────────────────────

function StepAddress({
  state,
  onUpdate,
  onNext,
}: {
  state: WizardState;
  onUpdate: (u: Partial<WizardState>) => void;
  onNext: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLookup() {
    if (!state.address.trim()) {
      setError("Please enter your address or ZIP code.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/rentcast/lookup?address=${encodeURIComponent(state.address)}`,
      );
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      onUpdate({ rentcastData: data });
      onNext();
    } catch {
      // Still allow proceeding without RentCast data
      onUpdate({ rentcastData: null });
      onNext();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">What&apos;s your home&apos;s address?</h2>
        <p className="text-gray-500">We&apos;ll pull up your property details automatically.</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <Input
            label="Street address or ZIP code"
            placeholder="123 Oak Street, Austin, TX 78701"
            value={state.address}
            onChange={(e) => onUpdate({ address: e.target.value })}
            prefix={<MapPin className="w-4 h-4" />}
            error={error ?? undefined}
            onKeyDown={(e) => { if (e.key === "Enter") handleLookup(); }}
          />
          <Button onClick={handleLookup} loading={loading} size="md" className="w-full">
            Look up my property
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

      <p className="text-xs text-gray-400 text-center">
        We use RentCast to pre-fill your property details. You can edit everything later.
      </p>
    </div>
  );
}

// ─── Step 2: Photos ──────────────────────────────────────────────────────────

function StepPhotos({
  state,
  onUpdate,
  onNext,
  onBack,
}: {
  state: WizardState;
  onUpdate: (u: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  async function uploadPhoto(photo: Photo): Promise<Photo> {
    const formData = new FormData();
    formData.append("file", photo.file);
    formData.append("sessionId", state.sessionId);

    try {
      const res = await fetch("/api/upload/session", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      return { ...photo, url: data.url, path: data.path, uploading: false, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      console.error("[upload]", msg);
      return { ...photo, uploading: false, error: msg };
    }
  }

  async function handleFiles(files: FileList) {
    const newPhotos: Photo[] = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({
        id: `photo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        url: URL.createObjectURL(f),
        path: "",
        room: "Other",
        file: f,
        uploading: true,
        error: null,
      }));

    onUpdate({ photos: [...state.photos, ...newPhotos] });

    const uploaded = await Promise.all(newPhotos.map(uploadPhoto));
    onUpdate({
      photos: [
        ...state.photos.filter((p) => !newPhotos.find((n) => n.id === p.id)),
        ...uploaded,
      ],
    });
  }

  function removePhoto(id: string) {
    onUpdate({ photos: state.photos.filter((p) => p.id !== id) });
  }

  function updateRoom(id: string, room: string) {
    onUpdate({
      photos: state.photos.map((p) => (p.id === id ? { ...p, room } : p)),
    });
  }

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
    },
    [state.photos, state.sessionId], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const canContinue = state.photos.filter((p) => !p.uploading && !p.error).length >= 5;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Upload your photos</h2>
        <p className="text-gray-500">Add at least 5 photos. Tag each one with the room name.</p>
      </div>

      {/* Upload errors */}
      {state.photos.some((p) => p.error) && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {state.photos.filter((p) => p.error).length} photo(s) failed to upload.{" "}
          {state.photos.find((p) => p.error)?.error}
        </div>
      )}

      {/* Drop zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
        )}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground mb-1">
          Drag photos here or click to browse
        </p>
        <p className="text-xs text-gray-400">JPEG, PNG, WebP · Max 20MB per photo · Min 5 photos</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => { if (e.target.files) handleFiles(e.target.files); }}
        />
      </div>

      {/* Photo grid */}
      {state.photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {state.photos.map((photo) => (
            <div key={photo.id} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt="Property photo"
                className={cn(
                  "w-full h-32 object-cover rounded-lg",
                  photo.uploading && "opacity-50",
                )}
              />
              {photo.uploading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {photo.error && (
                <div className="absolute inset-0 bg-red-50/80 flex items-center justify-center rounded-lg">
                  <p className="text-xs text-red-500 text-center px-2">Upload failed</p>
                </div>
              )}
              <button
                onClick={() => removePhoto(photo.id)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5 text-gray-600" />
              </button>
              <select
                value={photo.room}
                onChange={(e) => updateRoom(photo.id, e.target.value)}
                className="absolute bottom-1.5 left-1.5 right-1.5 text-xs bg-white/90 backdrop-blur-sm border border-border rounded-md px-1.5 py-0.5 text-foreground"
              >
                {ROOM_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} size="md" className="flex-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button onClick={onNext} disabled={!canContinue} size="md" className="flex-1">
          Continue
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
      {!canContinue && state.photos.length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          Upload at least 5 photos to continue ({state.photos.filter((p) => !p.uploading && !p.error).length}/5)
        </p>
      )}
    </div>
  );
}

// ─── Step 3: Story ───────────────────────────────────────────────────────────

function StepStory({
  state,
  onUpdate,
  onNext,
  onBack,
  onGenerateAI,
  generating,
}: {
  state: WizardState;
  onUpdate: (u: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
  onGenerateAI: () => void;
  generating: boolean;
}) {
  const PROMPTS = [
    "What made you fall in love with this home?",
    "What are your favorite features?",
    "What's special about the neighborhood?",
    "What will you miss most about living here?",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Tell your home&apos;s story</h2>
        <p className="text-gray-500">
          A personal story helps buyers connect emotionally. Answer a few prompts below.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Story prompts (optional)</p>
            <ul className="space-y-1">
              {PROMPTS.map((p, i) => (
                <li key={i} className="text-sm text-gray-500 flex items-start gap-2">
                  <span className="text-primary mt-0.5">→</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Your story (or notes for AI)
            </label>
            <textarea
              value={state.story}
              onChange={(e) => onUpdate({ story: e.target.value })}
              rows={6}
              placeholder="We loved the morning light in the kitchen and the big backyard for the kids..."
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} size="md" className="flex-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button onClick={onGenerateAI} loading={generating} variant="outline" size="md" className="flex-1 border-primary text-primary hover:bg-primary/5">
          Generate with AI
        </Button>
        <Button onClick={onNext} disabled={generating} size="md" className="flex-1">
          Preview <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 4: Preview ─────────────────────────────────────────────────────────

function StepPreview({
  state,
  onBack,
}: {
  state: WizardState;
  onBack: () => void;
}) {
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submittingEmail, setSubmittingEmail] = useState(false);

  async function captureEmail() {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setSubmittingEmail(true);
    setEmailError(null);
    try {
      await fetch("/api/leads/wizard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          address: state.address,
          sessionId: state.sessionId,
          estimatedValue: state.rentcastData?.estimatedValue,
        }),
      });
      setEmailSubmitted(true);
    } catch {
      // Still allow proceeding
      setEmailSubmitted(true);
    } finally {
      setSubmittingEmail(false);
    }
  }

  const readyPhotos = state.photos.filter((p) => !p.uploading && !p.error);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Your listing preview</h2>
        <p className="text-gray-500">Here&apos;s what your AI-powered listing looks like. Create an account to publish.</p>
      </div>

      {/* Property info */}
      {state.rentcastData && (
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground text-sm">{state.rentcastData.address}</p>
                <p className="text-xs text-gray-500">
                  {state.rentcastData.city}, {state.rentcastData.state} {state.rentcastData.zipCode}
                </p>
              </div>
            </div>
            {(state.rentcastData.bedrooms || state.rentcastData.squareFootage || state.rentcastData.estimatedValue) && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {state.rentcastData.bedrooms && (
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{state.rentcastData.bedrooms}</p>
                    <p className="text-xs text-gray-400">Beds</p>
                  </div>
                )}
                {state.rentcastData.bathrooms && (
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{state.rentcastData.bathrooms}</p>
                    <p className="text-xs text-gray-400">Baths</p>
                  </div>
                )}
                {state.rentcastData.squareFootage && (
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">
                      {state.rentcastData.squareFootage.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">Sq ft</p>
                  </div>
                )}
              </div>
            )}
            {state.rentcastData.estimatedValue && (
              <div className="mt-4 bg-primary/5 border border-primary/20 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-0.5">Estimated value</p>
                <p className="text-xl font-bold text-primary">{fmt(state.rentcastData.estimatedValue)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Photos */}
      {readyPhotos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {readyPhotos.slice(0, 6).map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={photo.id}
              src={photo.url}
              alt={photo.room}
              className="w-full h-24 object-cover rounded-lg"
            />
          ))}
          {readyPhotos.length > 6 && (
            <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-sm text-gray-500 font-medium">+{readyPhotos.length - 6} more</p>
            </div>
          )}
        </div>
      )}

      {/* AI Description */}
      {state.aiDescription ? (
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
              AI-generated description
            </p>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{state.aiDescription}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-5 text-center py-6">
            <p className="text-sm text-gray-500">
              Go back to generate an AI description for your listing.
            </p>
          </CardContent>
        </Card>
      )}

      {/* CTA */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
        <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-3 block" />
        <p className="font-semibold text-foreground mb-1 text-center">Ready to publish?</p>
        <p className="text-sm text-gray-500 mb-4 text-center">
          {emailSubmitted
            ? "Account creation takes 30 seconds. No credit card needed."
            : "Enter your email to save your progress and publish your listing."}
        </p>

        {!emailSubmitted ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
                onKeyDown={(e) => { if (e.key === "Enter") captureEmail(); }}
                placeholder="your@email.com"
                className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <Button size="md" onClick={captureEmail} loading={submittingEmail} className="shrink-0">
                Save
              </Button>
            </div>
            {emailError && <p className="text-xs text-red-500">{emailError}</p>}
            <p className="text-xs text-gray-400 text-center">No spam. Just your listing link when it&apos;s ready.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-primary text-center font-medium">✓ Email saved!</p>
            <Button asChild size="lg" className="w-full">
              <a href={`/signup?email=${encodeURIComponent(email)}`}>Create account &amp; publish listing</a>
            </Button>
          </div>
        )}
      </div>

      <Button variant="ghost" onClick={onBack} size="md" className="w-full">
        <ArrowLeft className="w-4 h-4" /> Edit story
      </Button>
    </div>
  );
}

// ─── Wizard Shell ────────────────────────────────────────────────────────────

export function StartWizard() {
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [state, setState] = useState<WizardState>({
    sessionId: generateSessionId(),
    address: "",
    rentcastData: null,
    photos: [],
    story: "",
    videoUrl: "",
    aiDescription: null,
  });

  function update(u: Partial<WizardState>) {
    setState((s) => ({ ...s, ...u }));
  }

  async function generateAI() {
    setGenerating(true);
    try {
      const photoUrls = state.photos
        .filter((p) => p.path)
        .slice(0, 5)
        .map((p) => p.url);

      const res = await fetch("/api/ai/generate-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: state.address,
          story: state.story,
          rentcastData: state.rentcastData,
          photoUrls,
          mode: "preview",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const desc = data.descriptions?.[0] ?? data.description ?? null;
        update({ aiDescription: desc });
      }
    } catch {
      // Silently fail — user can still proceed
    } finally {
      setGenerating(false);
      setStep(4);
    }
  }

  const progressPct = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((s) => {
              const Icon = s.icon;
              const done = step > s.id;
              const active = step === s.id;
              return (
                <div key={s.id} className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                      done
                        ? "bg-primary text-white"
                        : active
                        ? "bg-primary/10 text-primary border border-primary"
                        : "bg-gray-100 text-gray-400",
                    )}
                  >
                    {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={cn("text-xs", active ? "text-foreground font-medium" : "text-gray-400")}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {step === 1 && (
          <StepAddress
            state={state}
            onUpdate={update}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <StepPhotos
            state={state}
            onUpdate={update}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <StepStory
            state={state}
            onUpdate={update}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
            onGenerateAI={generateAI}
            generating={generating}
          />
        )}
        {step === 4 && (
          <StepPreview
            state={state}
            onBack={() => setStep(3)}
          />
        )}
      </div>
    </div>
  );
}
