import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TM_API_URL = "https://app.ticketmaster.com/discovery/v2/events.json";

// MAPPINGS & KEYWORDS
const SUB_CATEGORY_MAPPING: Record<string, string> = {
  "Rock": "Rock & Pop Konzerte", "Pop": "Rock & Pop Konzerte", "Alternative": "Rock & Pop Konzerte", "Metal": "Rock & Pop Konzerte",
  "Jazz": "Jazz, Blues & Soul", "Blues": "Jazz, Blues & Soul", "Soul": "Jazz, Blues & Soul",
  "R&B": "Hip-Hop, RnB & Electronic", "Hip-Hop/Rap": "Hip-Hop, RnB & Electronic", "Dance/Electronic": "Hip-Hop, RnB & Electronic",
  "Classical": "Klassik, Oper & Ballett", "Opera": "Klassik, Oper & Ballett",
  "Theatre": "Theater, Musical & Show", "Musical": "Theater, Musical & Show", "Comedy": "Comedy & Kabarett",
  "Fine Art": "Museum, Kunst & Ausstellung", "Spectacular": "Show & Entertainment", "Family": "Show & Entertainment",
  "Miscellaneous": "Freizeit & Aktivitäten"
};

const TAG_KEYWORDS = {
  "romantisch": ["romantisch", "romantic", "date", "liebe", "love", "candlelight", "kerzenlicht", "piano", "ballett", "valentinstag", "champagner", "sunset", "jazz", "soul"],
  "familie": ["familie", "family", "kinder", "kids", "disney", "zirkus", "circus", "magic", "zauberer", "harry potter", "jurassic", "ice age", "figurentheater", "peppa", "paw patrol"],
  "outdoor": ["open air", "openair", "festival", "streetfood", "markt", "market", "park", "see", "bühne am", "draussen", "sommer"],
  "indoor": ["halle", "hall", "theater", "theatre", "club", "oper", "opera", "museum", "kulturhaus", "casino", "arena"],
  "budget_text": ["gratis", "kostenlos", "freier eintritt", "free entry", "kollekte", "pay what you want"]
};

// Hilfsfunktion: Preis aus Text extrahieren (Regex Sniper)
function extractPriceFromText(text: string): number | null {
    if (!text) return null;
    // Sucht nach "CHF 20", "CHF 20.-", "20 CHF", "ab 20.-", "ab CHF 89", "from CHF 50"
    const patterns = [
      /(?:ab|from|ab\s+CHF|CHF|Fr\.)\s?(\d+)(?:[\.,-]|00)?/i,
      /(\d+)\s*(?:CHF|Fr\.)/i,
      /prices?\s+(?:ab|from)?\s*(\d+)/i
    ];
    
    for (const regex of patterns) {
      const match = text.match(regex);
      if (match) return parseInt(match[1]);
    }
    return null;
}

// NEU: Meta-Description von der Ticket-Seite holen
async function fetchPriceFromTicketPage(ticketUrl: string): Promise<number | null> {
  if (!ticketUrl) return null;
  
  try {
    // Nur den HEAD/Anfang der Seite holen (schneller)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 Sek Timeout
    
    const response = await fetch(ticketUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EventBuzzer/1.0)'
      }
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) return null;
    
    // Nur die ersten 10KB lesen (Meta-Tags sind am Anfang)
    const reader = response.body?.getReader();
    if (!reader) return null;
    
    let html = '';
    const decoder = new TextDecoder();
    
    while (html.length < 10000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      
      // Wenn wir </head> gefunden haben, reicht das
      if (html.includes('</head>')) break;
    }
    reader.cancel();
    
    // Meta-Description extrahieren
    const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
    
    if (metaMatch) {
      const description = metaMatch[1];
      const price = extractPriceFromText(description);
      if (price) {
        console.log(`Found price in meta-description: ${price} CHF`);
        return price;
      }
    }
    
    // Auch og:description versuchen
    const ogMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    if (ogMatch) {
      const price = extractPriceFromText(ogMatch[1]);
      if (price) {
        console.log(`Found price in og:description: ${price} CHF`);
        return price;
      }
    }
    
    return null;
  } catch (e) {
    console.log(`Meta-scrape failed for ${ticketUrl}:`, e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starte Import V7 (Price Intelligence + Meta-Scrape)...");

    const SUPABASE_URL = Deno.env.get("Supabase_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("Supabase_SERVICE_ROLE_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const TM_API_KEY = Deno.env.get("TICKETMASTER_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("External Supabase credentials not configured");
    }
    if (!TM_API_KEY) {
      throw new Error("TICKETMASTER_API_KEY not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. IDs laden
    const { data: taxonomy } = await supabase.from("taxonomy").select("id, name");
    const { data: tags } = await supabase.from("tags").select("id, slug");
    if (!taxonomy || !tags) throw new Error("DB Fehler");

    const findCatId = (name: string) => taxonomy.find(t => t.name === name)?.id;
    const findTagId = (search: string) => tags.find(t => t.slug.includes(search))?.id;

    const tagIds = {
      romantisch: findTagId("romantisch"), familie: findTagId("familie"),
      outdoor: findTagId("open-air"), indoor: findTagId("indoor"), budget: findTagId("budget"),
      baby: findTagId("kleinkinder"), kids: findTagId("schulkinder"), teen: findTagId("teenager")
    };

    console.log("Tag IDs found:", tagIds);

    // 2. Events holen
    const tmUrl = `${TM_API_URL}?apikey=${TM_API_KEY}&countryCode=CH&size=50&sort=date,asc`;
    const tmRes = await fetch(tmUrl);
    const tmData = await tmRes.json();
    const events = tmData._embedded?.events || [];
    
    console.log(`Found ${events.length} events from Ticketmaster`);
    
    let processedCount = 0;
    let pricesFoundFromMeta = 0;

    for (const event of events) {
      const title = event.name;
      const tmId = event.id;
      const venueBasic = event._embedded?.venues?.[0];
      const venueId = venueBasic?.id;
      const lat = venueBasic?.location?.latitude ? parseFloat(venueBasic.location.latitude) : null;
      const lng = venueBasic?.location?.longitude ? parseFloat(venueBasic.location.longitude) : null;
      const segmentName = event.classifications?.[0]?.segment?.name;
      const genreName = event.classifications?.[0]?.genre?.name;
      const ticketLink = event.url;
      
      // -- A. ADRESSE NACHLADEN --
      let addressData = { street: "", city: "", zip: "", country: "" };
      if (venueId) {
        try {
            const venueRes = await fetch(`https://app.ticketmaster.com/discovery/v2/venues/${venueId}.json?apikey=${TM_API_KEY}`);
            if (venueRes.ok) {
                const vData = await venueRes.json();
                addressData = { street: vData.address?.line1 ?? "", city: vData.city?.name ?? "", zip: vData.postalCode ?? "", country: vData.country?.countryCode ?? "CH" };
            }
        } catch(e) {
          console.log(`Venue fetch failed for ${venueId}:`, e);
        }
      }

      // -- B. KATEGORIEN --
      let mainCatId = null; let subCatId = null;
      if (segmentName === "Music") mainCatId = findCatId("Musik & Party");
      else if (segmentName === "Arts & Theatre") mainCatId = findCatId("Kunst & Kultur");
      else if (segmentName === "Sports") mainCatId = findCatId("Freizeit & Aktivitäten");
      else if (segmentName === "Family") mainCatId = findCatId("Freizeit & Aktivitäten");
      else mainCatId = findCatId("Freizeit & Aktivitäten"); 
      if (genreName && SUB_CATEGORY_MAPPING[genreName]) subCatId = findCatId(SUB_CATEGORY_MAPPING[genreName]);

      // -- C. PREIS-LOGIK (4-stufig) --
      let minPrice: number | undefined = event.priceRanges?.[0]?.min;
      let priceLabel: string | null = null;
      let priceSource = "";
      
      // 1. Versuch: Preis aus Ticketmaster API
      if (minPrice !== undefined && minPrice !== null) {
          priceLabel = `ab CHF ${Math.round(minPrice)}.-`;
          priceSource = "API";
      } 
      // 2. Versuch: Preis aus Titel/Text "snipen"
      else {
          const extracted = extractPriceFromText(title);
          if (extracted) {
              minPrice = extracted;
              priceLabel = `ca. CHF ${extracted}.-`;
              priceSource = "title";
          }
      }
      
      // 3. NEU: Preis aus Meta-Description der Ticket-Seite
      if (!minPrice && ticketLink) {
          const metaPrice = await fetchPriceFromTicketPage(ticketLink);
          if (metaPrice) {
              minPrice = metaPrice;
              priceLabel = `ab CHF ${metaPrice}.-`;
              priceSource = "meta";
              pricesFoundFromMeta++;
          }
      }

      const tagsToAssign: (number | undefined)[] = [];
      const textForCheck = (title + " " + (genreName || "")).toLowerCase();
      let isFamily = false;

      // Tagging Logic
      const isFreeByText = TAG_KEYWORDS.budget_text.some(k => textForCheck.includes(k));
      if (tagIds.budget && ((minPrice !== undefined && minPrice < 25) || isFreeByText)) {
          tagsToAssign.push(tagIds.budget);
          if (isFreeByText) { minPrice = 0; priceLabel = "Eintritt frei"; }
      }
      if (tagIds.romantisch && TAG_KEYWORDS.romantisch.some(k => textForCheck.includes(k))) tagsToAssign.push(tagIds.romantisch);
      if (TAG_KEYWORDS.familie.some(k => textForCheck.includes(k)) || segmentName === "Family") { if (tagIds.familie) { tagsToAssign.push(tagIds.familie); isFamily = true; } }
      if (tagIds.outdoor && TAG_KEYWORDS.outdoor.some(k => textForCheck.includes(k))) tagsToAssign.push(tagIds.outdoor);
      else if (tagIds.indoor) tagsToAssign.push(tagIds.indoor);

      // -- D. KI: TEXT & PREIS-SCHÄTZUNG (nur wenn immer noch kein Preis) --
      let description = event.description || "";
      let shortDescription = "";
      
      if (OPENAI_API_KEY && (!description || description.length < 50 || isFamily || (!minPrice && !priceLabel))) {
          try {
            let promptInstruction = `Schreibe eine kurze, einladende Event-Beschreibung (max 2 Sätze) auf Deutsch für: "${title}" in ${addressData.city}. Genre: ${genreName}. Stil: Quiet Luxury.`;
            
            if (isFamily) promptInstruction += `\nZUSATZ: Familien-Event. Schätze Alter: [BABY], [KIDS] oder [TEEN].`;
            
            // Die Preis-Frage an die KI (nur wenn weder API, noch Title, noch Meta einen Preis hatten)
            if (!minPrice && !priceLabel) {
                promptInstruction += `\nZUSATZ: Schätze den EINSTIEGSPREIS für dieses Event in der Schweiz. Sei KONSERVATIV - die meisten Events kosten 40-80 CHF.
                
WICHTIG für die Schweiz:
- Klassische Konzerte, Kammermusik, Orchester: meist [MID] (50-80 CHF) oder [LOW] (unter 50 CHF)
- Kleine Clubs, lokale Bands, Theater: [LOW] oder [MID]
- Pop/Rock Stars in grossen Hallen: [HIGH] (80-120 CHF)
- Nur internationale Mega-Stars (Taylor Swift, Coldplay, etc.): [LUX]

Antworte NUR mit einem Code am Ende:
[LOW] (unter 40 CHF), [MID] (40-80 CHF), [HIGH] (80-120 CHF), [LUX] (über 120 CHF).`; 
            }

            const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_API_KEY}` },
                body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: promptInstruction }], max_tokens: 150 }),
            });
            const aiData = await aiRes.json();
            const rawAiText = aiData.choices?.[0]?.message?.content || "";
            shortDescription = rawAiText;

            // KI-Antworten verarbeiten
            if (isFamily) {
                if (rawAiText.includes("[BABY]") && tagIds.baby) tagsToAssign.push(tagIds.baby);
                if (rawAiText.includes("[KIDS]") && tagIds.kids) tagsToAssign.push(tagIds.kids);
                if (rawAiText.includes("[TEEN]") && tagIds.teen) tagsToAssign.push(tagIds.teen);
            }
            
            // 4. Preis-Fallback: KI-Schätzung (konservativere Werte für Schweiz)
            if (!minPrice && !priceLabel) {
                if (rawAiText.includes("[LOW]")) { minPrice = 25; priceLabel = "ca. CHF 25.-"; priceSource = "AI"; if (tagIds.budget) tagsToAssign.push(tagIds.budget); }
                else if (rawAiText.includes("[MID]")) { minPrice = 60; priceLabel = "ca. CHF 60.-"; priceSource = "AI"; }
                else if (rawAiText.includes("[HIGH]")) { minPrice = 95; priceLabel = "ca. CHF 95.-"; priceSource = "AI"; }
                else if (rawAiText.includes("[LUX]")) { minPrice = 150; priceLabel = "ab CHF 150.-"; priceSource = "AI"; }
            }

            // Clean Text
            shortDescription = rawAiText.replace(/\[.*?\]/g, "").trim();

          } catch (e) { console.error("AI Fehler", e); }
      }

      // -- E. SPEICHERN --
      const { data: savedEvent, error } = await supabase
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
            latitude: lat,
            longitude: lng,
            image_url: event.images?.[0]?.url,
            start_date: event.dates?.start?.dateTime,
            ticket_link: ticketLink,
            category_main_id: mainCatId,
            category_sub_id: subCatId,
            price_from: minPrice,
            price_label: priceLabel
        }, { onConflict: 'external_id' })
        .select().single();

      if (!error && savedEvent && tagsToAssign.length > 0) {
          for (const tId of tagsToAssign) {
              if (tId) {
                await supabase.from("event_tags").upsert({ event_id: savedEvent.id, tag_id: tId }, { onConflict: 'event_id,tag_id' });
              }
          }
      }
      
      processedCount++;
      console.log(`Processed: ${title} (price: ${minPrice}, source: ${priceSource || "none"}, label: ${priceLabel})`);
    }

    const result = {
      message: `V7 Import fertig. ${processedCount} Events.`,
      pricesFromMeta: pricesFoundFromMeta
    };
    
    console.log("Import complete:", result);

    return new Response(JSON.stringify(result), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (error) { 
    console.error("Import error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    }); 
  }
});
