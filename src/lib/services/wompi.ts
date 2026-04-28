/**
 * Wompi (Bancolombia) payment helpers.
 *
 * Wompi only processes COP. NoComiss displays USD prices but charges COP at a
 * fixed rate (~$1 USD = 4,100 COP). All amounts on the wire are in cents.
 */
import crypto from "crypto";

export type PlanId = "starter" | "pro" | "elite";
export type PaymentMode = "upfront" | "monthly";

export interface PlanPricing {
  id: PlanId;
  name: string;
  usd_per_month: number;
  cop_three_months: number;
  cop_per_month: number;
  highlights: string[];
}

export const USD_TO_COP_RATE = 4_100;

export const PLANS: Record<PlanId, PlanPricing> = {
  starter: {
    id: "starter",
    name: "Starter",
    usd_per_month: 500,
    cop_three_months: 6_150_000,
    cop_per_month: 2_050_000,
    highlights: [
      "AI-generated listing copy",
      "Public mini-site",
      "Lead, showing & offer forms",
      "Basic CRM pipeline",
      "Email support",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    usd_per_month: 1_500,
    cop_three_months: 18_450_000,
    cop_per_month: 6_150_000,
    highlights: [
      "Everything in Starter",
      "Paid ads (~$800/mo placement)",
      "SMS + email lead routing",
      "Offer management workflow",
      "Showing analytics",
    ],
  },
  elite: {
    id: "elite",
    name: "Elite",
    usd_per_month: 5_000,
    cop_three_months: 61_500_000,
    cop_per_month: 20_500_000,
    highlights: [
      "Everything in Pro",
      "Full concierge service",
      "$2,000/mo ad placement",
      "MLS listing handled for you",
      "Weekly strategy calls",
    ],
  },
};

export const PLAN_LIST: PlanPricing[] = [PLANS.starter, PLANS.pro, PLANS.elite];

export function getPlan(plan: string): PlanPricing | null {
  if (plan === "starter" || plan === "pro" || plan === "elite") {
    return PLANS[plan];
  }
  return null;
}

export function amountInCents(plan: PlanPricing, mode: PaymentMode): number {
  const cop = mode === "upfront" ? plan.cop_three_months : plan.cop_per_month;
  return cop * 100;
}

export function usdTotal(plan: PlanPricing, mode: PaymentMode): number {
  return mode === "upfront" ? plan.usd_per_month * 3 : plan.usd_per_month;
}

/**
 * Wompi integrity signature.
 * SHA256(reference + amount_in_cents + currency + integrity_secret)
 */
export function generateSignature(
  reference: string,
  amountCents: number,
  currency: string,
  integritySecret: string,
): string {
  const str = `${reference}${amountCents}${currency}${integritySecret}`;
  return crypto.createHash("sha256").update(str).digest("hex");
}

/**
 * Reference must be unique per Wompi account.
 * Pattern: NOCOMISS-{PLAN}-{userId8chars}-{timestamp}
 */
export function generateReference(plan: PlanId, userId: string): string {
  const short = userId.replace(/-/g, "").slice(0, 8);
  return `NOCOMISS-${plan.toUpperCase()}-${short}-${Date.now()}`;
}

/**
 * Verify a Wompi webhook signature.
 * The properties array tells us which fields of `event.data` to concatenate.
 * Never hardcode property names — Wompi can extend the list.
 */
export function verifyWompiWebhook(event: unknown, eventsSecret: string): boolean {
  if (!event || typeof event !== "object") return false;
  const e = event as {
    data?: unknown;
    timestamp?: number | string;
    signature?: { properties?: string[]; checksum?: string };
  };
  const sig = e.signature;
  if (!sig || !Array.isArray(sig.properties) || typeof sig.checksum !== "string") {
    return false;
  }
  const concat = sig.properties
    .map((prop) =>
      prop
        .split(".")
        .reduce<unknown>(
          (obj, key) =>
            obj && typeof obj === "object" ? (obj as Record<string, unknown>)[key] : undefined,
          e.data,
        ),
    )
    .map((v) => (v == null ? "" : String(v)))
    .join("");
  const ts = e.timestamp == null ? "" : String(e.timestamp);
  const computed = crypto
    .createHash("sha256")
    .update(concat + ts + eventsSecret)
    .digest("hex");
  return computed === sig.checksum;
}

export function wompiBaseUrl(): string {
  return process.env.WOMPI_BASE_URL ?? "https://sandbox.wompi.co/v1";
}

export interface WompiAcceptanceTokens {
  acceptance_token: string;
  accept_personal_auth: string;
  permalink_terms: string;
  permalink_personal: string;
}

interface MerchantResponse {
  data: {
    presigned_acceptance: { acceptance_token: string; permalink: string };
    presigned_personal_data_auth: { acceptance_token: string; permalink: string };
  };
}

/** Fetches both Wompi acceptance tokens (Habeas Data + T&C). */
export async function fetchAcceptanceTokens(): Promise<WompiAcceptanceTokens> {
  const publicKey = process.env.WOMPI_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;
  if (!publicKey) {
    throw new Error("WOMPI_PUBLIC_KEY not configured");
  }
  const res = await fetch(`${wompiBaseUrl()}/merchants/${publicKey}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${publicKey}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Wompi /merchants HTTP ${res.status}`);
  }
  const json = (await res.json()) as MerchantResponse;
  const presigned = json.data.presigned_acceptance;
  const personal = json.data.presigned_personal_data_auth;
  return {
    acceptance_token: presigned.acceptance_token,
    accept_personal_auth: personal.acceptance_token,
    permalink_terms: presigned.permalink,
    permalink_personal: personal.permalink,
  };
}

export interface WompiTransactionResponse {
  id: string;
  status: "PENDING" | "APPROVED" | "DECLINED" | "ERROR" | "VOIDED";
  reference: string;
  amount_in_cents: number;
  currency: string;
  payment_method?: {
    extra?: { last_four?: string; brand?: string; name?: string };
  };
  status_message?: string | null;
}

/** Create a one-time CARD transaction. Server-side only — uses PRIVATE key. */
export async function createCardTransaction(input: {
  amountCents: number;
  reference: string;
  customerEmail: string;
  cardToken: string;
  acceptanceToken: string;
  acceptPersonalAuth: string;
  signature: string;
  installments?: number;
}): Promise<WompiTransactionResponse> {
  const privateKey = process.env.WOMPI_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("WOMPI_PRIVATE_KEY not configured");
  }
  const body = {
    amount_in_cents: input.amountCents,
    currency: "COP",
    customer_email: input.customerEmail,
    reference: input.reference,
    payment_method_type: "CARD",
    payment_method: {
      type: "CARD",
      token: input.cardToken,
      installments: input.installments ?? 1,
    },
    signature: input.signature,
    acceptance_token: input.acceptanceToken,
    accept_personal_auth: input.acceptPersonalAuth,
  };
  const res = await fetch(`${wompiBaseUrl()}/transactions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${privateKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json()) as { data?: WompiTransactionResponse; error?: unknown };
  if (!res.ok || !json.data) {
    throw new Error(
      `Wompi /transactions HTTP ${res.status} ${JSON.stringify(json.error ?? json)}`,
    );
  }
  return json.data;
}

/** Get transaction status. Server-side only — uses PRIVATE key. */
export async function getTransaction(
  wompiTransactionId: string,
): Promise<WompiTransactionResponse> {
  const privateKey = process.env.WOMPI_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("WOMPI_PRIVATE_KEY not configured");
  }
  const res = await fetch(`${wompiBaseUrl()}/transactions/${wompiTransactionId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${privateKey}` },
    cache: "no-store",
  });
  const json = (await res.json()) as { data?: WompiTransactionResponse; error?: unknown };
  if (!res.ok || !json.data) {
    throw new Error(
      `Wompi GET /transactions HTTP ${res.status} ${JSON.stringify(json.error ?? json)}`,
    );
  }
  return json.data;
}

export function formatCop(cop: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(cop);
}

export function formatUsd(usd: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(usd);
}
