import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function MarketingFooter() {
  return (
    <footer className="bg-foreground text-white mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <p className="font-bold text-xl mb-3">
              <span className="text-primary">No</span>Comiss
            </p>
            <p className="text-sm text-gray-400 leading-relaxed">
              Vende tu inmueble con IA. Sin agentes. Sin comisiones del 5%.
            </p>
            <p className="text-xs text-gray-500 mt-3">by Rentmies &middot; Colombia</p>
          </div>

          {/* Product */}
          <div>
            <p className="text-sm font-semibold mb-3">Producto</p>
            <ul className="space-y-2">
              {[
                { href: "/#como-funciona", label: "Cómo funciona" },
                { href: "/#precios", label: "Precios" },
                { href: "/calculator", label: "Calculadora" },
                { href: "/assessment", label: "Evalúa tu casa" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <p className="text-sm font-semibold mb-3">Recursos</p>
            <ul className="space-y-2">
              {[
                { href: "/blog", label: "Blog" },
                { href: "/blog/guia-vender-sin-agente", label: "Guía de venta" },
                { href: "/blog/mercado-bogota", label: "Mercado Bogotá" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-sm font-semibold mb-3">Legal</p>
            <ul className="space-y-2">
              {[
                { href: "/privacidad", label: "Privacidad" },
                { href: "/terminos", label: "Términos" },
                { href: "/contacto", label: "Contacto" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="bg-white/10 mb-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Rentmies SAS. Todos los derechos reservados.
          </p>
          <p className="text-xs text-gray-500">
            Bogotá &middot; Medellín &middot; Cali
          </p>
        </div>
      </div>
    </footer>
  );
}
