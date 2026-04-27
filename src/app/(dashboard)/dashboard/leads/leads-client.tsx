"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Mail, Phone, ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABEL,
  LEAD_STATUS_VARIANT,
} from "@/lib/types/app";
import type { Lead, LeadStatus, Propiedad } from "@/lib/types/database";
import { formatRelativeDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { LeadDetailPanel } from "@/components/dashboard/lead-detail-panel";

interface Props {
  leads: Lead[];
  propertiesById: Record<string, Pick<Propiedad, "id" | "address_line1" | "ciudad" | "state" | "slug">>;
}

type Filter = "all" | LeadStatus;

const FILTER_LABELS: Filter[] = ["all", ...LEAD_STATUSES];

export function LeadsClient({ leads, propertiesById }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [activeId, setActiveId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const by: Record<string, number> = { all: leads.length };
    LEAD_STATUSES.forEach((s) => {
      by[s] = leads.filter((l) => l.status === s).length;
    });
    return by;
  }, [leads]);

  const filtered = filter === "all" ? leads : leads.filter((l) => l.status === filter);
  const active = activeId ? leads.find((l) => l.id === activeId) ?? null : null;
  const activeProperty = active?.propiedad_interes_id
    ? propertiesById[active.propiedad_interes_id]
    : undefined;
  const activeAddress = activeProperty
    ? [activeProperty.address_line1, activeProperty.ciudad, activeProperty.state]
        .filter(Boolean)
        .join(", ")
    : null;

  return (
    <div className="space-y-6">
      {/* Pill filter row */}
      <div className="-mx-1 flex flex-wrap gap-1.5 overflow-x-auto px-1 pb-1">
        {FILTER_LABELS.map((f) => {
          const isActive = filter === f;
          const label = f === "all" ? "All" : LEAD_STATUS_LABEL[f];
          const count = counts[f] ?? 0;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "inline-flex items-center gap-2 rounded-sm border px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors",
                isActive
                  ? "border-espresso bg-espresso text-text-on-dark"
                  : "border-rule-strong bg-ivory text-text-2 hover:border-espresso/50",
              )}
            >
              {label}
              <span
                className={cn(
                  "rounded-sm px-1 text-[9px]",
                  isActive ? "bg-text-on-dark/15 text-text-on-dark" : "bg-crema-2 text-text-3",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-sm border border-rule bg-ivory p-10 text-center">
          <p className="font-serif text-lg italic text-text-3">
            {filter === "all"
              ? "No leads yet. They'll show up here when buyers reach out."
              : "Nothing in this stage."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((lead) => {
            const prop = lead.propiedad_interes_id
              ? propertiesById[lead.propiedad_interes_id]
              : undefined;
            const address = prop?.address_line1
              ? `${prop.address_line1}${prop.ciudad ? `, ${prop.ciudad}` : ""}`
              : null;
            return (
              <li key={lead.id} className="border border-rule bg-ivory transition-colors hover:border-espresso/40">
                <button
                  type="button"
                  onClick={() => setActiveId(lead.id)}
                  className="block w-full p-5 text-left"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={LEAD_STATUS_VARIANT[lead.status]}>
                          {LEAD_STATUS_LABEL[lead.status]}
                        </Badge>
                        <Badge variant="outline">{lead.form_type}</Badge>
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-3">
                          {formatRelativeDate(lead.created_at)}
                        </span>
                      </div>
                      <div className="font-serif text-lg font-medium leading-tight text-text">
                        {lead.nombre}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-2">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3 w-3 text-text-3" aria-hidden />
                          {lead.email}
                        </span>
                        {lead.telefono ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3 text-text-3" aria-hidden />
                            {lead.telefono}
                          </span>
                        ) : null}
                      </div>
                      {(lead.budget_range || lead.pre_approved != null) && (
                        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-3">
                          {lead.budget_range ? `Budget: ${lead.budget_range}` : null}
                          {lead.budget_range && lead.pre_approved ? " · " : null}
                          {lead.pre_approved ? "Pre-approved ✓" : null}
                        </div>
                      )}
                      {address ? (
                        <div className="text-xs text-text-3">→ {address}</div>
                      ) : null}
                      {lead.mensaje ? (
                        <p className="line-clamp-2 font-serif text-sm italic leading-snug text-text-2">
                          &ldquo;{lead.mensaje}&rdquo;
                        </p>
                      ) : null}
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-text-3" aria-hidden />
                  </div>
                </button>
                {prop?.slug ? (
                  <div className="border-t border-rule px-5 py-2 text-right">
                    <Link
                      href={`/homes/${prop.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-text-3 hover:text-coral"
                    >
                      View public listing →
                    </Link>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <LeadDetailPanel
        lead={active}
        propertyAddress={activeAddress}
        onClose={() => setActiveId(null)}
      />
    </div>
  );
}
