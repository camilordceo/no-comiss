import type { Metadata } from "next";
import { BuyerRegisterForm } from "@/components/buyer/buyer-register-form";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Busco inmueble sin comisión — NoComiss",
  description:
    "Crea tu perfil de comprador y accede a inmuebles directamente con el dueño. Sin intermediarios, sin sobrecostos.",
};

export default function ComprarPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <div className="bg-white border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            Para compradores
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Compra directamente con el dueño
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Accede a inmuebles sin pagar comisión de agente. Tú y el dueño negocian directo,
            con toda la información en un solo lugar.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Benefits */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground">
              ¿Por qué crear tu perfil?
            </h2>
            {[
              {
                emoji: "🤝",
                title: "Negociación directa",
                desc: "Habla directamente con el propietario. Sin intermediarios que distorsionen la información.",
              },
              {
                emoji: "🔔",
                title: "Alertas de nuevos inmuebles",
                desc: "Te notificamos cuando aparezca un inmueble que se ajuste a tu presupuesto y preferencias.",
              },
              {
                emoji: "📅",
                title: "Agenda visitas en 1 clic",
                desc: "Reserva tu visita directamente en el calendario del vendedor, con Google Meet si es virtual.",
              },
              {
                emoji: "📊",
                title: "Sigue el estado de tu negociación",
                desc: "Ve en tiempo real en qué etapa está tu proceso: visita, oferta, due diligence, cierre.",
              },
              {
                emoji: "💰",
                title: "Sin sobrecostos ocultos",
                desc: "El precio que ves es el precio que pagas. La comisión la ahorra el vendedor y te la puede trasladar.",
              },
            ].map((b) => (
              <div key={b.title} className="flex gap-4">
                <div className="text-2xl shrink-0">{b.emoji}</div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{b.title}</p>
                  <p className="text-gray-500 text-sm mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div>
            <div className="bg-white rounded-[12px] border border-border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-foreground mb-1">
                Crea tu perfil de comprador
              </h3>
              <p className="text-sm text-gray-500 mb-5">
                Gratis y sin compromiso. Te contactamos cuando tengamos algo para ti.
              </p>
              <BuyerRegisterForm />
            </div>
            <p className="text-center text-xs text-gray-400 mt-4">
              ¿Tienes cuenta de vendedor?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
