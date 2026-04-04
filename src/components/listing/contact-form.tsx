"use client";

import { useState } from "react";
import { MessageSquare, Phone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  listingId: string;
  userId: string;
}

export function ListingContactForm({ listingId, userId }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listingId,
          user_id: userId,
          name,
          phone,
          email,
          message,
          source: "web",
        }),
      });

      if (!res.ok) throw new Error("Error al enviar");
      setSubmitted(true);
    } catch {
      setError("Hubo un problema. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-8">
          <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-1">Mensaje enviado</h3>
          <p className="text-sm text-gray-500">
            El vendedor te contactará pronto. También puedes esperar un mensaje por WhatsApp.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Estoy interesado/a
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="Tu nombre"
            placeholder="Carlos Rodríguez"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Teléfono / WhatsApp"
            type="tel"
            placeholder="+57 300 000 0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            prefix={<Phone className="w-4 h-4" />}
          />
          <Input
            label="Correo (opcional)"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Textarea
            label="Mensaje (opcional)"
            placeholder="Me gustaría agendar una visita este fin de semana..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[80px]"
          />

          {error && <p className="text-xs text-red-500">{error}</p>}

          <Button
            type="submit"
            size="md"
            className="w-full"
            loading={loading}
            disabled={!name}
          >
            Enviar mensaje
          </Button>

          <p className="text-xs text-gray-400 text-center">
            Un agente IA responderá tu consulta en minutos.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
