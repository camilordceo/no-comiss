"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function HeroCalculator() {
  const [value, setValue] = useState(400000);

  const agentFee = value * 0.055;
  const nocomiss = 499 * 3; // Pro plan, 3 months
  const savings = agentFee - nocomiss;

  return (
    <div className="bg-white rounded-[16px] border border-border shadow-md p-5 space-y-4">
      <div>
        <div className="flex justify-between mb-1">
          <label className="text-sm font-medium text-foreground">Your home value</label>
          <span className="text-sm font-bold text-primary">{fmt(value)}</span>
        </div>
        <input
          type="range"
          min={100000}
          max={2000000}
          step={10000}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-full accent-primary h-2 cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>$100K</span>
          <span>$2M</span>
        </div>
      </div>

      {/* Comparison */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[10px] bg-red-50 border border-red-100 p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Agent commission (5.5%)</p>
          <p className="text-xl font-bold text-red-500">{fmt(agentFee)}</p>
          <p className="text-xs text-gray-400 mt-0.5">goes to them</p>
        </div>
        <div className="rounded-[10px] bg-primary/5 border border-primary/20 p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">NoComiss Pro (3 mo)</p>
          <p className="text-xl font-bold text-primary">{fmt(nocomiss)}</p>
          <p className="text-xs text-gray-400 mt-0.5">flat fee</p>
        </div>
      </div>

      {/* Savings */}
      <div className="rounded-[10px] bg-foreground text-white px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">You keep an extra</p>
          <p className="text-2xl font-bold text-primary">{fmt(savings)}</p>
        </div>
        <Link
          href="/start"
          className="flex items-center gap-1.5 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap"
        >
          Start free <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <p className="text-xs text-gray-400 text-center">First week free · No credit card required</p>
    </div>
  );
}
