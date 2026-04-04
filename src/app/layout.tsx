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
    default: "NoComiss — Sell Your Home with AI | Save 5-6% Commission",
    template: "%s | NoComiss",
  },
  description:
    "Your AI real estate agent for $99/month instead of $24,000. NoComiss writes your listing, runs your ads, and handles buyer communication 24/7. Keep the commission.",
  keywords: [
    "sell home without agent",
    "FSBO",
    "for sale by owner",
    "save real estate commission",
    "AI home selling",
    "sell house without realtor",
    "flat fee MLS",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "NoComiss",
    title: "Sell Your Home with AI. Keep the Commission.",
    description:
      "NoComiss is your AI real estate agent — $99/month instead of 5-6%. Generate your listing, run ads, and handle buyers 24/7.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sell Your Home with AI. Keep the Commission.",
    description:
      "NoComiss is your AI real estate agent — $99/month instead of 5-6%. Generate your listing, run ads, and handle buyers 24/7.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
