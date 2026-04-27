"use client";

import { useState } from "react";
import { Check, Facebook, Link2, Mail, Twitter } from "lucide-react";
import { logger } from "@/lib/utils/logger";

interface Props {
  baseUrl: string; // canonical /homes/[slug] URL, no query
  title: string;
}

export function ShareButtons({ baseUrl, title }: Props) {
  const [copied, setCopied] = useState(false);

  const withUtm = (medium: string) => `${baseUrl}?utm_source=share&utm_medium=${medium}`;

  const onCopy = async () => {
    const link = withUtm("copy");
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      logger.info("public.share_copy", { baseUrl });
    } catch {
      window.prompt("Copy this link:", link);
    }
  };

  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(withUtm("facebook"))}`;
  const twitterHref = `https://twitter.com/intent/tweet?url=${encodeURIComponent(withUtm("twitter"))}&text=${encodeURIComponent(title)}`;
  const emailHref = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${title}\n\n${withUtm("email")}`)}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex items-center gap-2 rounded-sm border border-rule-strong bg-ivory px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text transition-colors hover:border-espresso"
      >
        {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Link2 className="h-3.5 w-3.5" aria-hidden />}
        {copied ? "Copied" : "Copy link"}
      </button>
      <a
        href={facebookHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-sm border border-rule-strong bg-ivory px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text transition-colors hover:border-espresso"
        onClick={() => logger.info("public.share_click", { medium: "facebook" })}
      >
        <Facebook className="h-3.5 w-3.5" aria-hidden /> Facebook
      </a>
      <a
        href={twitterHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-sm border border-rule-strong bg-ivory px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text transition-colors hover:border-espresso"
        onClick={() => logger.info("public.share_click", { medium: "twitter" })}
      >
        <Twitter className="h-3.5 w-3.5" aria-hidden /> X / Twitter
      </a>
      <a
        href={emailHref}
        className="inline-flex items-center gap-2 rounded-sm border border-rule-strong bg-ivory px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text transition-colors hover:border-espresso"
        onClick={() => logger.info("public.share_click", { medium: "email" })}
      >
        <Mail className="h-3.5 w-3.5" aria-hidden /> Email
      </a>
    </div>
  );
}
