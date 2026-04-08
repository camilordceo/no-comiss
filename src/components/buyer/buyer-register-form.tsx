"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

const CITIES = ["Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Otra"];
const TYPES = [
  { value: "apartment", label: "Apartamento" },
  { value: "house", label: "Casa" },
  { value: "studio", label: "Estudio" },
  { value: "commercial", label: "Comercial" },
  { value: "land", label: "Lote" },
];
const TIMELINES = [
  { value: "immediate", label: "Inmediato (ya)" },
  { value: "1_3_months", label: "1 a 3 meses" },
  { value: "3_6_months", label: "3 a 6 meses" },
  { value: "6_plus_months", label: "Más de 6 meses" },
];
const FINANCING = [
  { value: "cash", label: "Contado" },
  { value: "mortgage", label: "Crédito hipotecario" },
  { value: "leasing", label: "Leasing" },
  { value: "undecided", label: "Aún no sé" },
];

export function BuyerRegisterForm() {
  const [step, setStep] = useState(0); // 0 = contact, 1 = preferences, 2 = done
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Contact info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Preferences
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [minBedrooms, setMinBedrooms] = useState(0);
  const [timeline, setTimeline] = useState("");
  const [financing, setFinancing] = useState("");

  function toggleCity(c: string) {
    setCities((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  }
  function toggleType(t: string) {
    setPropertyTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/buyers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          budget_min: budgetMin ? Number(budgetMin) : undefined,
          budget_max: budgetMax ? Number(budgetMax) : undefined,
          preferred_cities: cities,
          preferred_types: propertyTypes,
          min_bedrooms: minBedrooms || undefined,
          buying_timeline: timeline || undefined,
          financing_type: financing || undefined,
          source: "buyer_page",
        }),
      });

      if (!res.ok) throw new Error("Error al guardar");
      setStep(2);
    } catch {
      setError("Algo salió mal. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (step === 2) {
    return (
      <div className="text-center py-6 space-y-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">¡Perfil creado!</h3>
        <p className="text-sm text-gray-500">
          Te notificaremos cuando encontremos inmuebles que encajen con lo que buscas.
          También puedes explorar los inmuebles disponibles ahora.
        </p>
        <Button asChild size="md" className="w-full mt-2">
          <a href="/homes">Ver inmuebles disponibles</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Step 0: Contact */}
      {step === 0 && (
        <>
          <Input
            label="Nombre completo"
            placeholder="Carlos Pérez"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="carlos@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="WhatsApp (opcional)"
            type="tel"
            placeholder="+573001234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <Button
            size="md"
            className="w-full"
            onClick={() => {
              if (!name || !email) { setError("Nombre y email son requeridos"); return; }
              setError("");
              setStep(1);
            }}
          >
            Continuar — definir preferencias
          </Button>
        </>
      )}

      {/* Step 1: Preferences */}
      {step === 1 && (
        <>
          {/* Budget */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">
              Presupuesto (COP)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Mínimo"
                type="number"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
              />
              <Input
                placeholder="Máximo"
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
              />
            </div>
          </div>

          {/* Cities */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">
              Ciudad(es) de interés
            </label>
            <div className="flex flex-wrap gap-2">
              {CITIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCity(c)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs border transition-colors",
                    cities.includes(c)
                      ? "bg-primary text-white border-primary"
                      : "border-border text-gray-600 hover:border-primary"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Property types */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">
              Tipo de inmueble
            </label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => toggleType(t.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs border transition-colors",
                    propertyTypes.includes(t.value)
                      ? "bg-primary text-white border-primary"
                      : "border-border text-gray-600 hover:border-primary"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Min bedrooms */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">
              Mínimo de habitaciones
            </label>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMinBedrooms(n)}
                  className={cn(
                    "w-10 h-10 rounded-[8px] text-sm border transition-colors",
                    minBedrooms === n
                      ? "bg-primary text-white border-primary"
                      : "border-border text-gray-600 hover:border-primary"
                  )}
                >
                  {n === 0 ? "Any" : n}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">
              ¿Cuándo quieres comprar?
            </label>
            <div className="flex flex-wrap gap-2">
              {TIMELINES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTimeline(t.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs border transition-colors",
                    timeline === t.value
                      ? "bg-primary text-white border-primary"
                      : "border-border text-gray-600 hover:border-primary"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Financing */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">
              Forma de pago
            </label>
            <div className="flex flex-wrap gap-2">
              {FINANCING.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFinancing(f.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs border transition-colors",
                    financing === f.value
                      ? "bg-primary text-white border-primary"
                      : "border-border text-gray-600 hover:border-primary"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3">
            <Button variant="outline" size="md" className="flex-1" onClick={() => setStep(0)}>
              Atrás
            </Button>
            <Button size="md" className="flex-1" onClick={handleSubmit} loading={loading}>
              Crear mi perfil
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
