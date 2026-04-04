import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NoComiss — Vende tu casa sin pagar comisión",
    template: "%s | NoComiss",
  },
  description:
    "Vende tu inmueble con IA. Sin agentes, sin comisiones del 5-6%. Solo $100-$1,000/mes por tecnología que trabaja 24/7 por ti.",
  keywords: ["vender casa", "sin comisión", "IA inmobiliaria", "Colombia", "Bogotá", "Medellín"],
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "NoComiss by Rentmies",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
