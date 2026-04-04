"use client";

import { useState } from "react";
import { DollarSign, ArrowRight, CheckCircle2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const PLANS = [
  { name: "Starter", price: 99, months: 3 },
  { name: "Pro", price: 499, months: 3 },
  { name: "Elite", price: 999, months: 3 },
];

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function CommissionCalculator() {
  const [rawValue, setRawValue] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const numValue = parseFloat(rawValue.replace(/[^0-9.]/g, "")) || 0;
  const hasValue = numValue >= 50_000;

  const commission5 = numValue * 0.05;
  const commission55 = numValue * 0.055;
  const commission6 = numValue * 0.06;

  const bestPlan = PLANS[1]; // Pro
  const nocomissCost = bestPlan.price * bestPlan.months;
  const savings = commission55 - nocomissCost;
  const savingsPct = commission55 > 0 ? Math.round((savings / commission55) * 100) : 0;

  function handleValueChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    if (!raw) { setRawValue(""); return; }
    setRawValue(parseInt(raw, 10).toLocaleString("en-US"));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/leads/calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          city: "US",
          home_value: numValue,
          traditional_commission: commission55,
          savings_estimate: savings,
        }),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Input */}
      <Card>
        <CardContent className="pt-6">
          <Input
            label="Your home's estimated value"
            placeholder="400,000"
            value={rawValue}
            onChange={handleValueChange}
            prefix={<DollarSign className="w-4 h-4" />}
            hint="Enter the price you expect to list at"
          />
        </CardContent>
      </Card>

      {hasValue && (
        <>
          {/* Comparison */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-semibold text-foreground mb-4">Cost comparison</p>
              <div className="space-y-3">
                <div className="rounded-[8px] bg-red-50 border border-red-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">Traditional agent</p>
                    <span className="text-xs text-red-500 font-medium">5–6% commission</span>
                  </div>
                  <div className="space-y-1">
                    {[
                      { label: "Minimum (5%)", val: commission5 },
                      { label: "Average (5.5%)", val: commission55 },
                      { label: "Maximum (6%)", val: commission6 },
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between text-xs text-gray-500">
                        <span>{row.label}</span>
                        <span className="text-red-500 font-medium">{fmt(row.val)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[8px] bg-primary/5 border border-primary/20 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">NoComiss Pro</p>
                    <span className="text-xs text-primary font-medium">$499/month</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>3 months (avg. time to sell)</span>
                    <span className="text-primary font-medium">{fmt(nocomissCost)}</span>
                  </div>
                </div>
              </div>

              {savings > 0 && (
                <div className="mt-4 rounded-[8px] bg-foreground text-white p-4 text-center">
                  <p className="text-xs text-gray-300 mb-1">Your estimated savings</p>
                  <p className="text-3xl font-bold text-primary">{fmt(savings)}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {savingsPct}% less than paying a traditional agent
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bars */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-semibold text-foreground mb-4">
                From {fmt(numValue)}, how much do you keep?
              </p>
              <div className="space-y-4">
                {[
                  {
                    label: "Traditional agent",
                    net: numValue - commission55,
                    color: "bg-red-300",
                    track: "bg-red-100",
                  },
                  {
                    label: "NoComiss Pro",
                    net: numValue - nocomissCost,
                    color: "bg-primary",
                    track: "bg-primary/10",
                    highlight: true,
                  },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className={cn("text-gray-500", row.highlight && "text-primary font-medium")}>
                        {row.label}
                      </span>
                      <span className={cn("font-semibold", row.highlight ? "text-primary" : "text-foreground")}>
                        {fmt(row.net)}
                      </span>
                    </div>
                    <div className={cn("h-3 rounded-full overflow-hidden", row.track)}>
                      <div
                        className={cn("h-full rounded-full transition-all duration-700", row.color)}
                        style={{ width: `${(row.net / numValue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lead capture */}
          {!submitted ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 mb-4">
                  <TrendingUp className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Get a free personalized home value report
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Comparable sales, price trends, and a selling strategy for your specific market.
                    </p>
                  </div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <Input
                    label="Your email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Button type="submit" size="md" className="w-full" loading={submitting}>
                    Send me the free report
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <p className="text-xs text-gray-400 text-center">
                    No spam. Unsubscribe anytime.
                  </p>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-3" />
                <p className="font-semibold text-foreground mb-1">Check your inbox!</p>
                <p className="text-sm text-gray-500 mb-4">
                  Your free home value report is on its way.
                </p>
                <Button asChild size="md" className="w-full">
                  <a href="/start">Start selling now — first week free</a>
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
