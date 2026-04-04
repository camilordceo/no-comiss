"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const HOME_VALUES = [
  { value: "under_200k", label: "Under $200,000" },
  { value: "200k_400k", label: "$200,000 – $400,000" },
  { value: "400k_600k", label: "$400,000 – $600,000" },
  { value: "600k_1m", label: "$600,000 – $1,000,000" },
  { value: "over_1m", label: "Over $1,000,000" },
];

const TIMELINES = [
  { value: "asap", label: "As soon as possible" },
  { value: "1_3_months", label: "1–3 months" },
  { value: "3_6_months", label: "3–6 months" },
  { value: "exploring", label: "Just exploring" },
];

interface InterestFormProps {
  variant?: "hero" | "cta";
}

export function InterestForm({ variant = "hero" }: InterestFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressOrZip, setAddressOrZip] = useState("");
  const [homeValue, setHomeValue] = useState("");
  const [timeline, setTimeline] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName || !email || !addressOrZip || !homeValue || !timeline) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      await fetch("/api/interested-sellers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, addressOrZip, homeValue, timeline }),
      });
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-6">
        <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3" />
        <p className="text-lg font-semibold text-foreground mb-1">
          We&apos;ll be in touch within 24 hours!
        </p>
        <p className="text-sm text-gray-500 mb-4">
          We&apos;ll send you a free home value estimate and answer any questions.
        </p>
        <Button asChild size="md">
          <a href="/start">See your home&apos;s AI listing preview</a>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {variant === "hero" && (
        <div className="flex items-center gap-2 mb-2">
          <Home className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Get your free home value estimate</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Input
          placeholder="Full name *"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="col-span-2 sm:col-span-1"
        />
        <Input
          type="email"
          placeholder="Email address *"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="col-span-2 sm:col-span-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          type="tel"
          placeholder="Phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="col-span-2 sm:col-span-1"
        />
        <Input
          placeholder="Address or ZIP code *"
          value={addressOrZip}
          onChange={(e) => setAddressOrZip(e.target.value)}
          required
          className="col-span-2 sm:col-span-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1 flex flex-col gap-1.5">
          <select
            value={homeValue}
            onChange={(e) => setHomeValue(e.target.value)}
            required
            className="h-11 w-full rounded-[8px] border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white transition-colors"
          >
            <option value="" disabled>Estimated home value *</option>
            {HOME_VALUES.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1 flex flex-col gap-1.5">
          <select
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
            required
            className="h-11 w-full rounded-[8px] border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white transition-colors"
          >
            <option value="" disabled>How soon to sell? *</option>
            {TIMELINES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" size="lg" className="w-full" loading={loading}>
        Get My Free Home Value Estimate
        <ArrowRight className="w-4 h-4" />
      </Button>

      <p className="text-xs text-gray-400 text-center">
        No spam. No obligation. We&apos;ll contact you within 24 hours.
      </p>
    </form>
  );
}
