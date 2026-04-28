"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { CheckCircle2, Loader2, Lock, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { formatUsd } from "@/lib/services/wompi";

interface AcceptanceTokens {
  acceptance_token: string;
  accept_personal_auth: string;
  permalink_terms: string;
  permalink_personal: string;
}

type Stage = "idle" | "loading_tokens" | "ready" | "processing" | "success" | "error";

interface Plan {
  id: "starter" | "pro" | "elite";
  name: string;
  usdTotal: number;
  copAmount: number;
  amountInCents: number;
}

interface Props {
  plan: Plan;
  wompiPublicKey: string;
  wompiBaseUrl: string;
  userEmail: string;
}

const POLL_INTERVAL_MS = 2_000;
const POLL_MAX_ATTEMPTS = 15;

const CARD_BRANDS: { match: RegExp; brand: string }[] = [
  { match: /^4/, brand: "VISA" },
  { match: /^(5[1-5]|2[2-7])/, brand: "MASTERCARD" },
  { match: /^3[47]/, brand: "AMEX" },
  { match: /^6(?:011|5)/, brand: "DISCOVER" },
];

function detectBrand(num: string): string | null {
  for (const c of CARD_BRANDS) {
    if (c.match.test(num)) return c.brand;
  }
  return null;
}

function formatCardNumber(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExp(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function CheckoutForm({ plan, wompiPublicKey, wompiBaseUrl, userEmail }: Props) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("loading_tokens");
  const [tokens, setTokens] = useState<AcceptanceTokens | null>(null);
  const [cardholder, setCardholder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/payments/acceptance-tokens", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error("acceptance_tokens_failed");
        return (await r.json()) as AcceptanceTokens;
      })
      .then((t) => {
        if (cancelled) return;
        setTokens(t);
        setStage("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setError("Couldn't reach the payment provider. Refresh and try again.");
        setStage("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cardDigits = cardNumber.replace(/\s/g, "");
  const brand = detectBrand(cardDigits);
  const last4 = cardDigits.slice(-4);
  const [expMonth, expYear] = exp.split("/");
  const cardLooksValid =
    cardDigits.length >= 13 &&
    cardDigits.length <= 19 &&
    /^\d{2}$/.test(expMonth ?? "") &&
    /^\d{2}$/.test(expYear ?? "") &&
    /^\d{3,4}$/.test(cvc) &&
    cardholder.trim().length > 1;
  const canSubmit =
    stage === "ready" &&
    cardLooksValid &&
    acceptTerms &&
    acceptPrivacy &&
    !!tokens &&
    !!wompiPublicKey;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submittingRef.current || !tokens) return;
    submittingRef.current = true;
    setStage("processing");
    setError(null);

    try {
      // 1. Tokenize card client-side (Wompi public key)
      const tokenRes = await fetch(`${wompiBaseUrl}/tokens/cards`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${wompiPublicKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: cardDigits,
          exp_month: expMonth,
          exp_year: expYear,
          cvc,
          card_holder: cardholder.trim(),
        }),
      });
      const tokenJson = (await tokenRes.json()) as {
        data?: { id: string };
        error?: { type?: string; messages?: unknown };
      };
      if (!tokenRes.ok || !tokenJson.data?.id) {
        const message =
          (tokenJson.error?.messages as string | undefined) ??
          "Card couldn't be tokenized.";
        throw new Error(message);
      }
      const cardToken = tokenJson.data.id;

      // 2. Charge via our API (server-side uses private key)
      const chargeRes = await fetch("/api/payments/charge-one-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: plan.id,
          cardToken,
          acceptanceToken: tokens.acceptance_token,
          acceptPersonalAuth: tokens.accept_personal_auth,
          cardLastFour: last4,
          cardBrand: brand,
        }),
      });
      const chargeJson = (await chargeRes.json()) as {
        transactionId?: string;
        status?: string;
        error?: string;
        message?: string;
      };
      if (!chargeRes.ok || !chargeJson.transactionId) {
        throw new Error(
          chargeJson.message ?? chargeJson.error ?? "Payment couldn't be processed.",
        );
      }

      // 3. Poll for final status
      const finalStatus = await pollStatus(chargeJson.transactionId);
      if (finalStatus === "APPROVED") {
        setStage("success");
        return;
      }
      if (finalStatus === "DECLINED") {
        throw new Error(
          "Payment declined. Common causes: insufficient funds, online-payments blocked, or expired card.",
        );
      }
      if (finalStatus === "ERROR" || finalStatus === "VOIDED") {
        throw new Error("Wompi reported an error processing this card.");
      }
      // PENDING after exhausting retries
      throw new Error(
        "Payment is still being processed. Check back in a few minutes — we'll email you once it's confirmed.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStage("error");
    } finally {
      submittingRef.current = false;
    }
  }

  function reset() {
    setError(null);
    setStage("ready");
  }

  if (stage === "success") {
    return (
      <section className="border border-rule bg-ivory p-10 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12" style={{ color: "var(--moss)" }} />
        <h2 className="mt-5 font-serif text-3xl font-medium italic leading-tight text-text">
          Payment approved.
        </h2>
        <p className="mt-3 text-sm text-text-2">
          Your {plan.name} plan is now active. 3 months of full access starts today.
        </p>
        <div className="mt-7">
          <Button
            variant="spark"
            onClick={() => router.push("/dashboard?payment=success")}
          >
            Go to dashboard
          </Button>
        </div>
      </section>
    );
  }

  return (
    <>
      {wompiPublicKey ? (
        <Script
          src="https://cdn.wompi.co/libs/js/v1.js"
          data-public-key={wompiPublicKey}
          strategy="afterInteractive"
        />
      ) : null}

      {stage === "processing" ? (
        <section className="border border-rule bg-ivory p-10 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-espresso" />
          <p className="mt-5 font-mono text-[12px] uppercase tracking-[0.14em] text-text-2">
            Processing your payment
          </p>
          <p className="mt-2 text-sm text-text-3">This takes a few seconds.</p>
        </section>
      ) : null}

      {stage === "error" ? (
        <section className="border border-rule bg-ivory p-10 text-center">
          <XCircle className="mx-auto h-12 w-12" style={{ color: "var(--rust)" }} />
          <h2 className="mt-5 font-serif text-3xl font-medium leading-tight text-text">
            Payment declined.
          </h2>
          <p className="mt-3 text-sm text-text-2">
            {error ?? "We couldn't process this card."}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button variant="spark" onClick={reset}>
              Try again
            </Button>
            <Button variant="ghost" onClick={reset}>
              Use a different card
            </Button>
          </div>
        </section>
      ) : null}

      {(stage === "loading_tokens" || stage === "ready") && (
        <form onSubmit={handleSubmit} className="space-y-7">
          <div>
            <div className="eyebrow mb-4">Card details</div>
            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="cardholder">Cardholder name</Label>
                <Input
                  id="cardholder"
                  value={cardholder}
                  onChange={(e) => setCardholder(e.target.value)}
                  placeholder="Full name on card"
                  autoComplete="cc-name"
                  disabled={stage === "loading_tokens"}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="card-number">Card number</Label>
                <Input
                  id="card-number"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="4242 4242 4242 4242"
                  disabled={stage === "loading_tokens"}
                />
                {brand ? (
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-3">
                    {brand}
                  </span>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="exp">Expiry (MM/YY)</Label>
                  <Input
                    id="exp"
                    value={exp}
                    onChange={(e) => setExp(formatExp(e.target.value))}
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="06/29"
                    disabled={stage === "loading_tokens"}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cvc">CVC</Label>
                  <Input
                    id="cvc"
                    value={cvc}
                    onChange={(e) =>
                      setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="123"
                    disabled={stage === "loading_tokens"}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border border-rule bg-paper p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-3">
              Required by Colombian law
            </p>
            <div className="mt-4 space-y-3">
              <label className="flex items-start gap-3 text-sm text-text-2">
                <Checkbox
                  checked={acceptTerms}
                  onCheckedChange={(v) => setAcceptTerms(v === true)}
                  className="mt-0.5"
                />
                <span>
                  I accept Wompi&apos;s{" "}
                  <a
                    href={tokens?.permalink_terms ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="link-underline"
                  >
                    Terms &amp; Conditions
                  </a>
                  .
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm text-text-2">
                <Checkbox
                  checked={acceptPrivacy}
                  onCheckedChange={(v) => setAcceptPrivacy(v === true)}
                  className="mt-0.5"
                />
                <span>
                  I authorize the processing of my personal data per the{" "}
                  <a
                    href={tokens?.permalink_personal ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="link-underline"
                  >
                    privacy policy
                  </a>
                  .
                </span>
              </label>
            </div>
          </div>

          <Button type="submit" variant="spark" className="w-full" disabled={!canSubmit}>
            Pay {formatUsd(plan.usdTotal)} (3 months)
          </Button>

          <p className="flex items-center justify-center gap-2 text-xs text-text-3">
            <Lock className="h-3 w-3" /> Secured by Wompi · Bancolombia Group · Card data never
            touches our servers.
          </p>

          <p className="text-center text-xs text-text-3">
            Charging <span className="font-mono">{userEmail}</span>.
          </p>
        </form>
      )}
    </>
  );
}

async function pollStatus(transactionId: string): Promise<string> {
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const res = await fetch(
      `/api/payments/transaction-status?id=${encodeURIComponent(transactionId)}`,
      { cache: "no-store" },
    );
    if (!res.ok) continue;
    const json = (await res.json()) as { status?: string };
    const status = json.status ?? "PENDING";
    if (status !== "PENDING") return status;
  }
  return "PENDING";
}
