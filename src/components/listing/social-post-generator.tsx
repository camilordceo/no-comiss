"use client";

import { useState } from "react";
import { Sparkles, Copy, Check, Loader2, Video } from "lucide-react";

// Brand icons removed from lucide-react v1+
function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}
function IconFacebook({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}
function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  listingId: string;
}

const PLATFORMS = [
  { id: "instagram", label: "Instagram",    icon: IconInstagram, color: "text-pink-500" },
  { id: "facebook",  label: "Facebook",     icon: IconFacebook,  color: "text-blue-600" },
  { id: "twitter",   label: "X / Twitter",  icon: IconX,         color: "text-gray-800" },
  { id: "tiktok",    label: "TikTok script", icon: Video,        color: "text-foreground" },
] as const;

type Platform = typeof PLATFORMS[number]["id"];

export function SocialPostGenerator({ listingId }: Props) {
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [post, setPost] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setGenerating(true);
    setError(null);
    setPost(null);
    try {
      const res = await fetch("/api/ai/social-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listingId, platform }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setPost(data.post);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate post");
    } finally {
      setGenerating(false);
    }
  }

  async function copy() {
    if (!post) return;
    await navigator.clipboard.writeText(post);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => { setPlatform(p.id); setPost(null); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all",
                platform === p.id
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-gray-500 hover:border-gray-300"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", platform === p.id ? "text-primary" : p.color)} />
              {p.label}
            </button>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        size="md"
        onClick={generate}
        disabled={generating}
        className="w-full border-primary text-primary hover:bg-primary/5"
      >
        {generating ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Writing {platform} post...</>
        ) : (
          <><Sparkles className="w-4 h-4" /> Generate {PLATFORMS.find((p) => p.id === platform)?.label} post</>
        )}
      </Button>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      {post && (
        <div className="relative">
          <textarea
            value={post}
            onChange={(e) => setPost(e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          />
          <button
            type="button"
            onClick={copy}
            className="absolute top-2 right-2 flex items-center gap-1.5 text-xs bg-white border border-border rounded-md px-2 py-1 hover:bg-surface transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied!" : "Copy"}
          </button>
          <p className="text-xs text-gray-400 mt-1.5">Edit the post above, then copy and paste it to {platform}.</p>
        </div>
      )}
    </div>
  );
}
