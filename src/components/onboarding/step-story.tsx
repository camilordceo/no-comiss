"use client";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { WizardData } from "./wizard";

interface Props {
  data: WizardData;
  updateData: (d: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const PROMPTS = [
  "¿Cuál es tu lugar favorito del inmueble?",
  "¿Qué tipo de persona viviría perfectamente aquí?",
  "¿Qué tiene de especial este inmueble frente a otros?",
  "¿Qué renovaciones o mejoras hiciste?",
];

export function StepStory({ data, updateData, onNext, onBack }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Cuéntanos sobre tu inmueble
        </h2>
        <p className="text-sm text-gray-500">
          Esta información le da contexto a nuestra IA para crear una descripción que conecte emocionalmente con los compradores.
        </p>
      </div>

      <div className="rounded-[8px] bg-surface p-3 space-y-1">
        <p className="text-xs font-medium text-gray-500 mb-2">Sugerencias:</p>
        {PROMPTS.map((prompt) => (
          <p key={prompt} className="text-xs text-gray-500 flex items-start gap-1.5">
            <span className="text-primary">·</span>
            {prompt}
          </p>
        ))}
      </div>

      <Textarea
        label="Tu historia"
        placeholder="Ej: Este apartamento tiene una terraza increíble con vista a las montañas. La cocina fue renovada el año pasado con mesones de cuarzo. Es perfecto para una pareja joven o profesionales que buscan un lugar tranquilo pero cerca al centro..."
        value={data.story}
        onChange={(e) => updateData({ story: e.target.value })}
        className="min-h-[160px]"
        hint={`${data.story.length}/1000 caracteres`}
        maxLength={1000}
      />

      <div className="flex gap-3">
        <Button variant="outline" size="md" className="flex-1" onClick={onBack}>
          Atrás
        </Button>
        <Button
          size="md"
          className="flex-1"
          onClick={onNext}
          disabled={data.story.trim().length < 20}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
