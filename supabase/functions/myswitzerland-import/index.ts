import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// MySwitzerland OpenData API
const API_BASE_URL = "https://opendata.myswitzerland.io/v1";

// Hilfsfunktion: HTML-Tags entfernen
const stripHtml = (html: string) => {
  return html ? html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() : '';
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starte MySwitzerland OpenData Import...");

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

    // API Request Headers
    const apiHeaders = {
      "Accept": "application/json",
      "Accept-Language": "de",
      "x-api-key": MY_SWITZERLAND_KEY
    };

    let totalProcessed = 0;
    const allItems: any[] = [];

    // 2. Attractions holen (Hauptdatenquelle für Events)
    console.log("Fetching attractions...");
    try {
      const attractionsRes = await fetch(`${API_BASE_URL}/attractions/?pageSize=50`, {
        method: "GET",
        headers: apiHeaders
      });

      if (attractionsRes.ok) {
        const attractionsData = await attractionsRes.json();
        const attractions = attractionsData.data || [];
        console.log(`${attractions.length} Attractions gefunden`);
        allItems.push(...attractions.map((a: any) => ({ ...a, _type: 'attraction' })));
      } else {
        const errorText = await attractionsRes.text();
        console.error("Attractions API error:", attractionsRes.status, errorText);
      }
    } catch (e) {
      console.error("Attractions fetch error:", e);
    }

    // 3. Offers holen (Angebote)
    console.log("Fetching offers...");
    try {
      const offersRes = await fetch(`${API_BASE_URL}/offers/?pageSize=50`, {
        method: "GET",
        headers: apiHeaders
      });

      if (offersRes.ok) {
        const offersData = await offersRes.json();
        const offers = offersData.data || [];
        console.log(`${offers.length} Offers gefunden`);
        allItems.push(...offers.map((o: any) => ({ ...o, _type: 'offer' })));
      } else {
        const errorText = await offersRes.text();
        console.error("Offers API error:", offersRes.status, errorText);
      }
    } catch (e) {
      console.error("Offers fetch error:", e);
    }

    // 4. Tours holen
    console.log("Fetching tours...");
    try {
      const toursRes = await fetch(`${API_BASE_URL}/tours/?pageSize=50`, {
        method: "GET",
        headers: apiHeaders
      });

      if (toursRes.ok) {
        const toursData = await toursRes.json();
        const tours = toursData.data || [];
        console.log(`${tours.length} Tours gefunden`);
        allItems.push(...tours.map((t: any) => ({ ...t, _type: 'tour' })));
      } else {
        const errorText = await toursRes.text();
        console.error("Tours API error:", toursRes.status, errorText);
      }
    } catch (e) {
      console.error("Tours fetch error:", e);
    }

    console.log(`Total: ${allItems.length} Items zum Import`);

    // 5. Items verarbeiten und speichern
    for (const item of allItems) {
      const itemType = item._type;
      const title = item.name || item.title || "Unbekannt";
      const externalId = `mys_${item.id || item.identifier}`;
      
      // Beschreibung extrahieren und säubern
      const rawDescription = item.description || item.abstract || "";
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
      const geo = item.geo || {};
      const address = item.address || {};
      const city = address.addressLocality || item.containedInPlace?.name || "";
      const street = address.streetAddress || "";
      const zip = address.postalCode || "";
      const country = address.addressCountry || "CH";
      const lat = geo.latitude ? parseFloat(geo.latitude) : null;
      const lng = geo.longitude ? parseFloat(geo.longitude) : null;

      // Kategorie-Zuordnung basierend auf Typ
      let mainCatId = findCatId("Freizeit & Aktivitäten");
      let subCatId = null;

      // MySwitzerland Kategorien auswerten
      const categories = item.categories || item.category || [];
      const categoryText = Array.isArray(categories) 
        ? categories.map((c: any) => typeof c === 'string' ? c : c.name || '').join(" ").toLowerCase()
        : (typeof categories === 'string' ? categories.toLowerCase() : '');
      
      const additionalType = (typeof item.additionalType === 'string' ? item.additionalType : "").toLowerCase();

      if (itemType === 'tour') {
        mainCatId = findCatId("Freizeit & Aktivitäten");
      } else if (categoryText.includes("museum") || categoryText.includes("kunst") || additionalType.includes("museum")) {
        mainCatId = findCatId("Kunst & Kultur");
        subCatId = findCatId("Museum, Kunst & Ausstellung");
      } else if (categoryText.includes("theater") || categoryText.includes("theatre") || categoryText.includes("oper")) {
        mainCatId = findCatId("Kunst & Kultur");
        subCatId = findCatId("Theater, Musical & Show");
      } else if (categoryText.includes("konzert") || categoryText.includes("musik") || categoryText.includes("festival")) {
        mainCatId = findCatId("Musik & Party");
      } else if (categoryText.includes("wellness") || categoryText.includes("spa")) {
        mainCatId = findCatId("Gastronomie & Genuss");
      }

      // Tags zuweisen basierend auf Inhalt
      const tagsToAssign: (number | undefined)[] = [];
      const textForCheck = (title + " " + cleanDescription + " " + categoryText).toLowerCase();

      // Outdoor/Indoor Detection
      if (textForCheck.includes("outdoor") || textForCheck.includes("wandern") || textForCheck.includes("hiking") || 
          textForCheck.includes("berg") || textForCheck.includes("see") || textForCheck.includes("natur") ||
          itemType === 'tour') {
        if (tagIds.outdoor) tagsToAssign.push(tagIds.outdoor);
      } else {
        if (tagIds.indoor) tagsToAssign.push(tagIds.indoor);
      }

      // Familien-Detection
      if (textForCheck.includes("familie") || textForCheck.includes("kinder") || textForCheck.includes("family")) {
        if (tagIds.familie) tagsToAssign.push(tagIds.familie);
      }

      // Romantik-Detection
      if (textForCheck.includes("romantisch") || textForCheck.includes("romantic") || textForCheck.includes("wellness") || textForCheck.includes("spa")) {
        if (tagIds.romantisch) tagsToAssign.push(tagIds.romantisch);
      }

      // Preis extrahieren und $/$$/$$$ Logik anwenden
      let priceFrom: number | null = null;
      let priceLabel: string | null = null;
      
      if (item.offers) {
        const offers = Array.isArray(item.offers) ? item.offers : [item.offers];
        const prices = offers.map((o: any) => o.price || o.lowPrice).filter((p: number) => p > 0);
        if (prices.length > 0) {
          priceFrom = Math.min(...prices);
        }
      } else if (item.priceRange) {
        const priceMatch = item.priceRange.match(/(\d+)/);
        if (priceMatch) {
          priceFrom = parseInt(priceMatch[1]);
        }
      }

      // Gratis-Events erkennen
      if (item.isAccessibleForFree || textForCheck.includes("gratis") || textForCheck.includes("kostenlos") || textForCheck.includes("free")) {
        priceFrom = 0;
        priceLabel = "Gratis";
        if (tagIds.budget) tagsToAssign.push(tagIds.budget);
      } else if (priceFrom !== null && priceFrom > 0) {
        // $/$$/$$$ Label basierend auf Preis
        if (priceFrom <= 50) {
          priceLabel = "$";
          if (tagIds.budget) tagsToAssign.push(tagIds.budget);
        } else if (priceFrom <= 120) {
          priceLabel = "$$";
        } else {
          priceLabel = "$$$";
        }
      } else {
        // Kein Preis bekannt - Standard $$ (mittel) setzen
        priceLabel = "$$";
        priceFrom = 55;
      }

      // KI-Beschreibung generieren falls nötig
      let shortDescription = cleanDescription ? cleanDescription.substring(0, 200) : "";

      if (OPENAI_API_KEY && (!cleanDescription || cleanDescription.length < 50)) {
        try {
          const promptInstruction = `Schreibe eine einladende Beschreibung auf Deutsch für diese Schweizer Attraktion: "${title}" in ${city || "der Schweiz"}. 
Typ: ${itemType}. Max 2 Sätze. Stil: Einladend, Quiet Luxury. Keine Emojis.`;

          const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_API_KEY}` },
            body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: promptInstruction }], max_tokens: 100 }),
          });
          const aiData = await aiRes.json();
          shortDescription = aiData.choices?.[0]?.message?.content || shortDescription;
        } catch (e) {
          console.error("AI Fehler für", title, e);
        }
      }

      // Ticket/Website-Link - MySwitzerland URL verwenden
      const ticketLink = item.url || item.mainEntityOfPage || item.sameAs || 
                         (item["@id"] ? `https://www.myswitzerland.com${item["@id"]}` : null);

      // Event speichern
      const { data: savedEvent, error } = await supabase
        .from("events")
        .upsert({
          external_id: externalId,
          title: title,
          description: cleanDescription,
          short_description: shortDescription,
          location: city || "Schweiz",
          venue_name: item.containedInPlace?.name || title,
          address_street: street,
          address_city: city,
          address_zip: zip,
          address_country: country,
          latitude: lat,
          longitude: lng,
          image_url: imageUrl,
          start_date: item.startDate || null, // Kein Default-Datum mehr - Attraktionen sind permanent
          end_date: item.endDate || null,
          ticket_link: ticketLink,
          source: 'myswitzerland', // Quelle markieren für Filterung
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

      totalProcessed++;
      console.log(`Importiert: ${title} (${city}) [${itemType}]`);
    }

    const result = {
      success: true,
      message: `MySwitzerland OpenData Import fertig.`,
      imported: totalProcessed,
      total_found: allItems.length
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
