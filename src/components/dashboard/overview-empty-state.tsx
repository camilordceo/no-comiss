import Link from "next/link";
import { ArrowRight, Camera, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OverviewEmptyState() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface-2 p-8 md:p-10">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-pill border border-brand-green/30 bg-brand-green/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-green">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Bienvenido a Rentmies
            </div>
            <h1 className="text-[clamp(1.5rem,4vw,2rem)] font-bold leading-tight tracking-tight text-white">
              Publica tu primer inmueble.
            </h1>
            <p className="text-base text-muted-foreground">
              Sube las fotos, los datos básicos y el precio. Nuestra IA empieza a pautarlo
              en WhatsApp y a responder compradores 24/7. Sin comisiones.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/dashboard/property/new">
              Publicar inmueble <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          {
            icon: Camera,
            title: "Datos del inmueble",
            body: "Tipo, ciudad, área, precio y unas fotos buenas. Sin papeleo.",
            step: "1",
          },
          {
            icon: Sparkles,
            title: "IA pauta por ti",
            body: "Genera el copy, segmenta y publica en los canales correctos.",
            step: "2",
          },
          {
            icon: MessageSquare,
            title: "Recibes interesados",
            body: "El agente filtra y te pasa solo los compradores reales.",
            step: "3",
          },
        ].map(({ icon: Icon, title, body, step }) => (
          <div
            key={title}
            className="rounded-lg border border-border bg-surface-3 p-5 card-hover stagger-item"
          >
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-md bg-brand-green/15">
              <Icon className="h-4 w-4 text-brand-green" aria-hidden />
            </div>
            <div className="label-form mb-1">Paso {step}</div>
            <h3 className="mb-1 text-base font-semibold text-white">{title}</h3>
            <p className="text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
