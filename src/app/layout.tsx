import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Rentmies — Publica tu inmueble sin comisión",
    template: "%s | Rentmies",
  },
  description:
    "El agente de IA que arrienda y vende tu inmueble 24/7 en Bogotá, Medellín y Cali. Sin comisión, solo tarifa plana.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://no-comiss.vercel.app"),
  openGraph: {
    title: "Rentmies — Publica tu inmueble sin comisión",
    description:
      "Agente de IA en WhatsApp que arrienda y vende tu inmueble 24/7. Sin comisión.",
    type: "website",
    siteName: "Rentmies",
    locale: "es_CO",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rentmies",
    description: "Publica tu inmueble sin comisión.",
  },
};

export const viewport: Viewport = {
  themeColor: "#1D9E75",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-surface-1 text-foreground antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
