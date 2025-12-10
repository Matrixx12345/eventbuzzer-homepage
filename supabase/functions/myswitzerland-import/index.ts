import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// discover.swiss API (Switzerland Tourism)
const API_BASE_URL = "https://api.discover.swiss/info/v2";

// Hilfsfunktion: HTML-Tags entfernen
const stripHtml = (html: string) => {
  return html ? html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() : '';
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starte MySwitzerland/discover.swiss Import...");

    const SUPABASE_URL = Deno.env.get("Supabase_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("Supabase_SERVICE_ROLE_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const MY_SWITZERLAND_KEY = Deno.env.get("MYSWITZERLAND_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }
    if (!MY_SWITZERLAND_KEY) {
      throw new Error("MYSWITZERLAND_KEY not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Taxonomy & Tags laden (wie bei tm-import)
    const { data: taxonomy } = await supabase.from("taxonomy").select("id, name");
    const { data: tags } = await supabase.from("tags").select("id, slug");
    if (!taxonomy || !tags) throw new Error("DB Fehler: Taxonomy/Tags nicht geladen");

    const findCatId = (name: string) => taxonomy.find(t => t.name === name)?.id;
    const findTagId = (search: string) => tags.find(t => t.slug.includes(search))?.id;

    const tagIds = {
      romantisch: findTagId("romantisch"),
      familie: findTagId("familie"),
      outdoor: findTagId("open-air"),
      indoor: findTagId("indoor"),
      budget: findTagId("budget")
    };

    console.log("Tag IDs found:", tagIds);

    // 2. Events von discover.swiss API holen
    // Versuche zuerst OpenData Projekt für Events
    const apiUrl = `${API_BASE_URL}/events?project=opendata&top=50`;
    console.log("Fetching from:", apiUrl);

    const res = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Accept-Language": "de",
        // discover.swiss nutzt diesen Header
        "Ocp-Apim-Subscription-Key": MY_SWITZERLAND_KEY,
        // Falls der Key auch x-api-key braucht
        "x-api-key": MY_SWITZERLAND_KEY
      }
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("API Response:", res.status, text);
      throw new Error(`discover.swiss API Fehler: ${res.status} - ${text}`);
    }

    const data = await res.json();
    console.log("API Response structure:", JSON.stringify(data).substring(0, 500));
    
    // discover.swiss gibt data Array zurück
    const items = data.data || data.entries || data.events || [];
    console.log(`${items.length} Events von discover.swiss gefunden.`);

    let processedCount = 0;

    for (const item of items) {
      // discover.swiss Event Struktur
      const title = item.name?.de || item.name?.en || item.name || "Unbekanntes Event";
      const externalId = `ds_${item.identifier || item.id}`;
      
      // Beschreibung extrahieren und säubern
      const rawDescription = item.description?.de || item.description?.en || item.description || "";
      const cleanDescription = stripHtml(rawDescription);
      
      // Bild URL extrahieren
      let imageUrl: string | null = null;
      if (item.image?.url) {
        imageUrl = item.image.url;
      } else if (item.images && item.images.length > 0) {
        imageUrl = item.images[0].url || item.images[0].contentUrl;
      } else if (item.photo?.url) {
        imageUrl = item.photo.url;
      }

      // Adressdaten extrahieren (schema.org Format)
      const location = item.location || {};
      const address = location.address || item.address || {};
      const city = address.addressLocality || address.city || location.name || "";
      const street = address.streetAddress || address.street || "";
      const zip = address.postalCode || "";
      const country = address.addressCountry || "CH";

      // Koordinaten extrahieren
      const geo = location.geo || item.geo || {};
      const lat = geo.latitude ? parseFloat(geo.latitude) : null;
      const lng = geo.longitude ? parseFloat(geo.longitude) : null;

      // Datum extrahieren
      const startDate = item.startDate || item.eventSchedule?.[0]?.startDate || new Date().toISOString();
      const endDate = item.endDate || item.eventSchedule?.[0]?.endDate || null;

      // Kategorie-Zuordnung basierend auf Event-Typ
      let mainCatId = findCatId("Freizeit & Aktivitäten");
      let subCatId = null;

      const itemType = (item.additionalType || item["@type"] || "").toLowerCase();
      const categories = item.category || [];
      const categoryText = Array.isArray(categories) ? categories.map((c: any) => c.name?.de || c.name || c).join(" ") : "";
      
      if (itemType.includes("music") || categoryText.includes("Konzert") || categoryText.includes("Musik")) {
        mainCatId = findCatId("Musik & Party");
      } else if (itemType.includes("theater") || itemType.includes("theatre") || categoryText.includes("Theater")) {
        mainCatId = findCatId("Kunst & Kultur");
        subCatId = findCatId("Theater, Musical & Show");
      } else if (itemType.includes("exhibition") || categoryText.includes("Ausstellung") || categoryText.includes("Museum")) {
        mainCatId = findCatId("Kunst & Kultur");
        subCatId = findCatId("Museum, Kunst & Ausstellung");
      } else if (itemType.includes("festival") || categoryText.includes("Festival")) {
        mainCatId = findCatId("Musik & Party");
      } else if (categoryText.includes("Sport")) {
        mainCatId = findCatId("Freizeit & Aktivitäten");
      }

      // Tags zuweisen basierend auf Inhalt
      const tagsToAssign: (number | undefined)[] = [];
      const textForCheck = (title + " " + cleanDescription + " " + categoryText).toLowerCase();

      // Outdoor/Indoor Detection
      if (textForCheck.includes("outdoor") || textForCheck.includes("open air") || textForCheck.includes("openair") || textForCheck.includes("draussen") || textForCheck.includes("festival")) {
        if (tagIds.outdoor) tagsToAssign.push(tagIds.outdoor);
      } else {
        if (tagIds.indoor) tagsToAssign.push(tagIds.indoor);
      }

      // Familien-Detection
      if (textForCheck.includes("familie") || textForCheck.includes("kinder") || textForCheck.includes("family") || textForCheck.includes("kids")) {
        if (tagIds.familie) tagsToAssign.push(tagIds.familie);
      }

      // Romantik-Detection
      if (textForCheck.includes("romantisch") || textForCheck.includes("romantic") || textForCheck.includes("dinner") || textForCheck.includes("jazz") || textForCheck.includes("klassik")) {
        if (tagIds.romantisch) tagsToAssign.push(tagIds.romantisch);
      }

      // Preis extrahieren
      let priceFrom: number | null = null;
      let priceLabel: string | null = null;
      
      if (item.offers) {
        const offers = Array.isArray(item.offers) ? item.offers : [item.offers];
        const minPrice = Math.min(...offers.map((o: any) => o.price || o.lowPrice || 999999).filter((p: number) => p > 0 && p < 999999));
        if (minPrice < 999999) {
          priceFrom = minPrice;
          priceLabel = `ab CHF ${Math.round(minPrice)}.-`;
        }
      }

      // Gratis-Events erkennen
      if (item.isAccessibleForFree || textForCheck.includes("gratis") || textForCheck.includes("kostenlos") || textForCheck.includes("freier eintritt")) {
        priceFrom = 0;
        priceLabel = "Eintritt frei";
        if (tagIds.budget) tagsToAssign.push(tagIds.budget);
      }

      // KI-Beschreibung generieren falls nötig
      let shortDescription = cleanDescription ? cleanDescription.substring(0, 200) : "";
      let longDescription = cleanDescription;

      if (OPENAI_API_KEY && (!cleanDescription || cleanDescription.length < 50)) {
        try {
          const promptInstruction = `Schreibe eine einladende Event-Beschreibung auf Deutsch für: "${title}" in ${city || "der Schweiz"}. 
          
Erstelle eine kurze Version (max 2 Sätze) für die Karten-Vorschau.
Stil: Einladend, informativ, Quiet Luxury. Keine Emojis.`;

          const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_API_KEY}` },
            body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: promptInstruction }], max_tokens: 150 }),
          });
          const aiData = await aiRes.json();
          shortDescription = aiData.choices?.[0]?.message?.content || shortDescription;
        } catch (e) {
          console.error("AI Fehler für", title, e);
        }
      }

      // Ticket-Link
      const ticketLink = item.url || item.sameAs || (item.offers && item.offers[0]?.url) || null;

      // Event speichern (gleiches Schema wie tm-import)
      const { data: savedEvent, error } = await supabase
        .from("events")
        .upsert({
          external_id: externalId,
          title: title,
          description: longDescription,
          short_description: shortDescription,
          location: city || "Schweiz",
          venue_name: location.name || title,
          address_street: street,
          address_city: city,
          address_zip: zip,
          address_country: country,
          latitude: lat,
          longitude: lng,
          image_url: imageUrl,
          start_date: startDate,
          end_date: endDate,
          ticket_link: ticketLink,
          category_main_id: mainCatId,
          category_sub_id: subCatId,
          price_from: priceFrom,
          price_label: priceLabel
        }, { onConflict: 'external_id' })
        .select()
        .maybeSingle();

      if (error) {
        console.error(`Fehler beim Speichern von ${title}:`, error);
        continue;
      }

      // Tags zuweisen
      if (savedEvent && tagsToAssign.length > 0) {
        for (const tId of tagsToAssign) {
          if (tId) {
            await supabase.from("event_tags").upsert(
              { event_id: savedEvent.id, tag_id: tId }, 
              { onConflict: 'event_id,tag_id' }
            );
          }
        }
      }

      processedCount++;
      console.log(`Importiert: ${title} (${city})`);
    }

    const result = {
      success: true,
      message: `MySwitzerland/discover.swiss Import fertig.`,
      imported: processedCount,
      total_found: items.length
    };

    console.log("Import complete:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Import error:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
