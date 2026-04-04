import type { Metadata } from "next";
import { CommissionCalculator } from "@/components/marketing/commission-calculator";

export const metadata: Metadata = {
  title: "Calculadora de Ahorro",
  description:
    "Calcula cuánto te ahorras vendiendo sin agente inmobiliario. Compara comisión tradicional vs NoComiss.",
};

export default function CalculatorPage() {
  return (
    <div className="py-12 md:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-sm font-medium text-primary uppercase tracking-wide mb-3">
            Calculadora de ahorro
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            ¿Cuánto ahorras con NoComiss?
          </h1>
          <p className="text-gray-500 leading-relaxed">
            Ingresa el valor de tu inmueble y ve exactamente cuánto te quedas en el bolsillo.
          </p>
        </div>

        <CommissionCalculator />
      </div>
    </div>
  );
}
