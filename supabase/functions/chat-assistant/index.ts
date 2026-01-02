import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `Du bist ein freundlicher Event-Berater für Erlebnisse in der Schweiz. Dein Name ist "Erlebnis-Guide".

WICHTIGE REGELN:
1. Stelle immer nur EINE kurze Frage pro Nachricht (max 1 Satz)
2. Keine langen Texte, keine Aufzählungen von Fragen
3. Der User sieht visuelle Kacheln zum Anklicken - du musst diese NICHT auflisten
4. Sei knapp, warm und nutze 1-2 passende Emojis

ABLAUF (der Frontend-Wizard übernimmt die Kacheln):
- Mission gewählt → Kurze Bestätigung, dann zeigt das UI die Zeit-Kacheln
- Zeit gewählt → Kurze Bestätigung, dann zeigt das UI die Ort-Eingabe
- Ort gewählt → Jetzt erst gibst du 2-3 konkrete Event-Empfehlungen

BEI EVENT-EMPFEHLUNGEN:
- Maximal 3 Events nennen
- Pro Event: Name, Datum, Ort, 1 Satz warum es passt
- Halte es kurz und einladend

BEISPIEL-ANTWORTEN:
- Nach "Erlebnisse zu zweit": "Romantik liegt in der Luft! 💕"
- Nach Zeitwahl: "Perfekt! 🗓️"
- Nach Ortwahl: "Zürich hat einiges zu bieten! Hier meine Top-Picks für euch: ..."

Sei enthusiastisch aber KURZ. Maximal 2 Sätze, außer du listest Events auf.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Optional: Fetch some events for context
    let eventContext = "";
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: events } = await supabase
          .from("external_events")
          .select("title, venue_name, city, event_date, category, tags, short_description")
          .gte("event_date", new Date().toISOString())
          .order("event_date", { ascending: true })
          .limit(20);
        
        if (events && events.length > 0) {
          eventContext = `\n\nAktuelle Events in der Datenbank:\n${events.map(e => 
            `- "${e.title}" am ${e.event_date?.split('T')[0]} in ${e.city || e.venue_name} (${e.category || 'Allgemein'})`
          ).join('\n')}`;
        }
      }
    } catch (dbError) {
      console.log("Could not fetch events for context:", dbError);
    }

    console.log("Calling Lovable AI with messages:", messages.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt + eventContext },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Zu viele Anfragen. Bitte versuche es gleich nochmal." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI-Guthaben aufgebraucht." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI-Fehler aufgetreten" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("chat-assistant error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unbekannter Fehler" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
