"use client";

import { useState } from "react";
import { Calendar, CheckCircle2, ExternalLink, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [calendlyUrl, setCalendlyUrl] = useState("");
  const [calendlyConnected, setCalendlyConnected] = useState(false);

  function handleCalendlyConnect() {
    if (!calendlyUrl.trim()) return;
    // Store in data for later use — actual API key + full setup done in dashboard settings
    updateData({ calendar_setup: true });
    setCalendlyConnected(true);
  }

  function handleGoogleConnect() {
    // Redirect to our Google Calendar OAuth flow
    window.location.href = "/api/calendar/google/connect";
  }

  const isConnected = data.calendar_setup || calendlyConnected;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Configura tu disponibilidad
        </h2>
        <p className="text-sm text-gray-500">
          Conecta tu calendario para que los compradores agenden visitas directamente.
          Los eventos se crean automáticamente con Google Meet incluido.
        </p>
      </div>

      {/* Google Calendar */}
      <div className="rounded-[10px] border border-border p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[8px] bg-blue-50 flex items-center justify-center shrink-0">
            {/* Google Calendar icon */}
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="#4285F4" strokeWidth="1.5" fill="white"/>
              <path d="M3 10h18" stroke="#4285F4" strokeWidth="1.5"/>
              <path d="M8 4V7M16 4V7" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round"/>
              <text x="12" y="18" textAnchor="middle" fontSize="7" fill="#4285F4" fontWeight="bold">G</text>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Google Calendar</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Sincroniza visitas automáticamente + Google Meet incluido
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={handleGoogleConnect}
        >
          <Calendar className="w-4 h-4" />
          Conectar Google Calendar
          <ExternalLink className="w-3 h-3 ml-auto" />
        </Button>
      </div>

      {/* Calendly */}
      <div className="rounded-[10px] border border-border p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[8px] bg-[#006BFF]/10 flex items-center justify-center shrink-0">
            <Link2 className="w-5 h-5 text-[#006BFF]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Calendly</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Usa tu link de Calendly para que compradores agenden solos
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="https://calendly.com/tu-nombre"
            value={calendlyUrl}
            onChange={(e) => setCalendlyUrl(e.target.value)}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleCalendlyConnect}
            disabled={!calendlyUrl.trim() || calendlyConnected}
          >
            {calendlyConnected ? "✓" : "Guardar"}
          </Button>
        </div>
      </div>

      {/* Connected indicator */}
      {isConnected && (
        <div className="flex items-center gap-2 text-sm text-primary bg-primary/5 rounded-[8px] p-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Calendario configurado — los compradores podrán agendar visitas directamente</span>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Puedes configurar o cambiar el calendario más tarde desde <strong>Dashboard → Configuración</strong>
      </p>

      <div className="flex gap-3">
        <Button variant="outline" size="md" className="flex-1" onClick={onBack}>
          Atrás
        </Button>
        <Button size="md" className="flex-1" onClick={onFinish} loading={submitting}>
          {submitting ? "Publicando..." : "Publicar inmueble 🚀"}
        </Button>
      </div>
    </div>
  );
}
