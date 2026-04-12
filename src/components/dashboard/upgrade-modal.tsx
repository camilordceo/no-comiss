"use client";

import { useState } from "react";
import { X, CheckCircle2, Zap, Star, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  trigger: React.ReactNode;
  reason?: string;
}

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 99,
    desc: "Organic reach only",
    bestFor: "Homes under $300K",
    icon: Zap,
    features: [
      "AI listing description",
      "Your own listing mini-site",
      "AI buyer agent via email",
      "Up to 50 photos",
      "Basic analytics",
    ],
    cta: "Start free week",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 499,
    desc: "Paid ads included",
    bestFor: "Most sellers",
    icon: Star,
    features: [
      "Everything in Starter",
      "Facebook & Instagram ads",
      "Google search ads",
      "AI offer analysis",
      "Priority support",
    ],
    cta: "Start free week",
    highlighted: true,
  },
  {
    id: "elite",
    name: "Elite",
    price: 999,
    desc: "Full service",
    bestFor: "Premium & luxury",
    icon: Crown,
    features: [
      "Everything in Pro",
      "~$500/mo ad budget",
      "Professional photography",
      "Dedicated support",
      "Closing concierge",
    ],
    cta: "Contact us",
    highlighted: false,
  },
] as const;

export function UpgradeModal({ trigger, reason }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span onClick={() => setOpen(true)} className="cursor-pointer">{trigger}</span>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between p-6 pb-4 border-b border-border">
              <div>
                <p className="font-bold text-lg text-foreground">Activate your plan</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {reason ?? "Choose a plan to publish your listing and start receiving buyer leads."}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Plans */}
            <div className="p-6 grid sm:grid-cols-3 gap-4">
              {PLANS.map((plan) => {
                const Icon = plan.icon;
                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "rounded-xl border p-5 flex flex-col",
                      plan.highlighted
                        ? "border-primary bg-primary/3 shadow-sm relative"
                        : "border-border"
                    )}
                  >
                    {plan.highlighted && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-semibold px-3 py-0.5 rounded-full">
                        Most popular
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        plan.highlighted ? "bg-primary/10" : "bg-surface"
                      )}>
                        <Icon className={cn("w-4 h-4", plan.highlighted ? "text-primary" : "text-gray-500")} />
                      </div>
                      <p className="font-semibold text-foreground">{plan.name}</p>
                    </div>

                    <div className="mb-1">
                      <span className="text-3xl font-bold text-foreground">${plan.price}</span>
                      <span className="text-gray-500 text-sm">/mo</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-4">{plan.desc} · Best for: {plan.bestFor}</p>

                    <ul className="space-y-1.5 flex-1 mb-5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <Button
                      asChild
                      size="md"
                      variant={plan.highlighted ? "primary" : "outline"}
                      className="w-full"
                    >
                      <a href={`/signup?plan=${plan.id}`} onClick={() => setOpen(false)}>
                        {plan.cta}
                      </a>
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="px-6 pb-5 text-center">
              <p className="text-xs text-gray-400">
                First week free on all plans · Cancel anytime · No credit card required to start
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
