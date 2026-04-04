import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCOP(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("es-CO").format(n);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function calculateCommissionSavings(homeValue: number) {
  const traditionalRate = 0.055; // 5.5% average
  const traditional = homeValue * traditionalRate;
  const nocomissMax = 1000 * 12; // max $1,000/month × 12 months
  const savings = traditional - nocomissMax;
  return {
    traditional,
    nocomiss: Math.min(nocomissMax, traditional * 0.15),
    savings: Math.max(0, savings),
    savingsPercent: Math.round((savings / traditional) * 100),
  };
}

export function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) return d.toLocaleDateString("es-CO");
  if (days > 1) return `hace ${days} días`;
  if (days === 1) return "ayer";
  if (hours > 1) return `hace ${hours} horas`;
  if (hours === 1) return "hace 1 hora";
  if (minutes > 1) return `hace ${minutes} minutos`;
  return "hace un momento";
}
