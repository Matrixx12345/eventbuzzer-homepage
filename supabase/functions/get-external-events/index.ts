import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Hilfsfunktion: Bereinigt Ticketmaster-Titel für besseres Grouping
function cleanEventTitle(title: string): string {
  if (!title) return "";
  let clean = title.toLowerCase();

  // Entferne alles nach typischen Trennzeichen wie " - ", " | ", "(", ":"
  // Beispiel: "Festival Name - Freitag" -> "Festival Name"
  clean = clean.split(/ [-|:(]/)[0];

  // Entferne Jahreszahlen, wenn sie stören (optional, hier lassen wir sie mal drin)
  // clean = clean.replace(/\d{4}/g, '');

  // Entferne Sonderzeichen und Leerzeichen für den Vergleich
  clean = clean.replace(/[^a-z0-9]/g, "");

  return clean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { offset = 0, limit = 50, initialLoad = true, filters = {} } = body;
    const {
      searchQuery,
      categoryId,
      subcategoryId,
      priceTier,
      city,
      radius,
      cityLat,
      cityLng,
      timeFilter,
      tags,
      vipArtistsFilter,
      dateFrom,
      dateTo,
      singleDate,
      availability,
      source,
    } = filters;

    const externalUrl = Deno.env.get("Supabase_URL");
    const externalKey = Deno.env.get("Supabase_ANON_KEY");

    if (!externalUrl || !externalKey) throw new Error("Missing secrets");

    const supabase = createClient(externalUrl, externalKey);

    // Wir laden genug Events für das Grouping
    const fetchLimit = 600;

    let query = supabase.from("events").select("*", { count: "exact" });

    // --- SQL FILTER ---
    if (searchQuery?.trim()) {
      const s = `%${searchQuery.trim()}%`;
      query = query.or(`title.ilike.${s},venue_name.ilike.${s},address_city.ilike.${s}`);
    }

    // Einfache Stadt-Suche im SQL (Radius machen wir präzise im JS)
    if (city && (!radius || radius === 0)) {
      query = query.or(`address_city.ilike.%${city}%,location.ilike.%${city}%`);
    }

    if (categoryId) query = query.eq("category_main_id", categoryId);
    if (subcategoryId) query = query.eq("category_sub_id", subcategoryId);

    // Zeit-Filter
    const now = new Date();
    if (timeFilter === "now")
      query = query
        .gte("start_date", now.toISOString())
        .lte("start_date", new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString());
    else if (timeFilter === "today")
      query = query
        .gte("start_date", now.toISOString())
        .lte("start_date", new Date(now.setHours(23, 59, 59)).toISOString());
    else if (timeFilter === "tomorrow") {
      const tmr = new Date();
      tmr.setDate(tmr.getDate() + 1);
      query = query
        .gte("start_date", new Date(tmr.setHours(0, 0, 0, 0)).toISOString())
        .lte("start_date", new Date(tmr.setHours(23, 59, 59)).toISOString());
    } else if (timeFilter === "thisWeek") {
      const sat = new Date();
      sat.setDate(sat.getDate() + ((6 - sat.getDay() + 7) % 7));
      const sun = new Date(sat);
      sun.setDate(sat.getDate() + 1);
      query = query
        .gte("start_date", new Date(sat.setHours(0, 0, 0, 0)).toISOString())
        .lte("start_date", new Date(sun.setHours(23, 59, 59)).toISOString());
    }

    // Sortieren und Laden
    query = query.order("start_date", { ascending: true }).limit(fetchLimit);

    const { data, error } = await query;
    if (error) throw error;

    let filteredData = data || [];

    // --- JAVASCRIPT LOGIK ---

    // 1. Grouping (Das Wichtigste für Ticketmaster!)
    const groupedMap = new Map();

    filteredData.forEach((event) => {
      // Titel bereinigen ("Rock Country - Freitag" -> "rockcountry")
      const rawTitle = event.title || "";
      const cleanTitle = cleanEventTitle(rawTitle);
      const cleanCity = (event.address_city || "ch").toLowerCase().trim();

      // Der Schlüssel ist jetzt der bereinigte Titel + Stadt
      const key = `${cleanTitle}_${cleanCity}`;

      if (!groupedMap.has(key)) {
        // Neues Event
        groupedMap.set(key, { ...event, allDates: [event.start_date] });
      } else {
        // Existierendes Event -> Wir fügen das Datum hinzu
        const existing = groupedMap.get(key);
        existing.allDates.push(event.start_date);

        // Wir nehmen das Bild vom neuen Event, falls das alte keins hat
        if (!existing.image_url && event.image_url) {
          existing.image_url = event.image_url;
        }

        // Datum updaten (Zeitraum bilden)
        const sortedDates = existing.allDates.sort();
        existing.start_date = sortedDates[0];
        existing.end_date = sortedDates[sortedDates.length - 1];
        existing.is_range = true; // Wichtig für Frontend
      }
    });

    // Zurück in Array wandeln
    let finalEvents = Array.from(groupedMap.values());

    // 2. Radius Filter (Exakt)
    if (city && radius > 0 && cityLat && cityLng) {
      finalEvents = finalEvents.filter((event) => {
        // Wenn Koordinaten fehlen, nehmen wir Textsuche als Fallback
        if (!event.latitude || !event.longitude) {
          return (event.address_city || "").toLowerCase().includes(city.toLowerCase());
        }
        const d = haversineDistance(cityLat, cityLng, event.latitude, event.longitude);
        return d <= radius;
      });
    }

    // 3. Keywords & VIPs
    if (tags && tags.length > 0) {
      finalEvents = finalEvents.filter((e) => {
        const txt = (e.title + " " + (e.venue_name || "")).toLowerCase();
        return tags.some((tag: string) => {
          if (tag.includes("nightlife")) return /party|club|dj|dance/i.test(txt);
          if (tag.includes("romantisch")) return /romant|love|dinner/i.test(txt);
          if (tag.includes("familie")) return /kind|familie|zirkus/i.test(txt);
          return e.tags?.includes(tag);
        });
      });
    }

    if (vipArtistsFilter && vipArtistsFilter.length > 0) {
      finalEvents = finalEvents.filter((e) =>
        vipArtistsFilter.some((a: string) => e.title?.toLowerCase().includes(a.toLowerCase())),
      );
    }

    // Pagination
    const total = finalEvents.length;
    finalEvents = finalEvents.slice(offset, offset + limit);

    // Extras laden
    let taxonomy: any[] = [];
    let vipArtists: any[] = [];
    if (initialLoad) {
      const { data: tax } = await supabase.from("taxonomy").select("id, name, type, parent_id");
      taxonomy = tax || [];
      const { data: vips } = await supabase.from("vip_artists").select("artists_name").limit(200);
      vipArtists = vips?.map((a) => a.artists_name).filter(Boolean) || [];
    }

    return new Response(
      JSON.stringify({
        events: finalEvents,
        taxonomy,
        vipArtists,
        pagination: { offset, limit, total, hasMore: offset + limit < total },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
