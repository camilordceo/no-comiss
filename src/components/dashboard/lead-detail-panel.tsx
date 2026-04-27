"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Mail, Phone } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABEL,
  LEAD_STATUS_VARIANT,
} from "@/lib/types/app";
import type { Lead, LeadStatus } from "@/lib/types/database";
import { formatRelativeDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { logger } from "@/lib/utils/logger";

interface Props {
  lead: Lead | null;
  propertyAddress?: string | null;
  onClose: () => void;
}

export function LeadDetailPanel({ lead, propertyAddress, onClose }: Props) {
  const open = lead !== null;
  return (
    <Sheet open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <SheetContent
        side="right"
        className="w-full max-w-md overflow-y-auto sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle>Lead</SheetTitle>
        </SheetHeader>
        {lead ? (
          <PanelBody key={lead.id} lead={lead} propertyAddress={propertyAddress} />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function PanelBody({
  lead,
  propertyAddress,
}: {
  lead: Lead;
  propertyAddress?: string | null;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [notes, setNotes] = useState<string>(lead.seller_notes ?? "");
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  const updateStatus = async (next: LeadStatus) => {
    if (!lead || next === status) return;
    setSavingStatus(true);
    setStatus(next);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error("Couldn't change status");
      logger.info("lead.status_changed", { id: lead.id, status: next });
      toast.success(`Status: ${LEAD_STATUS_LABEL[next]}`);
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
      setStatus(lead.status);
    } finally {
      setSavingStatus(false);
    }
  };

  const saveNotes = async () => {
    if (!lead) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seller_notes: notes.trim() || null }),
      });
      if (!res.ok) throw new Error("Couldn't save notes");
      toast.success("Notes saved.");
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <div className="space-y-6 p-5 pt-4">
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={LEAD_STATUS_VARIANT[status]}>
                  {LEAD_STATUS_LABEL[status]}
                </Badge>
                <Badge variant="outline">{lead.form_type}</Badge>
              </div>
              <h2 className="font-serif text-2xl font-medium leading-tight tracking-tight text-text">
                {lead.nombre}
              </h2>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-3">
                First contact · {formatRelativeDate(lead.created_at)}
              </p>
              {propertyAddress ? (
                <p className="text-xs text-text-2">about {propertyAddress}</p>
              ) : null}
            </div>

            {/* Contact */}
            <Section title="Contact">
              <ul className="space-y-2 text-sm text-text-2">
                <li className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-text-3" aria-hidden />
                  <a className="hover:text-coral" href={`mailto:${lead.email}`}>
                    {lead.email}
                  </a>
                </li>
                {lead.telefono ? (
                  <li className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-text-3" aria-hidden />
                    <a className="hover:text-coral" href={`tel:${lead.telefono}`}>
                      {lead.telefono}
                    </a>
                  </li>
                ) : null}
              </ul>
            </Section>

            {/* Qualification */}
            <Section title="Qualification">
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-text-2">
                <Dt>Budget</Dt>
                <Dd>{lead.budget_range ?? "—"}</Dd>
                <Dt>Timeline</Dt>
                <Dd>{lead.timeline ?? "—"}</Dd>
                <Dt>Pre-approved</Dt>
                <Dd>
                  {lead.pre_approved == null
                    ? "—"
                    : lead.pre_approved
                      ? "Yes"
                      : "No"}
                </Dd>
                <Dt>Source</Dt>
                <Dd>{lead.origen.replace("_", " ")}</Dd>
                {lead.utm_source ? (
                  <>
                    <Dt>UTM</Dt>
                    <Dd>
                      {lead.utm_source}
                      {lead.utm_medium ? ` / ${lead.utm_medium}` : ""}
                    </Dd>
                  </>
                ) : null}
              </dl>
            </Section>

            {/* Status pipeline */}
            <Section title="Status">
              <div className="grid grid-cols-3 gap-1.5">
                {LEAD_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={savingStatus}
                    onClick={() => updateStatus(s)}
                    className={cn(
                      "rounded-sm border px-2 py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] transition-colors",
                      status === s
                        ? "border-espresso bg-espresso text-text-on-dark"
                        : "border-rule-strong bg-ivory text-text-2 hover:border-espresso/50",
                      savingStatus && "opacity-60",
                    )}
                  >
                    {LEAD_STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </Section>

            {/* Their message */}
            {lead.mensaje ? (
              <Section title="Their message">
                <p className="rounded-sm border border-rule bg-paper p-3 font-serif text-sm italic leading-relaxed text-text-2">
                  &ldquo;{lead.mensaje}&rdquo;
                </p>
              </Section>
            ) : null}

            {/* Seller notes */}
            <Section title="Your notes">
              <Textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything you want to remember about this lead?"
              />
              <div className="mt-2 flex justify-end">
                <Button type="button" size="sm" onClick={saveNotes} disabled={savingNotes}>
                  {savingNotes ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  Save notes
                </Button>
              </div>
            </Section>

            {/* Quick actions */}
            <Section title="Actions">
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="ghost" size="sm">
                  <a href={`mailto:${lead.email}`}>
                    <Mail className="h-3 w-3" /> Email
                  </a>
                </Button>
                {lead.telefono ? (
                  <Button asChild variant="ghost" size="sm">
                    <a href={`tel:${lead.telefono}`}>
                      <Phone className="h-3 w-3" /> Call
                    </a>
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={savingStatus || status === "lost"}
                  onClick={() => updateStatus("lost")}
                >
                  Mark as lost
                </Button>
              </div>
            </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <div className="data-key">{title}</div>
      {children}
    </section>
  );
}

function Dt({ children }: { children: React.ReactNode }) {
  return (
    <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-3">{children}</dt>
  );
}
function Dd({ children }: { children: React.ReactNode }) {
  return <dd className="text-text-2">{children}</dd>;
}
