"use client";

import { useState, useTransition } from "react";
import { TrendingUp, DollarSign, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatCOP } from "@/lib/utils";

const CITIES = ["Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Otra"];

const PLANS = [
  { name: "Starter", price: 100, months: 3 },
  { name: "Pro", price: 350, months: 3 },
  { name: "Elite", price: 1000, months: 3 },
] as const;

// USD to COP approximate rate
const USD_TO_COP = 4100;

function formatCOPShort(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `$${Math.round(amount / 1_000_000)}M`;
  }
  return formatCOP(amount);
}

export function CommissionCalculator() {
  const [homeValue, setHomeValue] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const numValue = parseFloat(homeValue.replace(/\./g, "").replace(",", ".")) || 0;
  const hasValue = numValue > 0;

  const traditional5 = numValue * 0.05;
  const traditional55 = numValue * 0.055;
  const traditional6 = numValue * 0.06;

  const bestPlan = PLANS[1]; // Pro
  const nocomissCost = bestPlan.price * USD_TO_COP * bestPlan.months;
  const savings55 = traditional55 - nocomissCost;
  const savingsPct = traditional55 > 0 ? Math.round((savings55 / traditional55) * 100) : 0;

  function handleValueChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^\d]/g, "");
    if (!raw) { setHomeValue(""); return; }
    const formatted = parseInt(raw, 10).toLocaleString("es-CO");
    setHomeValue(formatted);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !city || !numValue) {
      setError("Completa todos los campos para ver tu ahorro personalizado.");
      return;
    }
    setError("");

    startTransition(async () => {
      try {
        await fetch("/api/leads/calculator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            city,
            home_value: numValue,
            traditional_commission: traditional55,
            savings_estimate: savings55,
          }),
        });
        setSubmitted(true);
      } catch {
        // Still show results even if save fails
        setSubmitted(true);
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* Input card */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Input
              label="Valor de tu inmueble (COP)"
              placeholder="450.000.000"
              value={homeValue}
              onChange={handleValueChange}
              prefix={<DollarSign className="w-4 h-4" />}
              hint="Ingresa el precio al que quieres vender"
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Ciudad</label>
              <div className="flex flex-wrap gap-2">
                {CITIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCity(c)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm border transition-colors duration-150",
                      city === c
                        ? "bg-primary text-white border-primary"
                        : "border-border text-gray-600 hover:border-primary hover:text-primary"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {hasValue && (
        <div className="space-y-4">
          {/* Comparison */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-semibold text-foreground mb-4">Comparación de costos</p>

              <div className="space-y-3">
                {/* Traditional */}
                <div className="rounded-[8px] bg-red-50 border border-red-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">Agente tradicional</p>
                    <p className="text-xs text-red-500 font-medium">5–6% de comisión</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Comisión mínima (5%)</span>
                      <span className="text-red-500 font-medium">{formatCOPShort(traditional5)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Promedio (5.5%)</span>
                      <span className="text-red-500 font-medium">{formatCOPShort(traditional55)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Comisión máxima (6%)</span>
                      <span className="text-red-500 font-medium">{formatCOPShort(traditional6)}</span>
                    </div>
                  </div>
                </div>

                {/* NoComiss */}
                <div className="rounded-[8px] bg-primary/5 border border-primary/20 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">NoComiss Pro</p>
                    <p className="text-xs text-primary font-medium">$350 USD/mes</p>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>3 meses (tiempo promedio de venta)</span>
                    <span className="text-primary font-medium">{formatCOPShort(nocomissCost)}</span>
                  </div>
                </div>
              </div>

              {/* Savings highlight */}
              {savings55 > 0 && (
                <div className="mt-4 rounded-[8px] bg-foreground text-white p-4 text-center">
                  <p className="text-xs text-gray-300 mb-1">Tu ahorro estimado</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatCOPShort(savings55)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {savingsPct}% menos que con un agente tradicional
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Savings bar */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-semibold text-foreground mb-4">
                ¿De {formatCOPShort(numValue)}, cuánto recibes tú?
              </p>
              <div className="space-y-3">
                {/* Traditional bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Agente tradicional</span>
                    <span className="font-medium text-foreground">
                      {formatCOPShort(numValue - traditional55)}
                    </span>
                  </div>
                  <div className="h-4 bg-red-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-300 rounded-full transition-all duration-500"
                      style={{ width: `${((numValue - traditional55) / numValue) * 100}%` }}
                    />
                  </div>
                </div>

                {/* NoComiss bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">NoComiss Pro</span>
                    <span className="font-medium text-primary">
                      {formatCOPShort(numValue - nocomissCost)}
                    </span>
                  </div>
                  <div className="h-4 bg-primary/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${((numValue - nocomissCost) / numValue) * 100}%` }}
                    />
                  </div>
                </div>
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
                      Recibe un análisis personalizado de tu propiedad
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Precio de mercado, comparables en tu zona y estrategia de venta — gratis.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <Input
                    label="Tu correo electrónico"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  {error && <p className="text-xs text-red-500">{error}</p>}
                  <Button
                    type="submit"
                    size="md"
                    className="w-full"
                    loading={isPending}
                  >
                    Ver análisis gratuito
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <p className="text-xs text-gray-400 text-center">
                    Sin spam. Solo información útil sobre tu venta.
                  </p>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-3" />
                <p className="font-semibold text-foreground mb-1">
                  Listo. Revisa tu correo en los próximos minutos.
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Te enviamos el análisis completo de tu propiedad.
                </p>
                <Button asChild size="md" className="w-full">
                  <a href="/signup">Publicar mi inmueble ahora</a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
