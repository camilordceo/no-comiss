import Link from "next/link";
import { ArrowRight, Sparkles, MessageSquare, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MarketingPage() {
  return (
    <main className="min-h-screen bg-surface-1">
      <header className="border-b border-border bg-surface-2/60 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-base font-bold tracking-tight text-white">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-brand-green text-white">
              R
            </span>
            Rentmies
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Ingresar</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Empezar</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="container flex flex-col items-center gap-8 py-20 text-center md:py-32">
        <div className="inline-flex items-center gap-2 rounded-pill border border-brand-green/30 bg-brand-green/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-brand-green">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Agente de IA en WhatsApp
        </div>

        <h1 className="max-w-3xl text-[clamp(2rem,6vw,3.5rem)] font-bold leading-[1.05] tracking-tight text-white">
          Publica tu inmueble.
          <br />
          <span className="text-brand-green">Sin comisión.</span>
        </h1>

        <p className="max-w-xl text-base text-muted-foreground md:text-lg">
          Rentmies arrienda y vende tu inmueble 24/7 en Bogotá, Medellín y Cali.
          Sin paseos, sin comisiones, sin promesas vacías. Solo IA trabajando por ti.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/signup">
              Publicar inmueble <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Ya tengo cuenta</Link>
          </Button>
        </div>
      </section>

      <section className="border-t border-border bg-surface-2 py-20">
        <div className="container grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Zap,
              title: "Subes tu inmueble en minutos",
              body: "Fotos, datos básicos y precio. Eso es todo. Nuestra IA arma el resto.",
            },
            {
              icon: MessageSquare,
              title: "WhatsApp 24/7",
              body: "El agente responde compradores e inquilinos a cualquier hora. Tú solo recibes los que valen la pena.",
            },
            {
              icon: Sparkles,
              title: "Sin comisión, tarifa plana",
              body: "Sin sorpresas al final. Pagas mensualidad y te quedas con todo el valor de tu inmueble.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-lg border border-border bg-surface-3 p-6 card-hover stagger-item"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-brand-green/15">
                <Icon className="h-5 w-5 text-brand-green" aria-hidden />
              </div>
              <h3 className="mb-1 text-lg font-semibold text-white">{title}</h3>
              <p className="text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} Rentmies — Bogotá · Medellín · Cali</p>
          <p>Hecho con IA para propietarios e inmobiliarias.</p>
        </div>
      </footer>
    </main>
  );
}
