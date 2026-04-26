import type { Metadata, Viewport } from "next";
import { Inter_Tight, JetBrains_Mono, Newsreader } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter-tight",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NoComiss — Sell your home. Keep the commission.",
    template: "%s · NoComiss",
  },
  description:
    "The 6% real estate commission is dead. NoComiss lists, markets, and sells your home for a flat $99/month — handled by AI. Keep $25,000 to $50,000 that used to go to your agent.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://no-comiss.vercel.app",
  ),
  openGraph: {
    title: "NoComiss — Sell your home. Keep the commission.",
    description:
      "AI sells your home for $99/month. The 6% agent commission is dead.",
    type: "website",
    siteName: "NoComiss",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "NoComiss",
    description: "Sell your home. Keep the commission.",
  },
};

export const viewport: Viewport = {
  themeColor: "#F4EFE6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${interTight.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-crema text-text antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
