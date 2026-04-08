/**
 * Notification service — SendGrid (email) + Twilio (WhatsApp / SMS)
 * Called from API routes after key events.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationEvent =
  | "new_lead"
  | "showing_scheduled"
  | "showing_reminder"
  | "showing_confirmed"
  | "offer_received"
  | "offer_accepted"
  | "negotiation_update"
  | "payment_confirmed"
  | "welcome";

interface Recipient {
  name: string;
  email?: string;
  phone?: string; // E.164 format: +573001234567
  whatsapp?: string;
}

interface NotificationPayload {
  event: NotificationEvent;
  to: Recipient;
  data: Record<string, string | number | undefined>;
}

// ---------------------------------------------------------------------------
// SendGrid email
// ---------------------------------------------------------------------------

async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string,
  textBody: string
): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL ?? "hola@nocomiss.com";

  if (!apiKey) {
    console.warn("[notifications] SENDGRID_API_KEY not set — skipping email");
    return;
  }

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: fromEmail, name: "NoComiss" },
      subject,
      content: [
        { type: "text/plain", value: textBody },
        { type: "text/html", value: htmlBody },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[notifications] SendGrid error:", err);
  }
}

// ---------------------------------------------------------------------------
// Twilio WhatsApp / SMS
// ---------------------------------------------------------------------------

async function sendWhatsApp(to: string, message: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn("[notifications] Twilio not configured — skipping WhatsApp");
    return;
  }

  // Normalize phone: ensure E.164
  const toNumber = to.startsWith("+") ? to : `+${to}`;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const body = new URLSearchParams({
    From: `whatsapp:+${fromNumber.replace(/\D/g, "")}`,
    To: `whatsapp:${toNumber}`,
    Body: message,
  });

  const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[notifications] Twilio error:", err);
  }
}

// ---------------------------------------------------------------------------
// Template builder
// ---------------------------------------------------------------------------

function buildTemplate(event: NotificationEvent, data: Record<string, string | number | undefined>): {
  subject: string;
  html: string;
  text: string;
  whatsapp: string;
} {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://nocomiss.com";
  const dashboardUrl = `${appUrl}/dashboard`;

  const templates: Record<
    NotificationEvent,
    { subject: string; html: string; text: string; whatsapp: string }
  > = {
    new_lead: {
      subject: `🏠 Nuevo interesado en ${data.listing_title ?? "tu inmueble"}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="color:#111">Nuevo comprador interesado</h2>
          <p><strong>${data.buyer_name}</strong> se interesó por <strong>${data.listing_title}</strong>.</p>
          ${data.buyer_phone ? `<p>📱 Teléfono: <strong>${data.buyer_phone}</strong></p>` : ""}
          ${data.buyer_email ? `<p>✉️ Email: <strong>${data.buyer_email}</strong></p>` : ""}
          ${data.message ? `<p>💬 Mensaje: <em>${data.message}</em></p>` : ""}
          <a href="${dashboardUrl}" style="display:inline-block;background:#3ece97;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;font-weight:600">Ver en dashboard</a>
          <p style="color:#999;font-size:12px;margin-top:24px">NoComiss · Vende sin pagar comisión</p>
        </div>`,
      text: `Nuevo interesado: ${data.buyer_name} en ${data.listing_title}. Tel: ${data.buyer_phone ?? "N/A"}. Ver: ${dashboardUrl}`,
      whatsapp: `🏠 *Nuevo comprador interesado*\n\n*${data.buyer_name}* quiere información sobre *${data.listing_title}*.\n📱 ${data.buyer_phone ?? "Sin teléfono"}\n\nVe los detalles en: ${dashboardUrl}`,
    },
    showing_scheduled: {
      subject: `📅 Visita agendada — ${data.listing_title}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="color:#111">Visita agendada</h2>
          <p><strong>${data.buyer_name}</strong> agendó una visita para <strong>${data.listing_title}</strong>.</p>
          <p>📅 Fecha: <strong>${data.scheduled_at}</strong></p>
          ${data.meet_link ? `<p>🎥 Google Meet: <a href="${data.meet_link}">${data.meet_link}</a></p>` : ""}
          <a href="${dashboardUrl}/visitas" style="display:inline-block;background:#3ece97;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;font-weight:600">Ver visita</a>
        </div>`,
      text: `Visita agendada con ${data.buyer_name} el ${data.scheduled_at} para ${data.listing_title}.`,
      whatsapp: `📅 *Visita agendada*\n\n*${data.buyer_name}* quiere visitar *${data.listing_title}*\n🗓 ${data.scheduled_at}\n\nVe los detalles en: ${dashboardUrl}/visitas`,
    },
    showing_reminder: {
      subject: `⏰ Recordatorio: Visita mañana — ${data.listing_title}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="color:#111">Tienes una visita mañana</h2>
          <p><strong>${data.buyer_name}</strong> visitará <strong>${data.listing_title}</strong> mañana.</p>
          <p>📅 <strong>${data.scheduled_at}</strong></p>
          ${data.meet_link ? `<p>🎥 <a href="${data.meet_link}">Unirse a Meet</a></p>` : ""}
        </div>`,
      text: `Recordatorio: visita mañana con ${data.buyer_name} — ${data.scheduled_at}.`,
      whatsapp: `⏰ *Recordatorio de visita*\n\nMañana tienes visita con *${data.buyer_name}*\n📍 ${data.listing_title}\n🗓 ${data.scheduled_at}`,
    },
    showing_confirmed: {
      subject: `✅ Visita confirmada — ${data.listing_title}`,
      html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px"><h2>Visita confirmada</h2><p>Tu visita para el ${data.scheduled_at} fue confirmada.</p></div>`,
      text: `Tu visita para ${data.listing_title} el ${data.scheduled_at} fue confirmada.`,
      whatsapp: `✅ *Visita confirmada*\n\nTu visita para *${data.listing_title}* el ${data.scheduled_at} está confirmada.`,
    },
    offer_received: {
      subject: `💰 Nueva oferta — ${data.listing_title}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="color:#111">Recibiste una oferta</h2>
          <p><strong>${data.buyer_name}</strong> hizo una oferta de <strong>$${Number(data.amount ?? 0).toLocaleString("es-CO")}</strong> por <strong>${data.listing_title}</strong>.</p>
          <a href="${dashboardUrl}/negociaciones" style="display:inline-block;background:#3ece97;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;font-weight:600">Ver oferta</a>
        </div>`,
      text: `Nueva oferta de ${data.buyer_name}: $${data.amount} por ${data.listing_title}.`,
      whatsapp: `💰 *Nueva oferta recibida*\n\n*${data.buyer_name}* ofrece *$${Number(data.amount ?? 0).toLocaleString("es-CO")} COP* por *${data.listing_title}*\n\nResponde en: ${dashboardUrl}/negociaciones`,
    },
    offer_accepted: {
      subject: `🎉 ¡Oferta aceptada! — ${data.listing_title}`,
      html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px"><h2>¡Felicitaciones!</h2><p>Se aceptó la oferta de <strong>$${Number(data.amount ?? 0).toLocaleString("es-CO")}</strong>. El proceso de cierre empieza ahora.</p></div>`,
      text: `¡Oferta aceptada! $${data.amount} por ${data.listing_title}.`,
      whatsapp: `🎉 *¡Oferta aceptada!*\n\nLa oferta de *$${Number(data.amount ?? 0).toLocaleString("es-CO")} COP* para *${data.listing_title}* fue aceptada.\n\nSigue el proceso en: ${dashboardUrl}/negociaciones`,
    },
    negotiation_update: {
      subject: `📋 Actualización de negociación — ${data.listing_title}`,
      html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px"><h2>Actualización</h2><p>${data.message}</p><a href="${dashboardUrl}/negociaciones" style="display:inline-block;background:#3ece97;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">Ver detalles</a></div>`,
      text: `Actualización en ${data.listing_title}: ${data.message}`,
      whatsapp: `📋 *Actualización de negociación*\n\n${data.message}\n\nVer en: ${dashboardUrl}/negociaciones`,
    },
    payment_confirmed: {
      subject: `✅ Pago confirmado — Plan ${data.plan_name}`,
      html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px"><h2>¡Pago recibido!</h2><p>Tu plan <strong>${data.plan_name}</strong> está activo. Ya puedes publicar tus inmuebles.</p><a href="${dashboardUrl}" style="display:inline-block;background:#3ece97;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">Ir al dashboard</a></div>`,
      text: `Plan ${data.plan_name} activado. Comienza a publicar en ${dashboardUrl}.`,
      whatsapp: `✅ *Pago confirmado*\n\nTu plan *${data.plan_name}* está activo.\n\nYa puedes publicar tus inmuebles en: ${dashboardUrl}`,
    },
    welcome: {
      subject: "🏠 Bienvenido a NoComiss — empieza a vender sin comisión",
      html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px"><h2>¡Bienvenido, ${data.name}!</h2><p>Estás a un paso de ahorrar miles en comisiones. Publica tu primer inmueble en minutos.</p><a href="${dashboardUrl}/listings/new" style="display:inline-block;background:#3ece97;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;font-weight:600">Publicar mi inmueble</a></div>`,
      text: `Bienvenido a NoComiss, ${data.name}. Publica en ${dashboardUrl}/listings/new`,
      whatsapp: `🏠 *Bienvenido a NoComiss, ${data.name}!*\n\nEmpieza a vender sin pagar comisión. Publica tu primer inmueble en:\n${dashboardUrl}/listings/new`,
    },
  };

  return templates[event];
}

// ---------------------------------------------------------------------------
// Main notify function — called from API routes
// ---------------------------------------------------------------------------

export async function notify(payload: NotificationPayload): Promise<void> {
  const { event, to, data } = payload;
  const template = buildTemplate(event, data);

  const tasks: Promise<void>[] = [];

  if (to.email) {
    tasks.push(sendEmail(to.email, template.subject, template.html, template.text));
  }

  const phone = to.whatsapp ?? to.phone;
  if (phone) {
    tasks.push(sendWhatsApp(phone, template.whatsapp));
  }

  await Promise.allSettled(tasks);
}

// ---------------------------------------------------------------------------
// Convenience wrappers
// ---------------------------------------------------------------------------

export async function notifyNewLead(params: {
  sellerEmail?: string;
  sellerPhone?: string;
  listingTitle: string;
  buyerName: string;
  buyerPhone?: string;
  buyerEmail?: string;
  message?: string;
}) {
  await notify({
    event: "new_lead",
    to: { name: "Vendedor", email: params.sellerEmail, phone: params.sellerPhone },
    data: {
      listing_title: params.listingTitle,
      buyer_name: params.buyerName,
      buyer_phone: params.buyerPhone,
      buyer_email: params.buyerEmail,
      message: params.message,
    },
  });
}

export async function notifyShowingScheduled(params: {
  sellerEmail?: string;
  sellerPhone?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  listingTitle: string;
  buyerName: string;
  scheduledAt: string;
  meetLink?: string;
}) {
  await Promise.allSettled([
    notify({
      event: "showing_scheduled",
      to: { name: "Vendedor", email: params.sellerEmail, phone: params.sellerPhone },
      data: {
        listing_title: params.listingTitle,
        buyer_name: params.buyerName,
        scheduled_at: params.scheduledAt,
        meet_link: params.meetLink,
      },
    }),
    notify({
      event: "showing_confirmed",
      to: { name: params.buyerName, email: params.buyerEmail, phone: params.buyerPhone },
      data: {
        listing_title: params.listingTitle,
        scheduled_at: params.scheduledAt,
        meet_link: params.meetLink,
      },
    }),
  ]);
}

export async function notifyOfferReceived(params: {
  sellerEmail?: string;
  sellerPhone?: string;
  listingTitle: string;
  buyerName: string;
  amount: number;
}) {
  await notify({
    event: "offer_received",
    to: { name: "Vendedor", email: params.sellerEmail, phone: params.sellerPhone },
    data: {
      listing_title: params.listingTitle,
      buyer_name: params.buyerName,
      amount: params.amount,
    },
  });
}

export async function notifyPaymentConfirmed(params: {
  userEmail?: string;
  userPhone?: string;
  planName: string;
}) {
  await notify({
    event: "payment_confirmed",
    to: { name: "Usuario", email: params.userEmail, phone: params.userPhone },
    data: { plan_name: params.planName },
  });
}

export async function notifyWelcome(params: {
  userEmail?: string;
  userPhone?: string;
  name: string;
}) {
  await notify({
    event: "welcome",
    to: { name: params.name, email: params.userEmail, phone: params.userPhone },
    data: { name: params.name },
  });
}
