"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Calendar, Loader2, Mail, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CITA_LABEL } from "@/lib/types/app";
import type { Cita, CitaEstado, Propiedad } from "@/lib/types/database";
import { cn } from "@/lib/utils/cn";
import { logger } from "@/lib/utils/logger";

interface Props {
  citas: Cita[];
  propertiesById: Record<string, Pick<Propiedad, "id" | "address_line1" | "ciudad" | "state" | "slug">>;
}

const TIME_LABEL: Record<NonNullable<Cita["preferred_time"]>, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

export function ShowingsClient({ citas: initialCitas, propertiesById }: Props) {
  const [citas, setCitas] = useState<Cita[]>(initialCitas);

  const groups = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming: Cita[] = [];
    const completed: Cita[] = [];
    const cancelled: Cita[] = [];

    for (const c of citas) {
      if (c.estado === "cancelada") {
        cancelled.push(c);
      } else if (c.estado === "completada") {
        completed.push(c);
      } else {
        upcoming.push(c);
      }
    }

    upcoming.sort((a, b) => {
      const ad = a.preferred_date ? new Date(a.preferred_date).getTime() : 0;
      const bd = b.preferred_date ? new Date(b.preferred_date).getTime() : 0;
      return ad - bd;
    });

    return { upcoming, completed, cancelled };
  }, [citas]);

  const apply = (next: Cita) => {
    setCitas((prev) => prev.map((c) => (c.id === next.id ? next : c)));
  };

  return (
    <Tabs defaultValue="upcoming">
      <TabsList>
        <TabsTrigger value="upcoming">Upcoming · {groups.upcoming.length}</TabsTrigger>
        <TabsTrigger value="completed">Completed · {groups.completed.length}</TabsTrigger>
        <TabsTrigger value="cancelled">Cancelled · {groups.cancelled.length}</TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming">
        <Group items={groups.upcoming} propertiesById={propertiesById} onUpdate={apply} canAct />
      </TabsContent>
      <TabsContent value="completed">
        <Group items={groups.completed} propertiesById={propertiesById} onUpdate={apply} canAct={false} />
      </TabsContent>
      <TabsContent value="cancelled">
        <Group items={groups.cancelled} propertiesById={propertiesById} onUpdate={apply} canAct={false} />
      </TabsContent>
    </Tabs>
  );
}

function Group({
  items,
  propertiesById,
  onUpdate,
  canAct,
}: {
  items: Cita[];
  propertiesById: Props["propertiesById"];
  onUpdate: (next: Cita) => void;
  canAct: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-sm border border-rule bg-ivory p-10 text-center">
        <p className="font-serif text-lg italic text-text-3">Nothing here yet.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((c) => (
        <ShowingCard
          key={c.id}
          cita={c}
          property={propertiesById[c.propiedad_id]}
          onUpdate={onUpdate}
          canAct={canAct}
        />
      ))}
    </ul>
  );
}

function ShowingCard({
  cita,
  property,
  onUpdate,
  canAct,
}: {
  cita: Cita;
  property?: Props["propertiesById"][string];
  onUpdate: (next: Cita) => void;
  canAct: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<CitaEstado | null>(null);

  const update = async (estado: CitaEstado) => {
    setBusy(estado);
    try {
      const res = await fetch(`/api/citas/${cita.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Couldn't update");
      onUpdate(body.cita as Cita);
      logger.info("cita.updated", { id: cita.id, estado });
      toast.success(`Marked ${CITA_LABEL[estado].toLowerCase()}.`);
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(null);
    }
  };

  const variant: "ready" | "active" | "paused" | "secondary" =
    cita.estado === "confirmada"
      ? "ready"
      : cita.estado === "programada"
        ? "active"
        : cita.estado === "cancelada"
          ? "paused"
          : "secondary";

  return (
    <li className="border border-rule bg-ivory p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-text-3" aria-hidden />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-text">
              {formatDate(cita.preferred_date)}
              {cita.preferred_time ? ` · ${TIME_LABEL[cita.preferred_time]}` : ""}
            </span>
            <Badge variant={variant}>{CITA_LABEL[cita.estado]}</Badge>
          </div>
          <div className="font-serif text-xl font-medium leading-tight text-text">
            {cita.nombre}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-2">
            <span className="inline-flex items-center gap-1">
              <Mail className="h-3 w-3 text-text-3" aria-hidden />
              <a className="hover:text-coral" href={`mailto:${cita.email}`}>
                {cita.email}
              </a>
            </span>
            {cita.telefono ? (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3 w-3 text-text-3" aria-hidden />
                <a className="hover:text-coral" href={`tel:${cita.telefono}`}>
                  {cita.telefono}
                </a>
              </span>
            ) : null}
          </div>
          {property?.address_line1 ? (
            <div className="text-xs text-text-3">
              → {property.address_line1}
              {property.ciudad ? `, ${property.ciudad}` : ""}
              {property.slug ? (
                <>
                  {" · "}
                  <Link
                    href={`/homes/${property.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-coral"
                  >
                    public page →
                  </Link>
                </>
              ) : null}
            </div>
          ) : null}
          {cita.notas ? (
            <p className="font-serif text-sm italic text-text-2">&ldquo;{cita.notas}&rdquo;</p>
          ) : null}
        </div>

        {canAct ? (
          <div className="flex flex-wrap gap-2">
            {cita.estado !== "confirmada" ? (
              <Button
                type="button"
                variant="spark"
                size="sm"
                disabled={busy !== null}
                onClick={() => update("confirmada")}
              >
                {busy === "confirmada" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : null}
                Confirm
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy !== null}
                onClick={() => update("completada")}
              >
                {busy === "completada" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : null}
                Mark completed
              </Button>
            )}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={busy !== null}
              onClick={() => update("cancelada")}
            >
              {busy === "cancelada" ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Cancel
            </Button>
          </div>
        ) : null}
      </div>
    </li>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "Date TBD";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
