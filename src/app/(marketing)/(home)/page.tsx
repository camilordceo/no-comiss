import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Zap,
  MessageSquare,
  BarChart3,
  Camera,
  Calendar,
  ShieldCheck,
  TrendingUp,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Camera,
    title: "Listing profesional con IA",
    description:
      "Sube fotos y nuestra IA genera descripciones que venden. Textos optimizados para portales y redes sociales.",
  },
  {
    icon: MessageSquare,
    title: "Agente de compradores 24/7",
    description:
      "Responde preguntas, califica leads y agenda visitas automáticamente por WhatsApp — sin que tú hagas nada.",
  },
  {
    icon: BarChart3,
    title: "Precio basado en datos reales",
    description:
      "Análisis de ventas comparables en tu zona. Precio justo de mercado para vender rápido y bien.",
  },
  {
    icon: Calendar,
    title: "Coordinación de visitas",
    description:
      "Gestión automática del calendario. Los compradores agendan solos, tú recibes la notificación.",
  },
  {
    icon: Zap,
    title: "Anuncios en portales y RRSS",
    description:
      "Publicación automática en portales top y campañas de Instagram/Facebook con creativos generados por IA.",
  },
  {
    icon: ShieldCheck,
    title: "Análisis de ofertas",
    description:
      "IA analiza cada oferta: valida el precio, condiciones y te da recomendaciones antes de responder.",
  },
];

const steps = [
  {
    step: "01",
    title: "Publica en 10 minutos",
    description: "Sube fotos, ingresa la dirección y nuestra IA hace el resto. Sin formularios complicados.",
  },
  {
    step: "02",
    title: "La IA trabaja por ti",
    description: "Responde compradores, agenda visitas y gestiona tu listing — las 24 horas del día.",
  },
  {
    step: "03",
    title: "Recibe y cierra ofertas",
    description: "Analiza ofertas con ayuda de IA y cierra directamente con el comprador. Sin intermediarios.",
  },
];

const testimonials = [
  {
    name: "Carolina Restrepo",
    city: "Medellín",
    text: "Vendí mi apartamento en 3 semanas y ahorré $18 millones en comisión. La IA respondía a los compradores a las 2 AM mientras yo dormía.",
    saved: "$18M",
    rating: 5,
  },
  {
    name: "Andrés Moreno",
    city: "Bogotá",
    text: "Pensé que sería complicado sin agente, pero el sistema hace todo. Tuve 12 visitas en el primer mes.",
    saved: "$24M",
    rating: 5,
  },
  {
    name: "Pilar Jiménez",
    city: "Cali",
    text: "La calculadora me mostró cuánto ahorraba. No lo dudé. El proceso fue más fácil que con agencia.",
    saved: "$15M",
    rating: 5,
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: 100,
    period: "mes",
    description: "Para inmuebles hasta $500M",
    features: [
      "Listing con IA",
      "Site web propio",
      "Respuestas automáticas por WhatsApp",
      "Hasta 50 fotos",
      "Dashboard básico",
    ],
    cta: "Comenzar",
    highlighted: false,
  },
  {
    name: "Pro",
    price: 350,
    period: "mes",
    description: "El más popular — para todo tipo de inmueble",
    features: [
      "Todo lo de Starter",
      "Anuncios en portales (Metrocuadrado, Fincaraíz)",
      "Campañas en Instagram y Facebook",
      "Análisis de ofertas con IA",
      "Coordinación de visitas",
      "Soporte prioritario",
    ],
    cta: "Comenzar gratis",
    highlighted: true,
  },
  {
    name: "Elite",
    price: 1000,
    period: "mes",
    description: "Para propiedades premium y desarrolladores",
    features: [
      "Todo lo de Pro",
      "Fotógrafo profesional incluido",
      "Video tour 360°",
      "Gerente de cuenta dedicado",
      "Integraciones personalizadas",
      "Analytics avanzados",
    ],
    cta: "Hablar con ventas",
    highlighted: false,
  },
];

export default function LandingPage() {
  const avgCommission = 0.055;
  const avgHomePrice = 450_000_000;
  const avgSavings = Math.round(avgHomePrice * avgCommission);

  return (
    <div>
      {/* Hero */}
      <section className="gradient-hero py-16 md:py-24 lg:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Zap className="w-3.5 h-3.5" />
              IA que vende tu casa 24/7
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6">
              Vende tu casa.
              <br />
              <span className="text-primary">Sin pagar comisión.</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl">
              Un agente de IA gestiona tu venta completa: crea el listing, responde
              compradores, agenda visitas y analiza ofertas — todo por{" "}
              <strong className="text-foreground">$100–$1,000/mes</strong> en lugar
              del 5–6% de comisión.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Button asChild size="xl">
                <Link href="/signup">
                  Publicar mi inmueble
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <Link href="/calculator">Ver cuánto ahorro</Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
              {[
                "Sin contrato de permanencia",
                "Cancela cuando quieras",
                "Primera semana gratis",
              ].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="max-w-6xl mx-auto mt-16">
          <div className="bg-white rounded-[12px] border border-border shadow-sm p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Ahorro promedio", value: "$22M", sub: "por venta" },
              { label: "Tiempo de venta", value: "28 días", sub: "en promedio" },
              { label: "Leads generados", value: "47", sub: "por listing/mes" },
              { label: "Satisfacción", value: "4.9/5", sub: "de vendedores" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stat.label} · {stat.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-primary uppercase tracking-wide mb-3">
              Así funciona
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Simple como debe ser
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.step} className="relative">
                <div className="text-5xl font-black text-primary/10 mb-4">{step.step}</div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-primary uppercase tracking-wide mb-3">
              Lo que incluye
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Todo lo que necesitas para vender
            </h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Herramientas que antes solo tenían las grandes inmobiliarias, ahora disponibles para ti.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="p-6">
                  <CardContent className="p-0">
                    <div className="w-10 h-10 rounded-[8px] bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Commission comparison */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-primary uppercase tracking-wide mb-3">
              La diferencia
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              ¿Cuánto te quedas tú?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Traditional */}
            <div className="rounded-[12px] border border-border p-6 bg-white">
              <p className="text-sm font-medium text-gray-500 mb-4">Con agente tradicional</p>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Precio de venta</span>
                  <span className="font-medium">$450M</span>
                </div>
                <div className="flex justify-between text-sm text-red-500">
                  <span>Comisión agente (5.5%)</span>
                  <span className="font-medium">-${Math.round(avgSavings / 1_000_000)}M</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between font-semibold">
                  <span>Recibes</span>
                  <span>${Math.round((avgHomePrice - avgSavings) / 1_000_000)}M</span>
                </div>
              </div>
              <div className="w-full bg-red-100 rounded-full h-3">
                <div className="bg-red-400 h-3 rounded-full" style={{ width: `${(1 - avgSavings / avgHomePrice) * 100}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {Math.round(avgSavings / 1_000_000)}% va al agente
              </p>
            </div>

            {/* NoComiss */}
            <div className="rounded-[12px] border-2 border-primary p-6 bg-white relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-primary text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                Recomendado
              </div>
              <p className="text-sm font-medium text-gray-500 mb-4">Con NoComiss</p>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Precio de venta</span>
                  <span className="font-medium">$450M</span>
                </div>
                <div className="flex justify-between text-sm text-primary">
                  <span>NoComiss Plan Pro</span>
                  <span className="font-medium">-$1.26M</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between font-semibold text-primary">
                  <span>Recibes</span>
                  <span>$448.7M</span>
                </div>
              </div>
              <div className="w-full bg-primary/10 rounded-full h-3">
                <div className="bg-primary h-3 rounded-full" style={{ width: "99.7%" }} />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Ahorras ~${Math.round((avgSavings - 1_260_000) / 1_000_000)}M en comisiones
              </p>
            </div>
          </div>

          <div className="text-center mt-8">
            <Button asChild size="lg">
              <Link href="/calculator">
                <TrendingUp className="w-4 h-4" />
                Calcular mi ahorro exacto
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-primary uppercase tracking-wide mb-3">
              Historias reales
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Vendedores que ya ahorraron
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card key={t.name} className="p-6">
                <CardContent className="p-0">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.city}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Ahorró</p>
                      <p className="text-base font-bold text-primary">{t.saved}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-primary uppercase tracking-wide mb-3">
              Precios
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Sin porcentajes. Sin sorpresas.
            </h2>
            <p className="text-gray-500 mt-3">
              Tarifa fija mensual. Cancela cuando quieras.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-[12px] border p-6 ${
                  plan.highlighted
                    ? "border-primary shadow-md ring-1 ring-primary/20"
                    : "border-border"
                } bg-white relative`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                    Más popular
                  </div>
                )}
                <div className="mb-5">
                  <p className="font-semibold text-foreground mb-1">{plan.name}</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-bold text-foreground">
                      ${plan.price.toLocaleString("es-CO")}
                    </span>
                    <span className="text-gray-400 text-sm">USD/{plan.period}</span>
                  </div>
                  <p className="text-xs text-gray-400">{plan.description}</p>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-gray-600">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  variant={plan.highlighted ? "primary" : "outline"}
                  size="md"
                  className="w-full"
                >
                  <Link href="/signup">{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-foreground">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            ¿Listo para vender sin pagar millones?
          </h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Únete a cientos de propietarios en Colombia que ya venden con IA — sin agentes, sin comisiones, sin complicaciones.
          </p>
          <Button asChild size="xl" className="mx-auto">
            <Link href="/signup">
              Publicar mi inmueble gratis
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
          <p className="text-gray-500 text-sm mt-4">Primera semana gratis · Sin tarjeta de crédito</p>
        </div>
      </section>
    </div>
  );
}
