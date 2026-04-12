"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { WizardData, PropertyType } from "./types";
import { PROPERTY_TYPES } from "./types";
import { cn } from "@/lib/utils";

interface Props {
  data: WizardData;
  onUpdate: (u: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
  placeholder,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={step ?? 1}
          placeholder={placeholder ?? "0"}
          className="w-full px-3 py-2.5 rounded-[8px] border border-border bg-[#f0f0f0] text-sm text-foreground placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export function StepDetails({ data, onUpdate, onNext, onBack }: Props) {
  const [propertyType, setPropertyType] = useState<PropertyType>(data.propertyType);
  const [bedrooms, setBedrooms] = useState(data.bedrooms);
  const [bathrooms, setBathrooms] = useState(data.bathrooms);
  const [sqft, setSqft] = useState(data.sqft || data.rentcastData?.squareFootage || 0);
  const [lotSqft, setLotSqft] = useState(data.lotSqft || data.rentcastData?.lotSize || 0);
  const [yearBuilt, setYearBuilt] = useState(data.yearBuilt || data.rentcastData?.yearBuilt || 0);
  const [stories, setStories] = useState(data.stories || data.rentcastData?.stories || 1);
  const [garageSpaces, setGarageSpaces] = useState(data.garageSpaces || data.rentcastData?.garage || 0);
  const [hoaMonthly, setHoaMonthly] = useState(data.hoaMonthly);
  const [error, setError] = useState<string | null>(null);

  function handleNext() {
    if (!sqft) { setError("Please enter the square footage."); return; }
    if (!bedrooms) { setError("Please enter the number of bedrooms."); return; }
    setError(null);
    onUpdate({ propertyType, bedrooms, bathrooms, sqft, lotSqft, yearBuilt, stories, garageSpaces, hoaMonthly });
    onNext();
  }

  const prefilled = !!data.rentcastData;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Property details</h2>
        <p className="text-sm text-gray-500 mt-1">
          {prefilled ? "We pre-filled these from public records. Correct anything that's off." : "Tell buyers about your home."}
        </p>
      </div>

      {/* Property type */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Property type</label>
        <div className="grid grid-cols-2 gap-2">
          {PROPERTY_TYPES.map((pt) => (
            <button
              key={pt.value}
              type="button"
              onClick={() => setPropertyType(pt.value)}
              className={cn(
                "px-3 py-2.5 rounded-[8px] text-sm font-medium border transition-all duration-150 text-left",
                propertyType === pt.value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-[#f0f0f0] text-foreground hover:border-gray-300"
              )}
            >
              {pt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Beds & Baths */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Bedrooms</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setBedrooms(Math.max(0, bedrooms - 1))}
              className="w-9 h-9 rounded-[8px] border border-border bg-[#f0f0f0] text-foreground flex items-center justify-center hover:border-primary transition-colors font-medium"
            >
              −
            </button>
            <span className="flex-1 text-center text-sm font-semibold text-foreground">{bedrooms}</span>
            <button
              type="button"
              onClick={() => setBedrooms(bedrooms + 1)}
              className="w-9 h-9 rounded-[8px] border border-border bg-[#f0f0f0] text-foreground flex items-center justify-center hover:border-primary transition-colors font-medium"
            >
              +
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Bathrooms</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setBathrooms(Math.max(0, Math.round((bathrooms - 0.5) * 10) / 10))}
              className="w-9 h-9 rounded-[8px] border border-border bg-[#f0f0f0] text-foreground flex items-center justify-center hover:border-primary transition-colors font-medium"
            >
              −
            </button>
            <span className="flex-1 text-center text-sm font-semibold text-foreground">{bathrooms}</span>
            <button
              type="button"
              onClick={() => setBathrooms(Math.round((bathrooms + 0.5) * 10) / 10)}
              className="w-9 h-9 rounded-[8px] border border-border bg-[#f0f0f0] text-foreground flex items-center justify-center hover:border-primary transition-colors font-medium"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Numeric fields */}
      <div className="grid grid-cols-2 gap-3">
        <NumberInput label="Square footage" value={sqft} onChange={setSqft} min={0} placeholder="2,100" />
        <NumberInput label="Lot size" value={lotSqft} onChange={setLotSqft} min={0} suffix="sq ft" placeholder="6,000" />
        <NumberInput label="Year built" value={yearBuilt} onChange={setYearBuilt} min={1800} max={new Date().getFullYear()} placeholder="1995" />
        <NumberInput label="Stories" value={stories} onChange={setStories} min={1} max={4} />
        <NumberInput label="Garage spaces" value={garageSpaces} onChange={setGarageSpaces} min={0} max={6} />
        <NumberInput label="HOA monthly" value={hoaMonthly} onChange={setHoaMonthly} min={0} suffix="$/mo" placeholder="0" />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-[8px] px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" size="md" onClick={onBack} className="flex-1">Back</Button>
        <Button type="button" size="md" onClick={handleNext} className="flex-1">Continue</Button>
      </div>
    </div>
  );
}
