"use client";

import { useState } from "react";
import { MapPin, Loader2, CheckCircle2, AlertCircle, BedDouble, Bath, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WizardData, RentCastResult } from "./types";
import { formatUSD } from "@/lib/utils";

interface Props {
  data: WizardData;
  onUpdate: (u: Partial<WizardData>) => void;
  onNext: () => void;
}

export function StepAddress({ data, onUpdate, onNext }: Props) {
  const [address, setAddress] = useState(data.address);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RentCastResult | null>(data.rentcastData);

  async function handleLookup() {
    if (!address.trim()) { setError("Please enter your home address."); return; }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/rentcast/lookup?address=${encodeURIComponent(address)}`);
      const json = await res.json();
      if (json.property) {
        setResult(json.property);
        onUpdate({ address, rentcastData: json.property });
      } else {
        // No data found — let user fill manually
        onUpdate({ address, rentcastData: null });
      }
    } catch {
      setError("Couldn't reach the lookup service. You can fill in details manually.");
      onUpdate({ address, rentcastData: null });
    } finally {
      setLoading(false);
    }
  }

  function handleContinue() {
    if (!address.trim()) { setError("Please enter your home address."); return; }
    onUpdate({ address, rentcastData: result });
    onNext();
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground">What&apos;s your home address?</h2>
        <p className="text-sm text-gray-500 mt-1">
          We&apos;ll auto-fill your property details and pull comparable sales data.
        </p>
      </div>

      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={address}
          onChange={(e) => { setAddress(e.target.value); setError(null); }}
          onKeyDown={(e) => e.key === "Enter" && handleLookup()}
          placeholder="123 Main St, Austin, TX 78701"
          className="w-full pl-9 pr-4 py-3 rounded-[8px] border border-border bg-[#f0f0f0] text-sm text-foreground placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all"
          autoFocus
          autoComplete="street-address"
        />
      </div>

      {error && (
        <p className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </p>
      )}

      <Button
        type="button"
        size="md"
        variant="outline"
        onClick={handleLookup}
        disabled={loading || !address.trim()}
        className="w-full"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Looking up your property...</>
        ) : (
          "Look up my address"
        )}
      </Button>

      {/* Property data card */}
      {result && (
        <div className="rounded-[8px] border border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            <p className="text-sm font-medium text-foreground">Here&apos;s what we found about your home</p>
          </div>
          <p className="text-sm text-gray-600">{result.formattedAddress}</p>
          <div className="grid grid-cols-3 gap-3">
            {result.bedrooms != null && (
              <Stat icon={BedDouble} label="Beds" value={String(result.bedrooms)} />
            )}
            {result.bathrooms != null && (
              <Stat icon={Bath} label="Baths" value={String(result.bathrooms)} />
            )}
            {result.squareFootage != null && (
              <Stat icon={Ruler} label="Sq ft" value={result.squareFootage.toLocaleString()} />
            )}
          </div>
          {result.estimatedValue && (
            <p className="text-xs text-gray-500">
              Estimated value: <span className="font-semibold text-foreground">{formatUSD(result.estimatedValue)}</span>
            </p>
          )}
        </div>
      )}

      {!result && !loading && address.trim() && (
        <p className="text-xs text-gray-400 text-center">
          Don&apos;t see your address? Continue and fill in your property details manually.
        </p>
      )}

      <Button
        type="button"
        size="md"
        onClick={handleContinue}
        disabled={!address.trim()}
        className="w-full"
      >
        Continue
      </Button>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-white rounded-[8px] border border-border p-3">
      <Icon className="w-4 h-4 text-gray-400" />
      <span className="text-sm font-semibold text-foreground">{value}</span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}
