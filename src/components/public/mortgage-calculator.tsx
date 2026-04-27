"use client";

import { useMemo, useState } from "react";
import { formatPrice } from "@/lib/utils/format";

interface Props {
  basePrice: number;
}

export function MortgageCalculator({ basePrice }: Props) {
  const [price, setPrice] = useState<number>(Math.max(0, Math.round(basePrice)));
  const [downPct, setDownPct] = useState<number>(20);
  const [rate, setRate] = useState<number>(6.5);
  const [termYears, setTermYears] = useState<number>(30);

  const { monthly, principal, downPayment } = useMemo(() => {
    const dp = (price * downPct) / 100;
    const p = Math.max(0, price - dp);
    const r = rate / 100 / 12;
    const n = termYears * 12;
    if (p <= 0 || r <= 0 || n <= 0) {
      return { monthly: 0, principal: p, downPayment: dp };
    }
    const m = (p * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
    return {
      monthly: Number.isFinite(m) ? Math.round(m) : 0,
      principal: p,
      downPayment: dp,
    };
  }, [price, downPct, rate, termYears]);

  return (
    <div className="border border-rule bg-ivory p-6 md:p-7">
      <div className="eyebrow mb-4">Monthly payment estimate</div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-x-8">
        <NumberField
          label="Home price"
          prefix="$"
          value={price}
          onChange={setPrice}
          step={1000}
          min={0}
        />
        <NumberField
          label="Down payment"
          suffix="%"
          value={downPct}
          onChange={setDownPct}
          step={1}
          min={0}
          max={100}
        />
        <NumberField
          label="Interest rate"
          suffix="%"
          value={rate}
          onChange={setRate}
          step={0.125}
          min={0}
          max={25}
        />
        <NumberField
          label="Loan term"
          suffix="yr"
          value={termYears}
          onChange={setTermYears}
          step={1}
          min={5}
          max={40}
        />
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-rule pt-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-text-3">
            Estimated monthly payment
          </div>
          <div className="mt-1 font-serif text-4xl font-medium leading-none text-text md:text-5xl">
            {formatPrice(monthly)}
          </div>
          <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-3">
            {formatPrice(downPayment)} down · {formatPrice(principal)} financed
          </div>
        </div>
        <p className="max-w-xs text-xs text-text-3">
          Estimate only. Principal &amp; interest. Excludes taxes, insurance,
          HOA. Not a loan offer.
        </p>
      </div>
    </div>
  );
}

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  prefix?: string;
  suffix?: string;
}

function NumberField({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
  prefix,
  suffix,
}: NumberFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-text-3">
        {label}
      </span>
      <div className="relative">
        {prefix ? (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-base text-text-3">
            {prefix}
          </span>
        ) : null}
        <input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => {
            const next = e.target.valueAsNumber;
            onChange(Number.isFinite(next) ? next : 0);
          }}
          step={step}
          min={min}
          max={max}
          inputMode="decimal"
          className={`block h-11 w-full rounded-sm border border-rule-strong bg-paper text-base text-text outline-none transition-colors focus:border-espresso ${
            prefix ? "pl-7" : "pl-3.5"
          } ${suffix ? "pr-9" : "pr-3.5"}`}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-text-3">
            {suffix}
          </span>
        ) : null}
      </div>
    </label>
  );
}
