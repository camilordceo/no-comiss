import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NoComiss — Sell your home, keep the commission",
    template: "%s | NoComiss",
  },
  description:
    "Sell your home for a flat $99–$999/month instead of paying $20K–$50K in agent commissions. AI-powered listings, ads, and buyer communication.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://no-comiss.vercel.app"),
  openGraph: {
    title: "NoComiss — Sell your home, keep the commission",
    description:
      "AI-powered home selling for the US market. Save $25,000+ in commissions.",
    type: "website",
    siteName: "NoComiss",
  },
  twitter: {
    card: "summary_large_image",
    title: "NoComiss",
    description: "Sell your home, keep the commission.",
  },
};

export const viewport: Viewport = {
  themeColor: "#40d99d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-white text-brand-black antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
