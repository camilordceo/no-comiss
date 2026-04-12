"use client";

import { useState } from "react";
import { formatUSD } from "@/lib/utils";

interface Props {
  price: number;
}

function calcMonthly(principal: number, annualRate: number, years: number): number {
  if (!principal || !annualRate || !years) return 0;
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function MortgageCalculator({ price }: Props) {
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(7.0);
  const [years, setYears] = useState(30);

  const downAmount = Math.round(price * (downPct / 100));
  const principal = price - downAmount;
  const monthly = calcMonthly(principal, rate, years);

  return (
    <div className="rounded-[12px] border border-border p-5 space-y-4">
      <h2 className="text-lg font-semibold text-foreground">What would your payment be?</h2>

      <div className="grid grid-cols-3 gap-3">
        {/* Down payment */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Down payment</label>
          <div className="relative">
            <input
              type="number"
              value={downPct}
              onChange={(e) => setDownPct(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
              min={0}
              max={100}
              step={5}
              className="w-full pl-3 pr-6 py-2.5 rounded-[8px] border border-border bg-[#f0f0f0] text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{formatUSD(downAmount)}</p>
        </div>

        {/* Rate */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Interest rate</label>
          <div className="relative">
            <input
              type="number"
              value={rate}
              onChange={(e) => setRate(Math.min(20, Math.max(0.1, parseFloat(e.target.value) || 0)))}
              min={0.1}
              max={20}
              step={0.1}
              className="w-full pl-3 pr-6 py-2.5 rounded-[8px] border border-border bg-[#f0f0f0] text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
          </div>
        </div>

        {/* Term */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Loan term</label>
          <select
            value={years}
            onChange={(e) => setYears(parseInt(e.target.value))}
            className="w-full px-3 py-2.5 rounded-[8px] border border-border bg-[#f0f0f0] text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          >
            <option value={10}>10 yr</option>
            <option value={15}>15 yr</option>
            <option value={20}>20 yr</option>
            <option value={30}>30 yr</option>
          </select>
        </div>
      </div>

      {/* Result */}
      {monthly > 0 && (
        <div className="rounded-[8px] bg-[#f8f8f8] border border-border px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-600">Est. monthly payment</span>
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">{formatUSD(monthly)}<span className="text-sm font-normal text-gray-400">/mo</span></p>
            <p className="text-xs text-gray-400 mt-0.5">Principal & interest only · {downPct}% down</p>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Estimate only. Does not include taxes, insurance, or HOA. Contact a lender for accurate rates.
      </p>
    </div>
  );
}
