"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import type { WizardData } from "./types";
import { cn } from "@/lib/utils";

interface Props {
  data: WizardData;
  onUpdate: (u: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const PROMPTS = [
  "What's your favorite room and why?",
  "What will you miss most about living here?",
  "What do neighbors love about this area?",
];

const MIN_CHARS = 50;
const SUGGEST_CHARS = 200;
const MAX_CHARS = 1000;

export function StepStory({ data, onUpdate, onNext, onBack }: Props) {
  const [story, setStory] = useState(data.story);
  const [error, setError] = useState<string | null>(null);

  // Try to use the Web Speech API if available
  function startDictation() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = ((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition) as (new () => {
      lang: string;
      interimResults: boolean;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onresult: (e: any) => void;
      start(): void;
    }) | undefined;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript as string;
      setStory((prev) => (prev ? prev + " " + transcript : transcript));
    };
    recognition.start();
  }

  function handleNext() {
    if (story.trim().length < MIN_CHARS) {
      setError(`Please write at least ${MIN_CHARS} characters. (${story.trim().length}/${MIN_CHARS})`);
      return;
    }
    setError(null);
    onUpdate({ story });
    onNext();
  }

  const charCount = story.length;
  const charColor =
    charCount >= SUGGEST_CHARS && charCount <= 500
      ? "text-primary"
      : charCount > 500
      ? "text-amber-500"
      : "text-gray-400";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Your home&apos;s story</h2>
        <p className="text-sm text-gray-500 mt-1">
          Buyers connect with homes through stories. Be personal — it works.
        </p>
      </div>

      {/* Guided prompts */}
      <div className="space-y-2">
        {PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => setStory((prev) => prev ? `${prev.trimEnd()} ${prompt} ` : `${prompt} `)}
            className="text-left w-full px-3 py-2 rounded-[8px] bg-[#f8f8f8] border border-border text-sm text-gray-600 hover:border-primary/50 hover:bg-primary/5 hover:text-foreground transition-all duration-150"
          >
            &#34;{prompt}&#34;
          </button>
        ))}
      </div>

      {/* Textarea */}
      <div>
        <textarea
          value={story}
          onChange={(e) => { setStory(e.target.value); setError(null); }}
          placeholder="Start writing about your home... click a prompt above to get started."
          rows={6}
          maxLength={MAX_CHARS}
          className="w-full px-3 py-3 rounded-[8px] border border-border bg-[#f0f0f0] text-sm text-foreground placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all resize-none"
        />
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={startDictation}
              className="text-xs text-gray-400 hover:text-primary transition-colors"
              title="Dictate (if your browser supports it)"
            >
              🎤 Dictate
            </button>
            {charCount >= SUGGEST_CHARS && charCount <= 500 && (
              <span className="text-xs text-primary">Looking good!</span>
            )}
          </div>
          <span className={cn("text-xs", charColor)}>
            {charCount}/{MAX_CHARS}
          </span>
        </div>
        {charCount < SUGGEST_CHARS && charCount > 0 && (
          <p className="text-xs text-gray-400 mt-1">
            Aim for {SUGGEST_CHARS}–500 characters for best results.
          </p>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-[8px] px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" size="md" onClick={onBack} className="flex-1">Back</Button>
        <Button type="button" size="md" onClick={handleNext} className="flex-1">Continue</Button>
      </div>
    </div>
  );
}
