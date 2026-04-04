"use client";

import { useState } from "react";
import { MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { WizardData } from "./wizard";

const CITIES = ["Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Otra"];

interface Props {
  data: WizardData;
  updateData: (d: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepAddress({ data, updateData, onNext }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleLookup() {
    if (!data.address || !data.city) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/rentcast?address=${encodeURIComponent(data.address)}&city=${encodeURIComponent(data.city)}`
      );
      if (res.ok) {
        const rentcastData = await res.json();
        updateData({ rentcast_data: rentcastData });
      }
    } catch {
      // Continue without RentCast data
    } finally {
      setLoading(false);
      onNext();
    }
  }

  const isValid = data.address.trim().length > 5 && data.city;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">
          ¿Dónde está tu inmueble?
        </h2>
        <p className="text-sm text-gray-500">
          Ingresa la dirección exacta para generar datos de mercado automáticamente.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Ciudad</label>
          <div className="flex flex-wrap gap-2">
            {CITIES.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => updateData({ city })}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors duration-150 ${
                  data.city === city
                    ? "bg-primary text-white border-primary"
                    : "border-border text-gray-600 hover:border-primary hover:text-primary"
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Dirección"
          placeholder="Cra 7 # 45-23, Chapinero"
          value={data.address}
          onChange={(e) => updateData({ address: e.target.value })}
          prefix={<MapPin className="w-4 h-4" />}
        />

        <Input
          label="Barrio (opcional)"
          placeholder="Chapinero, El Poblado, Laureles..."
          value={data.neighborhood}
          onChange={(e) => updateData({ neighborhood: e.target.value })}
        />
      </div>

      {data.rentcast_data && (
        <div className="rounded-[8px] bg-primary/5 border border-primary/20 p-3">
          <p className="text-xs text-primary font-medium">
            Datos de mercado encontrados para tu zona
          </p>
        </div>
      )}

      <Button
        size="md"
        className="w-full"
        disabled={!isValid}
        loading={loading}
        onClick={handleLookup}
      >
        <Search className="w-4 h-4" />
        Buscar datos de mercado
      </Button>
    </div>
  );
}
