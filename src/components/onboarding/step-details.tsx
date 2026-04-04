"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WizardData } from "./wizard";

const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartamento" },
  { value: "house", label: "Casa" },
  { value: "studio", label: "Estudio" },
  { value: "commercial", label: "Comercial" },
  { value: "land", label: "Lote" },
] as const;

const AMENITIES = [
  "Piscina", "Gimnasio", "Terraza", "Jardín", "Portería 24h", "Parqueadero visitantes",
  "Salón comunal", "BBQ", "Cuarto útil", "Depósito", "Ascensor", "Vigilancia",
];

interface Props {
  data: WizardData;
  updateData: (d: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  max = 99,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <div className="flex items-center border border-border rounded-[8px] overflow-hidden h-11">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-11 h-full flex items-center justify-center text-gray-500 hover:bg-surface transition-colors text-lg font-medium"
        >
          −
        </button>
        <span className="flex-1 text-center text-sm font-semibold text-foreground">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-11 h-full flex items-center justify-center text-gray-500 hover:bg-surface transition-colors text-lg font-medium"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function StepDetails({ data, updateData, onNext, onBack }: Props) {
  function toggleAmenity(a: string) {
    const current = data.amenities;
    if (current.includes(a)) {
      updateData({ amenities: current.filter((x) => x !== a) });
    } else {
      updateData({ amenities: [...current, a] });
    }
  }

  const isValid = data.price > 0 && data.area_m2 > 0;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Detalles del inmueble
        </h2>
        <p className="text-sm text-gray-500">
          Información que los compradores necesitan ver.
        </p>
      </div>

      {/* Property type */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Tipo de inmueble</label>
        <div className="flex flex-wrap gap-2">
          {PROPERTY_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => updateData({ property_type: t.value })}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm border transition-colors",
                data.property_type === t.value
                  ? "bg-primary text-white border-primary"
                  : "border-border text-gray-600 hover:border-primary hover:text-primary"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price and area */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Precio (COP)"
          type="number"
          placeholder="450000000"
          value={data.price || ""}
          onChange={(e) => updateData({ price: Number(e.target.value) })}
          hint="Sin puntos ni comas"
        />
        <Input
          label="Área (m²)"
          type="number"
          placeholder="85"
          value={data.area_m2 || ""}
          onChange={(e) => updateData({ area_m2: Number(e.target.value) })}
        />
      </div>

      {/* Bedrooms, bathrooms, parking */}
      <div className="grid grid-cols-3 gap-3">
        <NumberInput
          label="Habitaciones"
          value={data.bedrooms}
          onChange={(v) => updateData({ bedrooms: v })}
          min={0}
          max={20}
        />
        <NumberInput
          label="Baños"
          value={data.bathrooms}
          onChange={(v) => updateData({ bathrooms: v })}
          min={0}
          max={20}
        />
        <NumberInput
          label="Parqueaderos"
          value={data.parking}
          onChange={(v) => updateData({ parking: v })}
          min={0}
          max={10}
        />
      </div>

      {/* Floor and stratum */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Piso (opcional)"
          type="number"
          placeholder="4"
          value={data.floor || ""}
          onChange={(e) => updateData({ floor: Number(e.target.value) })}
        />
        <Input
          label="Estrato"
          type="number"
          placeholder="4"
          min={1}
          max={6}
          value={data.stratum || ""}
          onChange={(e) => updateData({ stratum: Number(e.target.value) })}
        />
      </div>

      {/* Amenities */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">
          Amenidades (opcional)
        </label>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => toggleAmenity(a)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs border transition-colors",
                data.amenities.includes(a)
                  ? "bg-primary text-white border-primary"
                  : "border-border text-gray-600 hover:border-primary/50"
              )}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" size="md" className="flex-1" onClick={onBack}>
          Atrás
        </Button>
        <Button size="md" className="flex-1" onClick={onNext} disabled={!isValid}>
          Continuar
        </Button>
      </div>
    </div>
  );
}
