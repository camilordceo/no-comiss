"use client";

import { Calendar, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WizardData } from "./wizard";

interface Props {
  data: WizardData;
  updateData: (d: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
  onFinish: () => void;
  submitting: boolean;
}

export function StepCalendar({ data, updateData, onBack, onFinish, submitting }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Configura tu disponibilidad
        </h2>
        <p className="text-sm text-gray-500">
          Conecta tu calendario para que los compradores puedan agendar visitas directamente.
        </p>
      </div>

      <div className="space-y-3">
        {[
          {
            icon: Calendar,
            title: "Google Calendar",
            description: "Sincroniza tus citas y bloquea fechas no disponibles",
            action: "Conectar",
            available: true,
          },
          {
            icon: Clock,
            title: "Disponibilidad manual",
            description: "Define los días y horas en que aceptas visitas",
            action: "Configurar",
            available: true,
          },
        ].map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.title}
              type="button"
              onClick={() => updateData({ calendar_setup: true })}
              className="w-full flex items-center gap-4 p-4 rounded-[8px] border border-border hover:border-primary/50 hover:bg-surface transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-[8px] bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{opt.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{opt.description}</p>
              </div>
              <span className="text-xs text-primary font-medium">{opt.action}</span>
            </button>
          );
        })}
      </div>

      {data.calendar_setup && (
        <div className="flex items-center gap-2 text-sm text-primary bg-primary/5 rounded-[8px] p-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Calendario configurado correctamente</span>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Puedes configurar el calendario más tarde desde tu dashboard.
      </p>

      <div className="flex gap-3">
        <Button variant="outline" size="md" className="flex-1" onClick={onBack}>
          Atrás
        </Button>
        <Button
          size="md"
          className="flex-1"
          onClick={onFinish}
          loading={submitting}
        >
          {submitting ? "Creando listing..." : "Publicar inmueble"}
        </Button>
      </div>
    </div>
  );
}
