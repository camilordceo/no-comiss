"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Mail, Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OFERTA_LABEL } from "@/lib/types/app";
import type { Oferta, OfertaEstado, Propiedad } from "@/lib/types/database";
import { formatPrice, formatRelativeDate } from "@/lib/utils/format";
import { logger } from "@/lib/utils/logger";

interface Props {
  ofertas: Oferta[];
  propertiesById: Record<string, Pick<Propiedad, "id" | "address_line1" | "ciudad" | "state" | "slug" | "precio">>;
}

export function OffersClient({ ofertas: initialOfertas, propertiesById }: Props) {
  const [ofertas, setOfertas] = useState<Oferta[]>(initialOfertas);
  const [counterOf, setCounterOf] = useState<Oferta | null>(null);

  const apply = (next: Oferta) => {
    setOfertas((prev) => prev.map((o) => (o.id === next.id ? next : o)));
  };

  if (ofertas.length === 0) {
    return (
      <div className="rounded-sm border border-rule bg-ivory p-10 text-center">
        <p className="font-serif text-lg italic text-text-3">
          No offers yet. They&apos;ll show up here when buyers submit them.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-3">
        {ofertas.map((o, i) => (
          <OfferCard
            key={o.id}
            number={i + 1}
            oferta={o}
            property={propertiesById[o.propiedad_id]}
            onUpdate={apply}
            onCounter={() => setCounterOf(o)}
          />
        ))}
      </ul>

      <CounterDialog
        oferta={counterOf}
        onClose={() => setCounterOf(null)}
        onSaved={(next) => {
          apply(next);
          setCounterOf(null);
        }}
      />
    </>
  );
}

function OfferCard({
  number,
  oferta,
  property,
  onUpdate,
  onCounter,
}: {
  number: number;
  oferta: Oferta;
  property?: Props["propertiesById"][string];
  onUpdate: (next: Oferta) => void;
  onCounter: () => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<OfertaEstado | null>(null);
  const asking = property?.precio ?? null;
  const pct = asking && asking > 0 ? (oferta.offer_price / asking) * 100 : null;

  const update = async (estado: OfertaEstado) => {
    setBusy(estado);
    try {
      const res = await fetch(`/api/ofertas/${oferta.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Couldn't update");
      onUpdate(body.oferta as Oferta);
      logger.info("oferta.updated", { id: oferta.id, estado });
      toast.success(`Offer ${OFERTA_LABEL[estado].toLowerCase()}.`);
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(null);
    }
  };

  const variant: "ready" | "active" | "paused" | "secondary" | "sold" | "destructive" =
    oferta.estado === "accepted"
      ? "sold"
      : oferta.estado === "submitted"
        ? "active"
        : oferta.estado === "countered"
          ? "ready"
          : oferta.estado === "rejected" || oferta.estado === "withdrawn"
            ? "destructive"
            : "secondary";

  return (
    <li className="border border-rule bg-ivory p-5">
      <div className="flex items-center justify-between border-b border-rule pb-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text-3">
            Offer #{number}
          </span>
          <Badge variant={variant}>{OFERTA_LABEL[oferta.estado]}</Badge>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-3">
          {formatRelativeDate(oferta.created_at)}
        </span>
      </div>

      <div className="grid gap-5 pt-4 md:grid-cols-[1fr_auto]">
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          <Dt>Offer price</Dt>
          <Dd>
            <span className="font-serif text-2xl font-medium text-text">
              {formatPrice(oferta.offer_price)}
            </span>
          </Dd>
          {asking != null ? (
            <>
              <Dt>vs. asking</Dt>
              <Dd>
                {formatPrice(asking)}
                {pct != null ? (
                  <span
                    className={
                      pct >= 100
                        ? "ml-2 font-mono text-[10px] uppercase tracking-[0.14em] text-moss"
                        : "ml-2 font-mono text-[10px] uppercase tracking-[0.14em] text-rust"
                    }
                  >
                    ({pct.toFixed(1)}%)
                  </span>
                ) : null}
              </Dd>
            </>
          ) : null}
          {oferta.earnest_money != null ? (
            <>
              <Dt>Earnest</Dt>
              <Dd>{formatPrice(oferta.earnest_money)}</Dd>
            </>
          ) : null}
          {oferta.financing ? (
            <>
              <Dt>Financing</Dt>
              <Dd>
                {oferta.financing}
                {oferta.pre_approved
                  ? ` · pre-approved: ${oferta.pre_approved}`
                  : ""}
              </Dd>
            </>
          ) : null}
          {oferta.closing_date ? (
            <>
              <Dt>Closing</Dt>
              <Dd>
                {new Date(`${oferta.closing_date}T00:00:00`).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </Dd>
            </>
          ) : null}
          {oferta.contingencies && oferta.contingencies.length > 0 ? (
            <>
              <Dt>Contingencies</Dt>
              <Dd>{oferta.contingencies.join(", ")}</Dd>
            </>
          ) : null}
        </dl>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-rule pt-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="font-serif text-base font-medium text-text">
            {oferta.nombre}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-2">
            <span className="inline-flex items-center gap-1">
              <Mail className="h-3 w-3 text-text-3" aria-hidden />
              <a href={`mailto:${oferta.email}`} className="hover:text-coral">
                {oferta.email}
              </a>
            </span>
            {oferta.telefono ? (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3 w-3 text-text-3" aria-hidden />
                <a href={`tel:${oferta.telefono}`} className="hover:text-coral">
                  {oferta.telefono}
                </a>
              </span>
            ) : null}
            {property?.slug ? (
              <Link
                href={`/homes/${property.slug}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[10px] uppercase tracking-[0.14em] hover:text-coral"
              >
                {property.address_line1 ?? "Listing"} →
              </Link>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="spark"
            size="sm"
            disabled={busy !== null || oferta.estado === "accepted"}
            onClick={() => update("accepted")}
          >
            {busy === "accepted" ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Accept
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={busy !== null || oferta.estado === "countered"}
            onClick={onCounter}
          >
            Counter
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={busy !== null || oferta.estado === "rejected"}
            onClick={() => update("rejected")}
          >
            {busy === "rejected" ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Decline
          </Button>
        </div>
      </div>
    </li>
  );
}

function CounterDialog({
  oferta,
  onClose,
  onSaved,
}: {
  oferta: Oferta | null;
  onClose: () => void;
  onSaved: (next: Oferta) => void;
}) {
  const [counter, setCounter] = useState<number>(oferta?.offer_price ?? 0);
  const [terms, setTerms] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const open = oferta !== null;

  const submit = async () => {
    if (!oferta) return;
    setSaving(true);
    try {
      const existing = (oferta.metadata ?? {}) as Record<string, unknown>;
      const res = await fetch(`/api/ofertas/${oferta.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: "countered",
          notas: terms.trim() || null,
          metadata: {
            ...existing,
            counter_price: counter,
            counter_terms: terms.trim() || null,
            counter_at: new Date().toISOString(),
          },
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Couldn't counter");
      onSaved(body.oferta as Oferta);
      toast.success("Counter recorded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Counter failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Counter offer</DialogTitle>
        </DialogHeader>
        {oferta ? (
          <div className="space-y-4">
            <p className="text-sm text-text-2">
              Their offer:{" "}
              <span className="font-mono">{formatPrice(oferta.offer_price)}</span>
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="counter_price">Counter price</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-base text-text-3">
                  $
                </span>
                <Input
                  id="counter_price"
                  type="number"
                  inputMode="numeric"
                  step={1000}
                  className="pl-7"
                  value={counter}
                  onChange={(e) => setCounter(e.target.valueAsNumber || 0)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="counter_terms">Terms / notes</Label>
              <Textarea
                id="counter_terms"
                rows={3}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Closing date, contingencies removed, etc."
              />
            </div>
          </div>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={saving || counter <= 0} onClick={submit}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Send counter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Dt({ children }: { children: React.ReactNode }) {
  return (
    <dt className="self-center font-mono text-[10px] uppercase tracking-[0.14em] text-text-3">
      {children}
    </dt>
  );
}
function Dd({ children }: { children: React.ReactNode }) {
  return <dd className="self-center text-text-2">{children}</dd>;
}
