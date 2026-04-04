import type { Metadata } from "next";
import { CommissionCalculator } from "@/components/marketing/commission-calculator";

export const metadata: Metadata = {
  title: "Commission Savings Calculator",
  description:
    "Calculate exactly how much you save by selling your home without a real estate agent. Compare traditional 5-6% commission vs. NoComiss flat fee.",
};

export default function CalculatorPage() {
  return (
    <div className="py-12 md:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-sm font-medium text-primary uppercase tracking-wide mb-3">
            Savings calculator
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            How much could you keep?
          </h1>
          <p className="text-gray-500 leading-relaxed">
            Enter your home&apos;s value and see exactly how much the traditional
            5-6% agent commission costs you — and what you&apos;d pay with NoComiss instead.
          </p>
        </div>
        <CommissionCalculator />
      </div>
    </div>
  );
}
