import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EventData {
  title: string;
  venue?: string;
  city?: string;
  start_date?: string;
  original_description?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const eventData: EventData = await req.json();
    console.log("Generating descriptions for:", eventData.title);

    const { title, venue, city, start_date, original_description } = eventData;

    // Format date nicely
    let dateStr = "";
    if (start_date) {
      try {
        const date = new Date(start_date);
        dateStr = date.toLocaleDateString("de-CH", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      } catch {
        dateStr = start_date;
      }
    }

    const contextInfo = [
      `Event: ${title}`,
      venue ? `Venue: ${venue}` : null,
      city ? `Stadt: ${city}` : null,
      dateStr ? `Datum: ${dateStr}` : null,
      original_description && !original_description.includes("Details werden vom Veranstalter nicht näher beschrieben")
        ? `Originalbeschreibung: ${original_description}`
        : null,
    ].filter(Boolean).join("\n");

    const systemPrompt = `Du bist ein kreativer Event-Texter für eine Premium-Event-Plattform in der Schweiz. 
Du schreibst ansprechende, einladende Texte auf Deutsch die Lust auf das Event machen.
Schreibe NIEMALS Emojis. Sei elegant und professionell aber nicht steif.
Nutze die verfügbaren Informationen kreativ - auch wenn wenig Details vorhanden sind, 
kannst du basierend auf dem Event-Namen und Veranstaltungsort eine atmosphärische Beschreibung erstellen.`;

    const userPrompt = `Erstelle zwei Beschreibungen für dieses Event:

${contextInfo}

1. LONG_DESCRIPTION: Eine ausführliche, einladende Beschreibung (3-5 Sätze) für die Event-Detailseite. 
   Beschreibe die Atmosphäre, was die Besucher erwartet, warum man hingehen sollte.

2. SHORT_DESCRIPTION: Eine kurze, packende Beschreibung (genau 2 Zeilen, ca. 80-120 Zeichen).
   Muss neugierig machen und das Wesentliche erfassen.

Antworte NUR im folgenden JSON-Format, ohne weitere Erklärungen:
{"long_description": "...", "short_description": "..."}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        console.error("Payment required");
        return new Response(
          JSON.stringify({ error: "AI credits exhausted, please add funds" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("AI response:", content);

    // Parse JSON from response (handle potential markdown code blocks)
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.slice(7);
    }
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith("```")) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    const descriptions = JSON.parse(jsonStr);

    console.log("Generated descriptions:", {
      long: descriptions.long_description?.substring(0, 50) + "...",
      short: descriptions.short_description,
    });

    return new Response(
      JSON.stringify({
        long_description: descriptions.long_description,
        short_description: descriptions.short_description,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error generating descriptions:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
