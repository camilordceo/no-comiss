"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, AlertTriangle, MapPin, BedDouble, Ruler, Calendar } from "lucide-react";
import type { WizardData, RentCastComp } from "./types";
import { formatUSD } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  data: WizardData;
  onUpdate: (u: Partial<WizardData>) => void;
  onSubmit: () => void;
  onBack: () => void;
  submitting: boolean;
}

function PriceWarning({ askingPrice, low, high }: { askingPrice: number; low: number; high: number }) {
  if (!askingPrice) return null;
  if (askingPrice > high * 1.1) {
    return (
      <div className="flex items-start gap-2 rounded-[8px] bg-amber-50 border border-amber-200 p-3">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700">
          This is above the estimated range. Overpriced homes take 2x longer to sell — consider pricing closer to the estimate.
        </p>
      </div>
    );
  }
  if (askingPrice < low * 0.9) {
    return (
      <div className="flex items-start gap-2 rounded-[8px] bg-blue-50 border border-blue-200 p-3">
        <TrendingDown className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">
          Aggressive pricing can attract more buyers and competing offers — just make sure it works for your situation.
        </p>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 rounded-[8px] bg-primary/5 border border-primary/20 p-3">
      <TrendingUp className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <p className="text-sm text-primary">
        Great pricing — within the estimated range. This should attract strong buyer interest.
      </p>
    </div>
  );
}

function CompCard({ comp }: { comp: RentCastComp }) {
  const date = comp.listedDate ? new Date(comp.listedDate).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : null;
  return (
    <div className="rounded-[8px] border border-border bg-[#f8f8f8] p-3 space-y-2">
      <div className="flex items-start gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
        <p className="text-xs text-gray-600 leading-tight">{comp.formattedAddress}</p>
      </div>
      <p className="text-base font-semibold text-foreground">{formatUSD(comp.price)}</p>
      <div className="flex items-center gap-3 text-xs text-gray-500">
        {comp.bedrooms && <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" />{comp.bedrooms}bd</span>}
        {comp.squareFootage && <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{comp.squareFootage.toLocaleString()} sqft</span>}
        {date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{date}</span>}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{comp.distance?.toFixed(1)} mi away</span>
        <span className="text-xs text-primary font-medium">{Math.round((comp.correlation ?? 0) * 100)}% match</span>
      </div>
    </div>
  );
}

export function StepPricing({ data, onUpdate, onSubmit, onBack, submitting }: Props) {
  const avm = data.rentcastData;
  const estimated = avm?.estimatedValue;
  const low = avm?.priceRangeLow;
  const high = avm?.priceRangeHigh;
  const comps = avm?.comparables ?? [];

  const [priceStr, setPriceStr] = useState(
    data.askingPrice ? String(data.askingPrice) : estimated ? String(estimated) : ""
  );
  const [error, setError] = useState<string | null>(null);

  const askingPrice = parseFloat(priceStr.replace(/[^0-9.]/g, "")) || 0;

  function formatInput(raw: string) {
    const num = raw.replace(/[^0-9]/g, "");
    return num ? parseInt(num).toLocaleString("en-US") : "";
  }

  function handleSubmit() {
    if (!askingPrice || askingPrice < 10_000) {
      setError("Please enter a valid asking price (minimum $10,000).");
      return;
    }
    setError(null);
    onUpdate({ askingPrice });
    onSubmit();
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Set your asking price</h2>
        <p className="text-sm text-gray-500 mt-1">
          {estimated ? "We analyzed comparable sales to estimate your home's value." : "Enter your asking price to complete your listing."}
        </p>
      </div>

      {/* AVM range */}
      {estimated && low && high && (
        <div className="rounded-[12px] border border-border bg-[#f8f8f8] p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">AI estimated value</p>
          <div className="flex items-end gap-3">
            <p className="text-3xl font-semibold text-foreground">{formatUSD(estimated)}</p>
            <p className="text-sm text-gray-500 mb-1">estimated</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Range: {formatUSD(low)} – {formatUSD(high)}</span>
          </div>
          {/* Range bar */}
          <div className="relative h-2 bg-[#e5e5e5] rounded-full">
            <div
              className="absolute h-full bg-primary/30 rounded-full"
              style={{
                left: "0%",
                width: "100%",
              }}
            />
            <div
              className="absolute h-full bg-primary rounded-full"
              style={{
                left: `${Math.max(0, ((estimated - low) / (high - low)) * 80)}%`,
                width: "20%",
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>{formatUSD(low)}</span>
            <span>{formatUSD(high)}</span>
          </div>
        </div>
      )}

      {/* Price input */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Your asking price</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">$</span>
          <input
            type="text"
            inputMode="numeric"
            value={priceStr ? formatInput(priceStr) : ""}
            onChange={(e) => { setPriceStr(e.target.value.replace(/[^0-9]/g, "")); setError(null); }}
            placeholder="450,000"
            className="w-full pl-7 pr-3 py-3 rounded-[8px] border border-border bg-[#f0f0f0] text-sm text-foreground placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all text-lg font-semibold"
          />
        </div>
      </div>

      {/* Pricing feedback */}
      {askingPrice > 0 && low && high && (
        <PriceWarning askingPrice={askingPrice} low={low} high={high} />
      )}

      {/* Comparable sales */}
      {comps.length > 0 && (
        <div>
          <p className="text-sm font-medium text-foreground mb-3">Comparable recent sales</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {comps.slice(0, 4).map((comp, i) => (
              <CompCard key={i} comp={comp} />
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-[8px] px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" size="md" onClick={onBack} className="flex-1">Back</Button>
        <Button
          type="button"
          size="md"
          onClick={handleSubmit}
          disabled={submitting || !askingPrice}
          loading={submitting}
          className="flex-1"
        >
          {submitting ? "Creating listing..." : "Create my listing"}
        </Button>
      </div>
    </div>
  );
}
