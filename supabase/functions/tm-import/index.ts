import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// KONFIGURATION
const TM_API_URL = "https://app.ticketmaster.com/discovery/v2/events.json";

// Die wichtigsten Ticketmaster-Genres mappen wir auf DEINE Subkategorien (Namen müssen exakt stimmen!)
const SUB_CATEGORY_MAPPING: Record<string, string> = {
  "Rock": "Rock & Pop Konzerte",
  "Pop": "Rock & Pop Konzerte",
  "Alternative": "Rock & Pop Konzerte",
  "Metal": "Rock & Pop Konzerte",
  "Jazz": "Jazz, Blues & Soul",
  "Blues": "Jazz, Blues & Soul",
  "Soul": "Jazz, Blues & Soul",
  "R&B": "Hip-Hop, RnB & Electronic",
  "Hip-Hop/Rap": "Hip-Hop, RnB & Electronic",
  "Dance/Electronic": "Hip-Hop, RnB & Electronic",
  "Classical": "Klassik, Oper & Ballett",
  "Opera": "Klassik, Oper & Ballett",
  "Theatre": "Theater, Musical & Show",
  "Musical": "Theater, Musical & Show",
  "Comedy": "Comedy & Kabarett",
  "Fine Art": "Museum, Kunst & Ausstellung",
  "Spectacular": "Show & Entertainment",
};

// VIBE-KEYWORDS (Deutsch & Englisch)
const ROMANTIC_KEYWORDS = [
  "romantisch", "romantic", "date", "liebe", "love", "candlelight", "kerzenlicht",
  "kerzenschein", "dinner", "gala", "piano", "klavier", "ballett", "ballet",
  "valentinstag", "valentine", "champagner", "champagne", "sunset", "sonnenuntergang",
  "couples", "paare", "night", "nacht", "jazz", "soul", "acoustic"
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starte TM-Import...");

    // Get secrets
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const EXTERNAL_SUPABASE_URL = Deno.env.get("Supabase_URL");
    const EXTERNAL_SERVICE_ROLE_KEY = Deno.env.get("Supabase_SERVICE_ROLE_KEY");
    const TM_API_KEY = Deno.env.get("TICKETMASTER_API_KEY");

    if (!EXTERNAL_SUPABASE_URL || !EXTERNAL_SERVICE_ROLE_KEY) {
      throw new Error("External Supabase credentials not configured");
    }

    if (!TM_API_KEY) {
      throw new Error("Ticketmaster API key not configured");
    }

    const supabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SERVICE_ROLE_KEY);

    // 1. Lade deine Kategorien & Tags aus der DB (damit wir die IDs kennen)
    const { data: taxonomy, error: taxonomyError } = await supabase.from("taxonomy").select("id, name, type");
    const { data: tags, error: tagsError } = await supabase.from("tags").select("id, name, slug");

    if (taxonomyError) {
      console.log("Taxonomy table might not exist, continuing without category mapping:", taxonomyError.message);
    }
    if (tagsError) {
      console.log("Tags table might not exist, continuing without tag mapping:", tagsError.message);
    }

    // Hilfsfunktion: Finde ID anhand des Namens
    const findCatId = (name: string) => taxonomy?.find(t => t.name === name)?.id || null;
    const findTagId = (slugPart: string) => tags?.find(t => t.slug?.includes(slugPart))?.id || null;

    // Wir suchen den "Romantisch"-Tag (Slug enthält 'romantisch')
    const romanticTagId = findTagId("romantisch");
    console.log("Romantisch Tag ID:", romanticTagId);

    // 2. Events von Ticketmaster holen (Schweiz, sortiert nach Datum)
    const tmUrl = `${TM_API_URL}?apikey=${TM_API_KEY}&countryCode=CH&size=50&sort=date,asc`;
    
    console.log("Fetching events from Ticketmaster...");
    const tmRes = await fetch(tmUrl);
    
    if (!tmRes.ok) {
      throw new Error(`Ticketmaster API error: ${tmRes.status}`);
    }
    
    const tmData = await tmRes.json();
    const events = tmData._embedded?.events || [];
    console.log(`Gefunden: ${events.length} Events.`);

    let processedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const event of events) {
      try {
        // -- A. BASIS DATEN --
        const title = event.name;
        const tmId = event.id;
        const venueBasic = event._embedded?.venues?.[0];
        const venueId = venueBasic?.id;
        const segmentName = event.classifications?.[0]?.segment?.name;
        const genreName = event.classifications?.[0]?.genre?.name;

        // -- B. ADRESSE NACHLADEN (Data Enrichment) --
        let addressData = { street: "", city: "", zip: "", country: "CH" };
        if (venueId) {
          try {
            const venueRes = await fetch(
              `https://app.ticketmaster.com/discovery/v2/venues/${venueId}.json?apikey=${TM_API_KEY}`
            );
            if (venueRes.ok) {
              const vData = await venueRes.json();
              addressData = {
                street: vData.address?.line1 ?? "",
                city: vData.city?.name ?? "",
                zip: vData.postalCode ?? "",
                country: vData.country?.countryCode ?? "CH"
              };
            }
          } catch (e) {
            console.error("Fehler beim Laden der Venue-Details:", e);
          }
        }

        // -- C. KATEGORIEN ZUORDNEN --
        let mainCatId = null;
        let subCatId = null;

        if (taxonomy) {
          // Hauptkategorie Logik
          if (segmentName === "Music") mainCatId = findCatId("Musik & Party");
          else if (segmentName === "Arts & Theatre") mainCatId = findCatId("Kunst & Kultur");
          else if (segmentName === "Sports") mainCatId = findCatId("Freizeit & Aktivitäten");
          else mainCatId = findCatId("Freizeit & Aktivitäten");

          // Subkategorie Logik (Das Mapping!)
          if (genreName && SUB_CATEGORY_MAPPING[genreName]) {
            subCatId = findCatId(SUB_CATEGORY_MAPPING[genreName]);
          }
        }

        // -- D. KI TEXT & TAGGING --
        let description = event.description || "";
        let shortDescription = "";
        let isRomantic = false;

        // Vibe-Check im Titel
        const textToCheck = (title + " " + (genreName || "")).toLowerCase();
        if (ROMANTIC_KEYWORDS.some(k => textToCheck.includes(k))) {
          isRomantic = true;
        }

        // Wenn keine Beschreibung da ist -> KI generieren
        if (OPENAI_API_KEY && (!description || description.length < 50)) {
          try {
            const prompt = `Schreibe eine kurze, einladende Event-Beschreibung (max 2 Sätze) auf Deutsch für: "${title}" in ${addressData.city || "der Schweiz"}. Genre: ${genreName || "Event"}. Stil: Quiet Luxury, Premium.`;
            
            const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENAI_API_KEY}`,
              },
              body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 100,
              }),
            });
            const aiData = await aiRes.json();
            shortDescription = aiData.choices?.[0]?.message?.content || "";
            console.log(`AI description generated for: ${title}`);
          } catch (e) {
            console.error("OpenAI Fehler:", e);
          }
        }

        // -- E. SPEICHERN (UPSERT) --
        const eventData: Record<string, any> = {
          external_id: tmId,
          title: title,
          short_description: shortDescription || description || null,
          location: venueBasic?.name || null,
          venue_name: venueBasic?.name || null,
          address_street: addressData.street || null,
          address_city: addressData.city || null,
          address_zip: addressData.zip || null,
          address_country: addressData.country || null,
          image_url: event.images?.[0]?.url || null,
          start_date: event.dates?.start?.dateTime || null,
          ticket_link: event.url || null,
        };

        // Only add category IDs if we have them
        if (mainCatId) eventData.category_main_id = mainCatId;
        if (subCatId) eventData.category_sub_id = subCatId;

        const { data: savedEvent, error: upsertError } = await supabase
          .from("events")
          .upsert(eventData, { onConflict: 'external_id' })
          .select()
          .single();

        if (upsertError) {
          console.error("Fehler beim Speichern:", upsertError);
          errors.push(`${title}: ${upsertError.message}`);
          errorCount++;
          continue;
        }

        // -- F. TAG VERKNÜPFEN --
        if (isRomantic && romanticTagId && savedEvent) {
          const { error: tagError } = await supabase.from("event_tags").upsert({
            event_id: savedEvent.id,
            tag_id: romanticTagId
          }, { onConflict: 'event_id,tag_id' });
          
          if (tagError) {
            console.log("Tag linking error (might be missing table):", tagError.message);
          }
        }

        processedCount++;
        console.log(`Processed: ${title}`);
        
      } catch (eventError) {
        console.error("Error processing event:", eventError);
        errorCount++;
      }
    }

    const result = {
      message: `Import fertig. ${processedCount} Events verarbeitet.`,
      processed: processedCount,
      errors: errorCount,
      errorDetails: errors.slice(0, 10), // Only first 10 errors
      total_found: events.length
    };

    console.log("Import completed:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Import error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), { 
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
