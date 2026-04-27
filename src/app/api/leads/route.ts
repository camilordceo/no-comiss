import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { leadSubmissionSchema } from "@/lib/utils/validation";
import { logger } from "@/lib/utils/logger";

const PUBLIC_STATUSES = ["active", "under_offer", "sold"] as const;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = leadSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  // Resolve the property by slug. Anon RLS policy `propiedades_public_active`
  // allows SELECT only when listing_status is in our public set.
  const { data: property, error: propErr } = await supabase
    .from("propiedades")
    .select("id, empresa_id, listing_status, address_line1, ciudad, state")
    .eq("slug", parsed.data.property_slug)
    .maybeSingle();

  if (propErr) {
    logger.warn("leads.property_lookup_failed", {
      slug: parsed.data.property_slug,
      message: propErr.message,
    });
  }
  if (!property) {
    return NextResponse.json({ error: "listing_not_found" }, { status: 404 });
  }
  if (!PUBLIC_STATUSES.includes(property.listing_status as (typeof PUBLIC_STATUSES)[number])) {
    return NextResponse.json({ error: "listing_not_public" }, { status: 410 });
  }

  const data = parsed.data;
  const sharedLead = {
    empresa_id: property.empresa_id,
    propiedad_interes_id: property.id,
    nombre: data.nombre,
    email: data.email,
    telefono: data.telefono ?? null,
    origen: data.origen ?? "mini_site",
    form_type: data.form_type,
    utm_source: data.utm_source ?? null,
    utm_medium: data.utm_medium ?? null,
    utm_campaign: data.utm_campaign ?? null,
  } as const;

  let leadInsert: Parameters<typeof supabase.from>[0] extends infer _T ? unknown : never;
  leadInsert = null;

  if (data.form_type === "inquiry") {
    leadInsert = {
      ...sharedLead,
      mensaje: data.message?.trim() || null,
      pre_approved: data.pre_approved ?? null,
      budget_range: data.budget_range?.trim() || null,
      timeline: data.timeline?.trim() || null,
      metadata: {},
    };
  } else if (data.form_type === "showing") {
    leadInsert = {
      ...sharedLead,
      mensaje: data.message?.trim() || null,
      pre_approved: data.pre_approved ?? null,
      metadata: {
        preferred_date: data.preferred_date ?? null,
        preferred_time: data.preferred_time ?? null,
      },
    };
  } else {
    leadInsert = {
      ...sharedLead,
      mensaje: data.message?.trim() || null,
      metadata: {
        offer_price: data.offer_price,
        earnest_money: data.earnest_money ?? null,
        financing: data.financing ?? null,
        pre_approved_status: data.pre_approved_status ?? null,
        closing_date: data.closing_date ?? null,
        contingencies: data.contingencies,
      },
    };
  }

  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .insert(leadInsert as never)
    .select("*")
    .single();

  if (leadErr || !lead) {
    logger.error("leads.insert_failed", {
      message: leadErr?.message,
      slug: data.property_slug,
    });
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  // Side effects per form type. The leads trigger fans out notifications
  // automatically — no extra notification insert needed here.
  if (data.form_type === "showing") {
    const { error: citaErr } = await supabase.from("citas").insert({
      empresa_id: property.empresa_id,
      propiedad_id: property.id,
      lead_id: lead.id,
      nombre: data.nombre,
      email: data.email,
      telefono: data.telefono ?? null,
      preferred_date: data.preferred_date ?? null,
      preferred_time: data.preferred_time ?? null,
      notas: data.message?.trim() || null,
    });
    if (citaErr) {
      logger.warn("leads.cita_insert_failed", {
        leadId: lead.id,
        message: citaErr.message,
      });
    }
  }

  if (data.form_type === "offer") {
    const { error: ofertaErr } = await supabase.from("ofertas").insert({
      empresa_id: property.empresa_id,
      propiedad_id: property.id,
      lead_id: lead.id,
      nombre: data.nombre,
      email: data.email,
      telefono: data.telefono ?? null,
      offer_price: data.offer_price,
      earnest_money: data.earnest_money ?? null,
      financing: data.financing ?? null,
      pre_approved: data.pre_approved_status ?? null,
      closing_date: data.closing_date ?? null,
      contingencies: data.contingencies,
      notas: data.message?.trim() || null,
    });
    if (ofertaErr) {
      logger.warn("leads.oferta_insert_failed", {
        leadId: lead.id,
        message: ofertaErr.message,
      });
    }
  }

  logger.info("leads.created", {
    leadId: lead.id,
    formType: data.form_type,
    slug: data.property_slug,
  });

  return NextResponse.json({ ok: true, lead_id: lead.id });
}
