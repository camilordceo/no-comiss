import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { listing_id, property_type, address, city, neighborhood, area_m2, bedrooms, bathrooms, parking, stratum, amenities, story, price } = body;

  if (!listing_id) {
    return NextResponse.json({ error: "Missing listing_id" }, { status: 400 });
  }

  const propertyDesc = [
    property_type === "apartment" ? "Apartamento" : property_type === "house" ? "Casa" : "Inmueble",
    `${area_m2}m²`,
    bedrooms > 0 ? `${bedrooms} habitaciones` : null,
    bathrooms > 0 ? `${bathrooms} baños` : null,
    parking > 0 ? `${parking} parqueadero(s)` : null,
    stratum ? `estrato ${stratum}` : null,
  ].filter(Boolean).join(", ");

  const amenitiesList = amenities?.length > 0 ? amenities.join(", ") : "No especificadas";

  const prompt = `Eres un experto en marketing inmobiliario en Colombia. Escribe 3 descripciones profesionales y persuasivas para este inmueble. Cada descripción debe tener un tono diferente.

DATOS DEL INMUEBLE:
- Tipo: ${propertyDesc}
- Dirección: ${address}, ${neighborhood || city}, ${city}
- Precio: $${Number(price).toLocaleString("es-CO")} COP
- Amenidades: ${amenitiesList}
- Historia del propietario: "${story}"

INSTRUCCIONES:
1. Descripción EMOCIONAL: enfócate en el estilo de vida, la sensación de vivir ahí, las emociones.
2. Descripción TÉCNICA: destaca los datos concretos, la calidad, las características únicas.
3. Descripción STORYTELLING: cuenta una historia breve sobre quién viviría aquí y por qué sería perfecto.

Cada descripción debe:
- Tener entre 120-200 palabras
- Incluir un título corto (máximo 10 palabras) antes de la descripción
- Estar escrita en español colombiano natural
- Terminar con una llamada a la acción breve
- NO mencionar precios ni comisiones
- NO usar emojis

Responde SOLO con JSON válido en este formato exacto:
{
  "descriptions": [
    {"title": "...", "body": "..."},
    {"title": "...", "body": "..."},
    {"title": "...", "body": "..."}
  ]
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Invalid AI response" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Save to listing
    await supabase
      .from("listings")
      .update({ ai_descriptions: parsed.descriptions })
      .eq("id", listing_id)
      .eq("user_id", user.id);

    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
