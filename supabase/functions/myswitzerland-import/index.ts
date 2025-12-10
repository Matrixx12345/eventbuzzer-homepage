import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ST_API_URL = "https://open-api.myswitzerland.com/v1/attractions";

// Hilfsfunktion: HTML-Tags entfernen
const stripHtml = (html: string) => {
  return html ? html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() : '';
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starte MySwitzerland Import...");

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

    // 2. Daten von MySwitzerland API holen
    const res = await fetch(`${ST_API_URL}?limit=50`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "x-api-key": MY_SWITZERLAND_KEY
      }
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`MySwitzerland API Fehler: ${res.status} ${text}`);
    }

    const data = await res.json();
    const items = data.entries || data.data || [];
    console.log(`${items.length} Einträge von MySwitzerland gefunden.`);

    let processedCount = 0;

    for (const item of items) {
      const title = item.name?.de || item.name?.en || item.title?.de || item.title?.en || "Unbekannte Attraktion";
      const externalId = `st_${item.id}`;
      
      // Beschreibung extrahieren und säubern
      const rawDescription = item.description?.de || item.description?.en || item.abstract?.de || item.abstract?.en || "";
      const cleanDescription = stripHtml(rawDescription);
      
      // Bild URL extrahieren
      let imageUrl: string | null = null;
      if (item.gallery && item.gallery.length > 0) {
        imageUrl = item.gallery[0].url || item.gallery[0].src;
      } else if (item.images && item.images.length > 0) {
        imageUrl = item.images[0].url || item.images[0].src;
      } else if (item.image) {
        imageUrl = item.image.url || item.image;
      }

      // Adressdaten extrahieren
      const address = item.address || item.location || {};
      const city = address.addressLocality || address.city || address.locality || "";
      const street = address.streetAddress || address.street || "";
      const zip = address.postalCode || address.zipCode || "";
      const country = address.addressCountry || "CH";

      // Koordinaten extrahieren
      const geo = item.geo || item.coordinates || address.geo || {};
      const lat = geo.latitude ? parseFloat(geo.latitude) : null;
      const lng = geo.longitude ? parseFloat(geo.longitude) : null;

      // Kategorie-Zuordnung (Attraktionen → Freizeit & Aktivitäten)
      let mainCatId = findCatId("Freizeit & Aktivitäten");
      let subCatId = null;

      // Je nach Typ andere Kategorie zuweisen
      const itemType = (item.type || item.category || "").toLowerCase();
      if (itemType.includes("museum") || itemType.includes("kunst") || itemType.includes("art")) {
        mainCatId = findCatId("Kunst & Kultur");
        subCatId = findCatId("Museum, Kunst & Ausstellung");
      } else if (itemType.includes("konzert") || itemType.includes("music") || itemType.includes("festival")) {
        mainCatId = findCatId("Musik & Party");
      } else if (itemType.includes("theater") || itemType.includes("theatre")) {
        mainCatId = findCatId("Kunst & Kultur");
        subCatId = findCatId("Theater, Musical & Show");
      }

      // Tags zuweisen basierend auf Inhalt
      const tagsToAssign: (number | undefined)[] = [];
      const textForCheck = (title + " " + cleanDescription).toLowerCase();

      // Outdoor/Indoor Detection
      if (textForCheck.includes("outdoor") || textForCheck.includes("open air") || textForCheck.includes("wandern") || textForCheck.includes("berg") || textForCheck.includes("see")) {
        if (tagIds.outdoor) tagsToAssign.push(tagIds.outdoor);
      } else {
        if (tagIds.indoor) tagsToAssign.push(tagIds.indoor);
      }

      // Familien-Detection
      if (textForCheck.includes("familie") || textForCheck.includes("kinder") || textForCheck.includes("family") || textForCheck.includes("kids")) {
        if (tagIds.familie) tagsToAssign.push(tagIds.familie);
      }

      // Romantik-Detection
      if (textForCheck.includes("romantisch") || textForCheck.includes("romantic") || textForCheck.includes("dinner") || textForCheck.includes("spa") || textForCheck.includes("wellness")) {
        if (tagIds.romantisch) tagsToAssign.push(tagIds.romantisch);
      }

      // KI-Beschreibung generieren falls nötig
      let shortDescription = cleanDescription ? cleanDescription.substring(0, 200) : "";
      let longDescription = cleanDescription;

      if (OPENAI_API_KEY && (!cleanDescription || cleanDescription.length < 50)) {
        try {
          const promptInstruction = `Schreibe eine einladende Beschreibung auf Deutsch für diese Schweizer Attraktion: "${title}" in ${city || "der Schweiz"}. 
          
Erstelle:
1. Eine kurze Version (max 2 Sätze) für Karten-Vorschau
2. Eine längere Version (3-5 Sätze) für die Detailseite

Stil: Einladend, informativ, Quiet Luxury. Keine Emojis.

Format:
[KURZ] Kurze Beschreibung hier
[LANG] Längere Beschreibung hier`;

          const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_API_KEY}` },
            body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: promptInstruction }], max_tokens: 300 }),
          });
          const aiData = await aiRes.json();
          const rawAiText = aiData.choices?.[0]?.message?.content || "";

          // Kurz und Lang extrahieren
          const kurzMatch = rawAiText.match(/\[KURZ\]\s*(.+?)(?=\[LANG\]|$)/s);
          const langMatch = rawAiText.match(/\[LANG\]\s*(.+?)$/s);

          if (kurzMatch) shortDescription = kurzMatch[1].trim();
          if (langMatch) longDescription = langMatch[1].trim();

        } catch (e) {
          console.error("AI Fehler für", title, e);
        }
      }

      // Ticket-Link (falls vorhanden)
      const ticketLink = item.url || item.website || item.ticketUrl || null;

      // Event speichern (gleiches Schema wie tm-import)
      const { data: savedEvent, error } = await supabase
        .from("events")
        .upsert({
          external_id: externalId,
          title: title,
          description: longDescription,
          short_description: shortDescription,
          location: city || "Schweiz",
          venue_name: title,
          address_street: street,
          address_city: city,
          address_zip: zip,
          address_country: country,
          latitude: lat,
          longitude: lng,
          image_url: imageUrl,
          start_date: new Date().toISOString(), // Attraktionen haben kein fixes Datum
          ticket_link: ticketLink,
          category_main_id: mainCatId,
          category_sub_id: subCatId,
          price_from: 0, // Attraktionen oft kostenlos/variabel
          price_label: null
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
      message: `MySwitzerland Import fertig.`,
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
