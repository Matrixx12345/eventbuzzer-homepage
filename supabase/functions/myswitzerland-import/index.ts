import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// MySwitzerland OpenData API
const API_BASE_URL = "https://opendata.myswitzerland.io/v1";

// BLOCKLIST - Events die NICHT importiert werden dürfen
const BLOCKED_EVENT_TITLES = [
  'malen wie paul klee',
  'meringues selber machen',
  'wenn schafe geschieden werden',
  'von tisch zu tisch',
  'disc golf',  // bereits gefiltert im Frontend
];

// Hilfsfunktion: HTML-Tags und Entities entfernen
const stripHtml = (html: string) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>?/gm, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)))
    .replace(/\s+/g, ' ')
    .trim();
};

// Schweizer Städte mit Koordinaten für Reverse-Geocoding
const SWISS_CITIES = [
  { name: "Zürich", lat: 47.3769, lng: 8.5417 },
  { name: "Bern", lat: 46.9480, lng: 7.4474 },
  { name: "Basel", lat: 47.5596, lng: 7.5886 },
  { name: "Luzern", lat: 47.0502, lng: 8.3093 },
  { name: "Genf", lat: 46.2044, lng: 6.1432 },
  { name: "Lausanne", lat: 46.5197, lng: 6.6323 },
  { name: "Winterthur", lat: 47.4984, lng: 8.7246 },
  { name: "St. Gallen", lat: 47.4245, lng: 9.3767 },
  { name: "Lugano", lat: 46.0037, lng: 8.9511 },
  { name: "Interlaken", lat: 46.6863, lng: 7.8632 },
  { name: "Zermatt", lat: 46.0207, lng: 7.7491 },
  { name: "Davos", lat: 46.8027, lng: 9.8360 },
  { name: "Grindelwald", lat: 46.6244, lng: 8.0341 },
  { name: "Montreux", lat: 46.4312, lng: 6.9107 },
  { name: "Andermatt", lat: 46.6367, lng: 8.5936 },
  { name: "Laax", lat: 46.8096, lng: 9.2588 },
  { name: "Arosa", lat: 46.7837, lng: 9.6806 },
  { name: "Thun", lat: 46.7580, lng: 7.6280 },
  { name: "Chur", lat: 46.8508, lng: 9.5320 },
  { name: "Sion", lat: 46.2330, lng: 7.3592 },
  { name: "Neuchâtel", lat: 46.9900, lng: 6.9293 },
  { name: "Rapperswil", lat: 47.2267, lng: 8.8183 },
  { name: "Solothurn", lat: 47.2088, lng: 7.5323 },
  { name: "Baden", lat: 47.4734, lng: 8.3063 },
  { name: "Ascona", lat: 46.1570, lng: 8.7727 },
  { name: "Locarno", lat: 46.1711, lng: 8.7996 },
  { name: "Verbier", lat: 46.0962, lng: 7.2284 },
  { name: "Saas-Fee", lat: 46.1082, lng: 7.9277 },
  { name: "Engelberg", lat: 46.8200, lng: 8.4075 },
  { name: "Pontresina", lat: 46.4948, lng: 9.9003 },
  { name: "Wengen", lat: 46.6085, lng: 7.9222 },
  { name: "Brig", lat: 46.3147, lng: 7.9878 },
  { name: "Bellinzona", lat: 46.1944, lng: 9.0249 },
  { name: "Schaffhausen", lat: 47.6962, lng: 8.6350 },
  { name: "Aarau", lat: 47.3913, lng: 8.0454 },
  { name: "Fribourg", lat: 46.8065, lng: 7.1619 },
  { name: "Köniz", lat: 46.9241, lng: 7.4135 },
  { name: "Uster", lat: 47.3505, lng: 8.7207 },
  { name: "Vevey", lat: 46.4628, lng: 6.8433 },
  { name: "Morschach", lat: 46.9783, lng: 8.6317 },
  { name: "Belalp", lat: 46.3722, lng: 7.9917 },
  { name: "Göschenen", lat: 46.6658, lng: 8.5875 }
];

// Stadt aus Koordinaten ermitteln (nächste Stadt)
const findNearestCity = (lat: number | null, lng: number | null): string => {
  if (!lat || !lng) return "Schweiz";
  
  let nearestCity = "Schweiz";
  let minDistance = Infinity;
  
  for (const city of SWISS_CITIES) {
    const distance = Math.sqrt(
      Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = city.name;
    }
  }
  
  // Nur zurückgeben wenn in vernünftiger Nähe (ca. 50km)
  return minDistance < 0.5 ? nearestCity : "Schweiz";
};

// Stadt aus Titel extrahieren
const extractCityFromTitle = (title: string): string | null => {
  const lowerTitle = title.toLowerCase();
  for (const city of SWISS_CITIES) {
    const cityLower = city.name.toLowerCase();
    if (lowerTitle.includes(cityLower) || 
        lowerTitle.includes(` ${cityLower}`) || 
        lowerTitle.includes(`${cityLower} `) ||
        lowerTitle.includes(`in ${cityLower}`) ||
        lowerTitle.includes(`from ${cityLower}`) ||
        lowerTitle.includes(`to ${cityLower}`)) {
      return city.name;
    }
  }
  return null;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starte MySwitzerland OpenData Import...");

    // External Supabase for events storage (hardcoded - same as externalClient.ts)
    const EXTERNAL_SUPABASE_URL = 'https://tfkiyvhfhvkejpljsnrk.supabase.co';
    const EXTERNAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRma2l5dmhmaHZrZWpwbGpzbnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDA4MDQsImV4cCI6MjA4MDY3NjgwNH0.bth3dTvG3fXSu4qILB514x1TRy0scRLo_KM9lDMMKDs';

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    // MySwitzerland API Key (hardcoded from README)
    const MY_SWITZERLAND_KEY = Deno.env.get("MYSWITZERLAND_KEY") || '2vx0GBd6GS9WqN1pez8za3q1owsicC5l5wcqOlCj';

    const supabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY);

    // 1. Taxonomy & Tags laden (wie bei tm-import)
    const { data: taxonomy } = await supabase.from("taxonomy").select("id, name, type");
    const { data: tags } = await supabase.from("tags").select("id, slug");
    if (!taxonomy || !tags) throw new Error("DB Fehler: Taxonomy/Tags nicht geladen");

    // DEBUG: Log alle verfügbaren Kategorien
    console.log("=== TAXONOMY DEBUG (myswitzerland-import) ===");
    console.log("Main categories:", taxonomy.filter(t => t.type === 'main').map(t => `[${t.id}] "${t.name}"`).join(", "));
    console.log("Sub categories:", taxonomy.filter(t => t.type === 'sub').map(t => `[${t.id}] "${t.name}"`).join(", "));

    // Case-insensitive und trimmed matching
    const findCatId = (name: string) => {
      const searchName = name.trim().toLowerCase();
      const found = taxonomy.find(t => t.name.trim().toLowerCase() === searchName);
      if (!found) {
        console.log(`⚠️ KATEGORIE NICHT GEFUNDEN: "${name}" (suche: "${searchName}")`);
        // Zeige ähnliche Namen
        const similar = taxonomy.filter(t => t.name.toLowerCase().includes(searchName.split(" ")[0].toLowerCase()));
        if (similar.length > 0) console.log(`   Ähnliche: ${similar.map(s => s.name).join(", ")}`);
      }
      return found?.id;
    };
    const findTagId = (search: string) => tags.find(t => t.slug.includes(search))?.id;

    // Tag slugs - exact matches to tags table
    const tagIds = {
      romantisch: findTagId("romantisch-date"),
      familie: findTagId("familie-kinder"),
      outdoor: findTagId("open-air"),
      indoor: findTagId("schlechtwetter-indoor"),
      budget: findTagId("kostenlos-budget"),
      wellness: findTagId("wellness-selfcare"),
      natur: findTagId("natur-erlebnisse")
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

    // 2. Attractions holen (Hauptdatenquelle für Events) - MIT lang=de Parameter!
    console.log("Fetching attractions...");
    try {
      const attractionsRes = await fetch(`${API_BASE_URL}/attractions/?pageSize=50&lang=de`, {
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
      const offersRes = await fetch(`${API_BASE_URL}/offers/?pageSize=50&lang=de`, {
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
      const toursRes = await fetch(`${API_BASE_URL}/tours/?pageSize=50&lang=de`, {
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

      // BLOCKLIST CHECK - Skip events on blocklist
      const titleLower = title.toLowerCase();
      if (BLOCKED_EVENT_TITLES.some(blocked => titleLower.includes(blocked))) {
        console.log(`⏭️  Skipped BLOCKED event: "${title}"`);
        continue;
      }

      // CHRISTMAS FILTER - Only import Weihnachts-Events in Nov/Dec
      const currentMonth = new Date().getMonth() + 1;
      const isChristmasEvent = titleLower.includes('weihnacht') || titleLower.includes('noël') || titleLower.includes('noel');
      if (isChristmasEvent && currentMonth < 11) {
        console.log(`⏭️  Skipped CHRISTMAS event (not season): "${title}"`);
        continue;
      }

      // Debug: Log item structure für erstes Item
      if (totalProcessed === 0) {
        console.log("Sample item structure:", JSON.stringify(item, null, 2).substring(0, 2000));
      }
      
      // Beschreibung extrahieren und säubern - mehr Felder prüfen
      const rawDescription = item.description || item.abstract || item.text || 
                            item.shortDescription || item.longDescription || "";
      const cleanDescription = stripHtml(rawDescription);
      
      // Bild URLs extrahieren - ALLE Bilder für Gallery sammeln
      const allImageUrls: string[] = [];

      // Helper function to extract URL from various formats
      const extractUrl = (field: any): string | null => {
        if (!field) return null;
        if (typeof field === 'string' && field.startsWith('http')) return field;
        if (field.url && typeof field.url === 'string') return field.url;
        if (field.contentUrl && typeof field.contentUrl === 'string') return field.contentUrl;
        return null;
      };

      // Collect from images array
      if (Array.isArray(item.images)) {
        item.images.forEach((img: any) => {
          const url = extractUrl(img);
          if (url && !allImageUrls.includes(url)) allImageUrls.push(url);
        });
      }

      // Collect from gallery array
      if (Array.isArray(item.gallery)) {
        item.gallery.forEach((g: any) => {
          const url = extractUrl(g) || extractUrl(g?.image);
          if (url && !allImageUrls.includes(url)) allImageUrls.push(url);
        });
      }

      // Collect from media array
      if (Array.isArray(item.media)) {
        item.media.forEach((m: any) => {
          const url = extractUrl(m);
          if (url && !allImageUrls.includes(url)) allImageUrls.push(url);
        });
      }

      // Single image fields (fallback if no arrays)
      const singleImageFields = [
        item.image,
        item.photo,
        item.thumbnail,
        item.primaryImage,
        item.logo,
      ];

      for (const field of singleImageFields) {
        const url = extractUrl(field);
        if (url && !allImageUrls.includes(url)) allImageUrls.push(url);
      }

      // Primary image is the first one, rest go to gallery
      const imageUrl = allImageUrls.length > 0 ? allImageUrls[0] : null;
      const galleryUrls = allImageUrls.length > 1 ? allImageUrls.slice(1) : [];

      console.log(`Images for "${title}": Primary=${imageUrl ? 'YES' : 'NO'}, Gallery=${galleryUrls.length} additional`);

      // Adressdaten extrahieren - erweiterte Suche für verschiedene API-Formate
      const geo = item.geo || item.location?.geo || {};
      const address = item.address || item.location?.address || item.location || {};
      
      // Koordinaten extrahieren (zuerst, für Stadt-Ermittlung)
      const lat = geo.latitude ? parseFloat(geo.latitude) : 
                  (geo.lat ? parseFloat(geo.lat) : null);
      const lng = geo.longitude ? parseFloat(geo.longitude) : 
                  (geo.lng || geo.lon ? parseFloat(geo.lng || geo.lon) : null);
      
      // Stadt ermitteln: 1. Aus Titel, 2. Aus Koordinaten, 3. Fallback
      const city = extractCityFromTitle(title) || 
                   findNearestCity(lat, lng) ||
                   "Schweiz";
      
      const street = address.streetAddress || address.street || "";
      const zip = address.postalCode || address.zipCode || address.zip || "";
      const country = address.addressCountry || address.country || "CH";

      // Kategorie-Zuordnung basierend auf Typ - exact matches to taxonomy table
      let mainCatId = null;
      let subCatId = null;

      // MySwitzerland Kategorien auswerten
      const categories = item.categories || item.category || [];
      const categoryText = Array.isArray(categories) 
        ? categories.map((c: any) => typeof c === 'string' ? c : c.name || '').join(" ").toLowerCase()
        : (typeof categories === 'string' ? categories.toLowerCase() : '');
      
      const additionalType = (typeof item.additionalType === 'string' ? item.additionalType : "").toLowerCase();
      const titleLowerForCat = title.toLowerCase();
      const descLower = cleanDescription.toLowerCase();

      // Erweiterte Keyword-Listen für bessere Kategorisierung
      const wellnessKeywords = ["wellness", "spa", "thermal", "sauna", "massage", "entspannung", "relax", "bad", "bäder"];
      const tourKeywords = ["wanderung", "route", "tour", "etappe", "weg", "pfad", "loipe", "rundweg", "panoramaweg"];
      const sportKeywords = ["sport", "ski", "snowboard", "bike", "velo", "klettern", "climbing", "golf", "tennis", "kartbahn", "outdoor", "adventure", "rafting", "paragliding"];
      const museumKeywords = ["museum", "ausstellung", "galerie", "kunst", "art", "exhibition"];
      const theaterKeywords = ["theater", "theatre", "oper", "opera", "konzert", "aufführung", "show"];
      const festivalKeywords = ["festival", "fest", "feier", "party"];
      const kulinarikKeywords = ["tasting", "schokolade", "chocolate", "käse", "cheese", "wein", "wine", "kulinarik", "food", "essen", "restaurant", "dining"];
      const marktKeywords = ["markt", "market", "streetfood", "flohmarkt"];
      const naturKeywords = ["schlucht", "see", "berg", "mountain", "lake", "natur", "nature", "gletscher", "glacier", "wasserfall"];

      // Kategorisierung mit Priorität (spezifisch → allgemein)
      if (wellnessKeywords.some(kw => titleLowerForCat.includes(kw) || categoryText.includes(kw))) {
        mainCatId = findCatId("Freizeit & Aktivitäten");
        subCatId = findCatId("Wellness & Relax Events");
      } else if (tourKeywords.some(kw => titleLowerForCat.includes(kw)) || itemType === 'tour') {
        mainCatId = findCatId("Freizeit & Aktivitäten");
        subCatId = findCatId("Geführte Touren & Besondere Erlebnisse");
      } else if (sportKeywords.some(kw => titleLowerForCat.includes(kw) || categoryText.includes(kw))) {
        mainCatId = findCatId("Freizeit & Aktivitäten");
        subCatId = findCatId("Active Lifestyle & Sport-Events");
      } else if (museumKeywords.some(kw => titleLowerForCat.includes(kw) || categoryText.includes(kw) || additionalType.includes(kw))) {
        mainCatId = findCatId("Kunst & Kultur");
        subCatId = findCatId("Museum, Kunst & Ausstellung");
      } else if (theaterKeywords.some(kw => titleLowerForCat.includes(kw) || categoryText.includes(kw))) {
        mainCatId = findCatId("Kunst & Kultur");
        subCatId = findCatId("Theater, Musical & Show");
      } else if (festivalKeywords.some(kw => titleLowerForCat.includes(kw) || categoryText.includes(kw))) {
        mainCatId = findCatId("Musik & Party");
        subCatId = findCatId("Musik-Festivals");
      } else if (kulinarikKeywords.some(kw => titleLowerForCat.includes(kw) || categoryText.includes(kw))) {
        mainCatId = findCatId("Kulinarik & Genuss");
        subCatId = findCatId("Tastings, Workshops & Kurse");
      } else if (marktKeywords.some(kw => titleLowerForCat.includes(kw) || categoryText.includes(kw))) {
        mainCatId = findCatId("Märkte & Lokales");
        subCatId = findCatId("Streetfood & Designmärkte");
      } else if (naturKeywords.some(kw => titleLowerForCat.includes(kw) || descLower.includes(kw))) {
        // Natur-Erlebnisse → Geführte Touren
        mainCatId = findCatId("Freizeit & Aktivitäten");
        subCatId = findCatId("Geführte Touren & Besondere Erlebnisse");
      } else {
        // Default basierend auf Item-Typ
        if (itemType === 'tour') {
          mainCatId = findCatId("Freizeit & Aktivitäten");
          subCatId = findCatId("Geführte Touren & Besondere Erlebnisse");
        } else if (itemType === 'attraction') {
          mainCatId = findCatId("Freizeit & Aktivitäten");
          subCatId = findCatId("Geführte Touren & Besondere Erlebnisse");
        } else if (itemType === 'offer') {
          mainCatId = findCatId("Freizeit & Aktivitäten");
          subCatId = findCatId("Geführte Touren & Besondere Erlebnisse");
        } else {
          mainCatId = findCatId("Freizeit & Aktivitäten");
          subCatId = findCatId("Geführte Touren & Besondere Erlebnisse");
        }
      }
      
      console.log(`Category for "${title}": Type=${itemType}, Categories=${categoryText} → Main=${mainCatId}, Sub=${subCatId}`);

      // Tags zuweisen basierend auf Inhalt
      const tagsToAssign: (number | undefined)[] = [];
      const textForCheck = (title + " " + cleanDescription + " " + categoryText).toLowerCase();

      // Outdoor/Indoor Detection
      if (textForCheck.includes("outdoor") || textForCheck.includes("wandern") || textForCheck.includes("hiking") || 
          textForCheck.includes("berg") || textForCheck.includes("see") || textForCheck.includes("natur") ||
          itemType === 'tour') {
        if (tagIds.outdoor) tagsToAssign.push(tagIds.outdoor);
        if (tagIds.natur) tagsToAssign.push(tagIds.natur);
      } else {
        if (tagIds.indoor) tagsToAssign.push(tagIds.indoor);
      }

      // Familien-Detection
      if (textForCheck.includes("familie") || textForCheck.includes("kinder") || textForCheck.includes("family")) {
        if (tagIds.familie) tagsToAssign.push(tagIds.familie);
      }

      // Romantik-Detection
      if (textForCheck.includes("romantisch") || textForCheck.includes("romantic") || textForCheck.includes("date")) {
        if (tagIds.romantisch) tagsToAssign.push(tagIds.romantisch);
      }
      
      // Wellness-Detection (separate tag)
      if (textForCheck.includes("wellness") || textForCheck.includes("spa") || textForCheck.includes("thermal") || textForCheck.includes("massage")) {
        if (tagIds.wellness) tagsToAssign.push(tagIds.wellness);
      }

      // Preis extrahieren und $/$$/$$$ Logik anwenden mit INTELLIGENTER Schätzung
      let priceFrom: number | null = null;
      let priceLabel: string | null = null;
      
      // Echten Preis aus API extrahieren
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
      if (item.isAccessibleForFree || textForCheck.includes("gratis") || textForCheck.includes("kostenlos") || textForCheck.includes("free entry")) {
        priceFrom = 0;
        priceLabel = "Gratis";
        if (tagIds.budget) tagsToAssign.push(tagIds.budget);
      } else if (priceFrom !== null && priceFrom > 0) {
        // $/$$/$$$ Label basierend auf echtem Preis
        if (priceFrom <= 50) {
          priceLabel = "$";
          if (tagIds.budget) tagsToAssign.push(tagIds.budget);
        } else if (priceFrom <= 120) {
          priceLabel = "$$";
        } else {
          priceLabel = "$$$";
        }
      } else {
        // KEIN echter Preis bekannt - INTELLIGENTE Schätzung basierend auf Typ und Keywords
        const titleLower = title.toLowerCase();
        
        // ZUERST: Mehrtages-Reisen erkennen (IMMER teuer, überschreibt alles andere!)
        const multiDayPatterns = [
          /\d+\s*tage?\b/i,           // "7 Tage", "5 Tag"
          /\d+\s*-?\s*day/i,          // "7-day", "7 day"
          /\d+\s*nächte?\b/i,         // "6 Nächte"
          /\d+\s*nights?\b/i,         // "6 nights"
          /mehrtägig/i,               // "mehrtägig"
          /multi-?day/i,              // "multi-day"
          /rundreise/i,               // "Rundreise"
          /self\s*drive.*schweiz/i,   // "Self Drive Schweiz" (immer Rundreise)
          /grand\s*tour/i,            // "Grand Tour"
        ];
        
        const isMultiDay = multiDayPatterns.some(pattern => pattern.test(titleLower) || pattern.test(textForCheck));
        
        // Keywords für Premium Angebote ($$$)
        const premiumKeywords = [
          "vip", "premium", "luxury", "luxus", "privat", "private",
          "chauffeur", "helicopter", "helikopter", "gourmet", "fine dining",
          "exclusive", "exklusiv", "first class", "coaching camp"
        ];
        
        // Keywords für günstige Angebote ($)
        const budgetKeywords = [
          "self guided", "self-guided", "audio tour", "audio experience", 
          "rundweg", "wanderweg", "route", "etappe", "loipe", 
          "citytrain", "stadtrundfahrt", "weg", "pfad",
          "rundloipe", "panoramaweg"
        ];
        
        const isPremium = premiumKeywords.some(kw => titleLower.includes(kw) || textForCheck.includes(kw));
        const isBudget = budgetKeywords.some(kw => titleLower.includes(kw) || textForCheck.includes(kw));
        
        // Priorität: Mehrtages > Premium > Budget > Standard
        if (isMultiDay) {
          // Mehrtägige Reisen sind IMMER teuer (mehrere Tausend CHF)
          priceLabel = "$$$";
          priceFrom = 150;
          console.log(`Price estimate for "${title}": $$$ (MULTI-DAY detected)`);
        } else if (isPremium) {
          priceLabel = "$$$";
          priceFrom = 150;
          console.log(`Price estimate for "${title}": $$$ (premium keywords)`);
        } else if (isBudget && itemType !== 'offer') {
          // Budget nur für Tours/Wege, nicht für "offers"
          priceLabel = "$";
          priceFrom = 25;
          if (tagIds.budget) tagsToAssign.push(tagIds.budget);
          console.log(`Price estimate for "${title}": $ (budget keywords, type: ${itemType})`);
        } else if (itemType === 'tour') {
          // Wanderwege/Routen ohne Multi-Day sind günstig
          priceLabel = "$";
          priceFrom = 25;
          if (tagIds.budget) tagsToAssign.push(tagIds.budget);
          console.log(`Price estimate for "${title}": $ (type: tour)`);
        } else if (categoryText.includes("museum") || categoryText.includes("attraction") || itemType === 'attraction') {
          // Museen und Attraktionen meist mittlere Preisklasse
          priceLabel = "$$";
          priceFrom = 55;
          console.log(`Price estimate for "${title}": $$ (museum/attraction)`);
        } else if (itemType === 'offer') {
          // Offers sind meist bezahlte Erlebnisse - $$
          priceLabel = "$$";
          priceFrom = 55;
          console.log(`Price estimate for "${title}": $$ (type: offer)`);
        } else {
          // Default: $$ für unbekannte
          priceLabel = "$$";
          priceFrom = 55;
          console.log(`Price estimate for "${title}": $$ (default)`);
        }
      }

      // KI-Beschreibungen generieren falls nötig (BEIDE: short UND long)
      let shortDescription = cleanDescription ? cleanDescription.substring(0, 200) : "";
      let longDescription = cleanDescription || "";

      if (OPENAI_API_KEY && (!cleanDescription || cleanDescription.length < 50)) {
        try {
          const promptInstruction = `Du bist ein Schweiz-Tourismus-Experte. Schreibe für diese Attraktion ZWEI Beschreibungen auf Deutsch:

Attraktion: "${title}" in ${city || "der Schweiz"}
Typ: ${itemType}

WICHTIG: Antworte EXAKT in diesem JSON-Format:
{"short": "Kurze einladende Beschreibung (max 2 Sätze, ca. 150 Zeichen)", "long": "Ausführliche Beschreibung (3-5 Sätze, ca. 300-500 Zeichen)"}

Stil: Einladend, Quiet Luxury. Keine Emojis. Nur das JSON, keine Erklärungen.`;

          const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_API_KEY}` },
            body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: promptInstruction }], max_tokens: 300 }),
          });
          const aiData = await aiRes.json();
          const aiContent = aiData.choices?.[0]?.message?.content || "";
          
          // JSON parsen
          try {
            const parsed = JSON.parse(aiContent.trim());
            shortDescription = parsed.short || shortDescription;
            longDescription = parsed.long || longDescription;
            console.log(`AI generated descriptions for "${title}": short=${shortDescription.length} chars, long=${longDescription.length} chars`);
          } catch (parseErr) {
            // Falls kein JSON, verwende den ganzen Text als short
            shortDescription = aiContent.substring(0, 200);
            longDescription = aiContent;
            console.log(`AI fallback (no JSON) for "${title}"`);
          }
        } catch (e) {
          console.error("AI Fehler für", title, e);
        }
      }

      // Ticket/Website-Link - MySwitzerland Deutsche URL bevorzugen
      let ticketLink = item.url || item.mainEntityOfPage || item.sameAs || null;
      
      // Falls URL vorhanden aber englisch, versuche auf Deutsch umzuleiten
      if (ticketLink && ticketLink.includes('/en/')) {
        ticketLink = ticketLink.replace('/en/', '/de/');
      }
      
      // Falls keine URL, versuche aus @id eine deutsche URL zu bauen
      if (!ticketLink && item["@id"]) {
        ticketLink = `https://www.myswitzerland.com/de${item["@id"]}`;
      }
      
      console.log(`Ticket link for "${title}":`, ticketLink || "NONE");

      // Helper: Classify event type (permanent, seasonal, recurring)
      const classifyEventType = (item: any, itemType: string, title: string) => {
        const titleLower = title.toLowerCase();
        const categoryText = Array.isArray(item.categories)
          ? item.categories.map((c: any) => typeof c === 'string' ? c : c.name || '').join(" ").toLowerCase()
          : '';

        // Permanent attractions (museums, castles, landmarks)
        const permanentKeywords = [
          'museum', 'schloss', 'castle', 'kirche', 'church',
          'galerie', 'gallery', 'kathedrale', 'cathedral',
          'denkmal', 'monument', 'aquarium', 'zoo', 'tierpark',
          'festung', 'fortress', 'rathaus', 'town hall'
        ];

        if (permanentKeywords.some(kw => titleLower.includes(kw) || categoryText.includes(kw))) {
          return {
            type: 'permanent',
            pattern: null,
            months: [1,2,3,4,5,6,7,8,9,10,11,12]
          };
        }

        // Winter seasonal attractions (Nov-Mar)
        const winterKeywords = [
          'ski', 'snowboard', 'langlauf', 'schneeschuh',
          'schlitten', 'wintersport', 'skipiste', 'winterwandern'
        ];
        if (winterKeywords.some(kw => titleLower.includes(kw))) {
          return {
            type: 'seasonal',
            pattern: 'seasonal',
            months: [11, 12, 1, 2, 3]
          };
        }

        // Summer seasonal attractions (May-Sep)
        const summerKeywords = [
          'sommerbahn', 'sommerrodelbahn', 'seilbahn sommer',
          'freibad', 'strandbad', 'sommerskigebiet'
        ];
        if (summerKeywords.some(kw => titleLower.includes(kw))) {
          return {
            type: 'seasonal',
            pattern: 'seasonal',
            months: [5, 6, 7, 8, 9]
          };
        }

        // Weekly recurring events
        const weeklyKeywords = [
          'wochenmarkt', 'weekly market', 'jeden montag',
          'jeden dienstag', 'jeden mittwoch', 'jeden donnerstag',
          'jeden freitag', 'jeden samstag', 'jeden sonntag'
        ];
        if (weeklyKeywords.some(kw => titleLower.includes(kw) || categoryText.includes(kw))) {
          return {
            type: 'recurring',
            pattern: 'weekly',
            months: [1,2,3,4,5,6,7,8,9,10,11,12]
          };
        }

        // Default: permanent (safer than storing dates)
        return {
          type: 'permanent',
          pattern: null,
          months: [1,2,3,4,5,6,7,8,9,10,11,12]
        };
      };

      // NEW: Classify event type to mark as permanent/recurring
      const eventClass = classifyEventType(item, itemType, title);
      const isRecurring = eventClass.pattern !== null;
      const recurringPattern = eventClass.pattern;
      const availableMonths = eventClass.months;

      // CRITICAL: MySwitzerland events have NULL dates (prevents SEO damage)
      const startDate: string | null = null;
      const endDate: string | null = null;

      // Optional: Calculate next occurrence for seasonal events
      let nextOccurrenceStart: string | null = null;
      let nextOccurrenceEnd: string | null = null;

      if (eventClass.pattern === 'seasonal' && eventClass.months.length > 0) {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const nextMonth = eventClass.months.find(m => m >= currentMonth) || eventClass.months[0];
        const year = nextMonth >= currentMonth ? now.getFullYear() : now.getFullYear() + 1;

        nextOccurrenceStart = new Date(year, nextMonth - 1, 1).toISOString();
        const lastMonth = eventClass.months[eventClass.months.length - 1];
        nextOccurrenceEnd = new Date(year, lastMonth, 0).toISOString();
      }

      // Check: Ist das Event admin-verifiziert? Wenn ja, SKIP!
      const { data: existingEvent } = await supabase
        .from("events")
        .select("id, admin_verified")
        .eq("external_id", externalId)
        .maybeSingle();

      if (existingEvent?.admin_verified === true) {
        console.log(`⏭️ Skipping admin-verified event: ${title}`);
        savedCount++;
        continue;
      }

      // Event speichern
      const { data: savedEvent, error } = await supabase
        .from("events")
        .upsert({
          external_id: externalId,
          title: title,
          description: longDescription,
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
          gallery_urls: galleryUrls.length > 0 ? galleryUrls : null,

          // CRITICAL: MySwitzerland events have NULL dates (prevents SEO damage)
          start_date: null,
          end_date: null,

          // NEW: Recurring event fields
          is_recurring: isRecurring,
          recurring_pattern: recurringPattern,
          available_months: availableMonths,
          next_occurrence_start: nextOccurrenceStart,
          next_occurrence_end: nextOccurrenceEnd,

          ticket_link: ticketLink,
          category_main_id: mainCatId,
          category_sub_id: subCatId,
          price_from: priceFrom,
          price_label: priceLabel,
          source: 'myswitzerland'
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
