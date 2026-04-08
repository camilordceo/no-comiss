import crypto from "crypto";

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

export type PlanId = "starter" | "pro" | "elite";

export interface Plan {
  id: PlanId;
  name: string;
  amountCOP: number; // in full COP (not cents)
  amountCents: number; // Wompi requires cents
  description: string;
  features: string[];
}

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    amountCOP: 399_000,
    amountCents: 39_900_000,
    description: "1 listing, AI descriptions, showing coordination",
    features: ["1 active listing", "AI listing copy", "Showing scheduler", "Email support"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    amountCOP: 1_299_000,
    amountCents: 129_900_000,
    description: "5 listings, full AI suite, priority support",
    features: [
      "5 active listings",
      "AI listing copy",
      "AI offer analysis",
      "Showing scheduler",
      "MLS syndication",
      "Priority support",
    ],
  },
  elite: {
    id: "elite",
    name: "Elite",
    amountCOP: 2_499_000,
    amountCents: 249_900_000,
    description: "Unlimited listings, full platform, dedicated support",
    features: [
      "Unlimited listings",
      "All AI features",
      "Dedicated account manager",
      "Custom domain mini-site",
      "Advanced analytics",
      "Phone support",
    ],
  },
};

// ---------------------------------------------------------------------------
// Integrity signature
// Wompi docs: SHA256(reference + amount_in_cents + currency + integrity_secret)
// ---------------------------------------------------------------------------

export function generateIntegrityHash(
  reference: string,
  amountCents: number,
  currency: string,
  integritySecret: string
): string {
  const payload = `${reference}${amountCents}${currency}${integritySecret}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}

// ---------------------------------------------------------------------------
// Webhook event signature validation
// Wompi docs: SHA256(timestamp + properties... + events_secret)
// ---------------------------------------------------------------------------

export function validateWebhookSignature(
  payload: Record<string, unknown>,
  timestamp: string,
  checksum: string,
  eventsSecret: string
): boolean {
  try {
    // Wompi sends: checksum = SHA256(event.timestamp + event.event + event.data.transaction.id + eventsSecret)
    const transaction = (payload as { data?: { transaction?: { id?: string } } })?.data?.transaction;
    const eventName = (payload as { event?: string })?.event ?? "";
    const transactionId = transaction?.id ?? "";

    const toHash = `${timestamp}${eventName}${transactionId}${eventsSecret}`;
    const expected = crypto.createHash("sha256").update(toHash).digest("hex");
    return expected === checksum;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Build the hosted checkout URL (no server-to-server needed)
// ---------------------------------------------------------------------------

export function buildCheckoutUrl(params: {
  publicKey: string;
  reference: string;
  amountCents: number;
  currency?: string;
  integrityHash: string;
  redirectUrl: string;
  customerEmail?: string;
  customerFullName?: string;
  description?: string;
}): string {
  const {
    publicKey,
    reference,
    amountCents,
    currency = "COP",
    integrityHash,
    redirectUrl,
    customerEmail,
    customerFullName,
    description,
  } = params;

  const base = "https://checkout.wompi.co/p/";
  const query = new URLSearchParams({
    "public-key": publicKey,
    currency,
    "amount-in-cents": String(amountCents),
    reference,
    "signature:integrity": integrityHash,
    "redirect-url": redirectUrl,
  });

  if (customerEmail) query.set("customer-data:email", customerEmail);
  if (customerFullName) query.set("customer-data:full-name", customerFullName);
  if (description) query.set("customer-data:phone-number-prefix", "+57");

  return `${base}?${query.toString()}`;
}

// ---------------------------------------------------------------------------
// Generate a unique payment reference
// ---------------------------------------------------------------------------

export function generateReference(userId: string, planId: PlanId): string {
  const timestamp = Date.now();
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `NC-${planId.toUpperCase()}-${userId.slice(0, 8).toUpperCase()}-${timestamp}-${rand}`;
}

// ---------------------------------------------------------------------------
// Map Wompi transaction status → our internal status
// ---------------------------------------------------------------------------

export type WompiStatus = "PENDING" | "APPROVED" | "DECLINED" | "VOIDED" | "ERROR";
export type InternalPaymentStatus = "pending" | "approved" | "declined" | "voided" | "error";

export function mapWompiStatus(wompiStatus: string): InternalPaymentStatus {
  const map: Record<string, InternalPaymentStatus> = {
    PENDING: "pending",
    APPROVED: "approved",
    DECLINED: "declined",
    VOIDED: "voided",
    ERROR: "error",
  };
  return map[wompiStatus] ?? "error";
}
