import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// KONFIGURATION
const TM_API_URL = "https://app.ticketmaster.com/discovery/v2/events.json";

// GENRE MAPPING (Ticketmaster -> Deine Subkategorien)
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
  "Family": "Show & Entertainment",
  "Miscellaneous": "Freizeit & Aktivitäten"
};

// KEYWORDS FÜR BASIS-TAGS
const TAG_KEYWORDS = {
  "romantisch": ["romantisch", "romantic", "date", "liebe", "love", "candlelight", "kerzenlicht", "piano", "ballett", "valentinstag", "champagner", "sunset", "jazz", "soul"],
  "familie": ["familie", "family", "kinder", "kids", "disney", "zirkus", "circus", "magic", "zauberer", "harry potter", "jurassic", "ice age", "figurentheater", "peppa", "paw patrol"],
  "outdoor": ["open air", "openair", "festival", "streetfood", "markt", "market", "park", "see", "bühne am", "draussen", "sommer"],
  "indoor": ["halle", "hall", "theater", "theatre", "club", "oper", "opera", "museum", "kulturhaus", "casino", "arena"],
  "budget_text": ["gratis", "kostenlos", "freier eintritt", "free entry", "kollekte", "pay what you want"]
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starte Import V4 (AI Age Rating & Budget Fix)...");

    // Use EXTERNAL Supabase credentials (user's own Supabase, not Lovable Cloud)
    const EXTERNAL_SUPABASE_URL = Deno.env.get("Supabase_URL");
    const EXTERNAL_SERVICE_ROLE_KEY = Deno.env.get("Supabase_SERVICE_ROLE_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const TM_API_KEY = Deno.env.get("TICKETMASTER_API_KEY");

    console.log("External Supabase URL configured:", !!EXTERNAL_SUPABASE_URL);
    console.log("External Service Role Key configured:", !!EXTERNAL_SERVICE_ROLE_KEY);

    if (!EXTERNAL_SUPABASE_URL || !EXTERNAL_SERVICE_ROLE_KEY) {
      throw new Error("External Supabase credentials not configured (Supabase_URL, Supabase_SERVICE_ROLE_KEY)");
    }
    if (!TM_API_KEY) {
      throw new Error("TICKETMASTER_API_KEY not configured");
    }

    const supabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SERVICE_ROLE_KEY);

    // 1. IDs aus der Datenbank laden (Dynamisch!)
    const { data: taxonomy, error: taxError } = await supabase.from("taxonomy").select("id, name");
    const { data: tags, error: tagsError } = await supabase.from("tags").select("id, slug");

    if (taxError || tagsError) {
      console.error("DB Error:", taxError, tagsError);
      throw new Error("Konnte DB-Struktur nicht laden.");
    }

    console.log("Taxonomy loaded:", taxonomy?.length, "categories");
    console.log("Tags loaded:", tags?.length, "tags");

    const findCatId = (name: string) => taxonomy?.find(t => t.name === name)?.id;
    // Slug-Suche (Teilwort reicht)
    const findTagId = (search: string) => tags?.find(t => t.slug.includes(search))?.id;

    // Wir speichern uns die wichtigen Tag-IDs
    const tagIds = {
      romantisch: findTagId("romantisch"),
      familie: findTagId("familie"), // Der Haupt-Tag
      outdoor: findTagId("open-air"),
      indoor: findTagId("indoor"),
      budget: findTagId("budget"),
      // Die neuen Alters-Tags (suche nach eindeutigen Slugs)
      baby: findTagId("kleinkinder"),
      kids: findTagId("schulkinder"),
      teen: findTagId("teenager")
    };

    console.log("Tag IDs found:", tagIds);

    // 2. Events von Ticketmaster holen
    const tmUrl = `${TM_API_URL}?apikey=${TM_API_KEY}&countryCode=CH&size=50&sort=date,asc`;
    console.log("Fetching from Ticketmaster...");
    const tmRes = await fetch(tmUrl);
    const tmData = await tmRes.json();
    const events = tmData._embedded?.events || [];
    
    console.log(`Found ${events.length} events from Ticketmaster`);
    
    let processedCount = 0;
    const errors: string[] = [];

    for (const event of events) {
      try {
        const title = event.name;
        const tmId = event.id;
        const venueBasic = event._embedded?.venues?.[0];
        const venueId = venueBasic?.id;
        const segmentName = event.classifications?.[0]?.segment?.name;
        const genreName = event.classifications?.[0]?.genre?.name;
        
        // -- A. ADRESSE & GEO-DATEN NACHLADEN --
        let addressData = { street: "", city: "", zip: "", country: "", lat: null as number | null, lng: null as number | null };
        if (venueId) {
          try {
            const venueRes = await fetch(`https://app.ticketmaster.com/discovery/v2/venues/${venueId}.json?apikey=${TM_API_KEY}`);
            if (venueRes.ok) {
              const vData = await venueRes.json();
              addressData = {
                street: vData.address?.line1 ?? "",
                city: vData.city?.name ?? "",
                zip: vData.postalCode ?? "",
                country: vData.country?.countryCode ?? "CH",
                lat: vData.location?.latitude ? parseFloat(vData.location.latitude) : null,
                lng: vData.location?.longitude ? parseFloat(vData.location.longitude) : null
              };
              console.log(`Venue ${venueId}: lat=${addressData.lat}, lng=${addressData.lng}`);
            }
          } catch(e) {
            console.log(`Venue fetch failed for ${venueId}:`, e);
          }
        }

        // -- B. KATEGORIEN --
        let mainCatId = null;
        let subCatId = null;

        if (segmentName === "Music") mainCatId = findCatId("Musik & Party");
        else if (segmentName === "Arts & Theatre") mainCatId = findCatId("Kunst & Kultur");
        else if (segmentName === "Sports") mainCatId = findCatId("Freizeit & Aktivitäten");
        else if (segmentName === "Family") mainCatId = findCatId("Freizeit & Aktivitäten");
        else mainCatId = findCatId("Freizeit & Aktivitäten"); 

        if (genreName && SUB_CATEGORY_MAPPING[genreName]) {
          subCatId = findCatId(SUB_CATEGORY_MAPPING[genreName]);
        }

        // -- C. PREIS & BUDGET-LOGIK --
        // Wir versuchen den Preis zu finden. Wenn keiner da ist, bleibt er null.
        let minPrice = event.priceRanges?.[0]?.min;
        
        const tagsToAssign: string[] = [];
        const textForCheck = (title + " " + (genreName || "")).toLowerCase();

        // Budget-Tag Logik: Entweder Preis < 25 ODER Schlüsselwörter im Text
        const isFreeByText = TAG_KEYWORDS.budget_text.some(k => textForCheck.includes(k));
        if (tagIds.budget && ((minPrice !== undefined && minPrice < 25) || isFreeByText)) {
          tagsToAssign.push(tagIds.budget);
        }

        // -- D. VIBES (Basis) --
        let isFamily = false;
        if (tagIds.romantisch && TAG_KEYWORDS.romantisch.some(k => textForCheck.includes(k))) {
          tagsToAssign.push(tagIds.romantisch);
        }
        if (TAG_KEYWORDS.familie.some(k => textForCheck.includes(k)) || segmentName === "Family") {
          if (tagIds.familie) {
            tagsToAssign.push(tagIds.familie);
            isFamily = true; // Merker für die KI
          }
        }
        if (tagIds.outdoor && TAG_KEYWORDS.outdoor.some(k => textForCheck.includes(k))) {
          tagsToAssign.push(tagIds.outdoor);
        } else if (tagIds.indoor) {
          tagsToAssign.push(tagIds.indoor); // Fallback: Meistens Indoor wenn nicht explizit Outdoor
        }

        // -- E. KI-TEXT & ALTERS-CHECK --
        let description = event.description || "";
        let shortDescription = "";
        
        // Wir fragen die KI, wenn: 1. Keine Beschreibung da ist ODER 2. Es ein Familien-Event ist (fürs Alter)
        if (OPENAI_API_KEY && (!description || description.length < 50 || isFamily)) {
          try {
            // Prompt wird dynamisch: Wenn Familie, frag nach Alter. Sonst nur Beschreibung.
            let promptInstruction = `Schreibe eine kurze, einladende Event-Beschreibung (max 2 Sätze) auf Deutsch für: "${title}". Stil: Quiet Luxury.`;
            
            if (isFamily) {
              promptInstruction += `\nZUSATZAUFGABE: Das ist ein Familien-Event. Schätze das ideale Alter.
              Antworte AM ENDE deiner Nachricht mit genau einem dieser Codes, wenn du sicher bist:
              [BABY] für 0-4 Jahre, [KIDS] für 5-10 Jahre, [TEEN] für 11+ Jahre.`;
            }

            const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: { 
                "Content-Type": "application/json", 
                "Authorization": `Bearer ${OPENAI_API_KEY}` 
              },
              body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: promptInstruction }],
                max_tokens: 150,
              }),
            });
            const aiData = await aiRes.json();
            const rawAiText = aiData.choices?.[0]?.message?.content || "";

            // Altersextraktion & Textbereinigung
            shortDescription = rawAiText;
            if (isFamily) {
              if (rawAiText.includes("[BABY]") && tagIds.baby) tagsToAssign.push(tagIds.baby);
              if (rawAiText.includes("[KIDS]") && tagIds.kids) tagsToAssign.push(tagIds.kids);
              if (rawAiText.includes("[TEEN]") && tagIds.teen) tagsToAssign.push(tagIds.teen);
              // Entferne den Code aus dem Text für den User
              shortDescription = rawAiText.replace(/\[BABY\]|\[KIDS\]|\[TEEN\]/g, "").trim();
            }

          } catch (e) { 
            console.error("AI Fehler für Event", title, e); 
          }
        }

        // -- F. SPEICHERN --
        const { data: savedEvent, error: saveError } = await supabase
          .from("events")
          .upsert({
            external_id: tmId,
            title: title,
            short_description: shortDescription || description,
            location: venueBasic?.name,
            venue_name: venueBasic?.name,
            address_street: addressData.street,
            address_city: addressData.city,
            address_zip: addressData.zip,
            address_country: addressData.country,
            latitude: addressData.lat,
            longitude: addressData.lng,
            image_url: event.images?.[0]?.url,
            start_date: event.dates?.start?.dateTime,
            ticket_link: event.url,
            category_main_id: mainCatId,
            category_sub_id: subCatId,
            price_from: minPrice
          }, { onConflict: 'external_id' })
          .select()
          .single();

        if (saveError) {
          console.error(`Error saving event ${title}:`, saveError);
          errors.push(`${title}: ${saveError.message}`);
          continue;
        }

        // -- G. TAGS VERKNÜPFEN --
        if (savedEvent && tagsToAssign.length > 0) {
          for (const tId of tagsToAssign) {
            const { error: tagError } = await supabase
              .from("event_tags")
              .upsert({ event_id: savedEvent.id, tag_id: tId }, { onConflict: 'event_id,tag_id' });
            
            if (tagError) {
              console.log(`Tag link error for event ${savedEvent.id}, tag ${tId}:`, tagError);
            }
          }
        }
        
        processedCount++;
        console.log(`Processed: ${title} (price: ${minPrice}, tags: ${tagsToAssign.length})`);
        
      } catch (eventError) {
        console.error("Error processing event:", eventError);
        errors.push(`Event error: ${eventError}`);
      }
    }

    const result = { 
      message: `V4 Import fertig. ${processedCount} Events verarbeitet.`,
      processed: processedCount,
      total: events.length,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log("Import complete:", result);

    return new Response(JSON.stringify(result), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (error: unknown) { 
    console.error("Import error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }); 
  }
});
