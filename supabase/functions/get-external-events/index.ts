import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
      singleDate,
      dateFrom,
      dateTo,
      availability,
      source,
    } = filters;

    const externalUrl = Deno.env.get("Supabase_URL");
    const externalKey = Deno.env.get("Supabase_ANON_KEY");
    if (!externalUrl || !externalKey) throw new Error("Missing secrets");

    const supabase = createClient(externalUrl, externalKey);

    // SPEED-FIX: Wir laden nur die Spalten, die wir für die Kacheln brauchen.
    // Keine 'description' oder 'content', das verstopft die Leitung!
    let query = supabase
      .from("events")
      .select(
        "id, title, start_date, end_date, venue_name, address_city, image_url, price_from, price_to, price_label, latitude, longitude, tags, category_main_id, category_sub_id, external_id, available_months",
        { count: "exact" },
      );

    // --- 1. SQL FILTER (Datenbank macht die Arbeit) ---
    if (searchQuery?.trim()) {
      const s = `%${searchQuery.trim()}%`;
      query = query.or(`title.ilike.${s},venue_name.ilike.${s},address_city.ilike.${s}`);
    }

    // Radius-Vorbereitung: Wenn Radius an ist, suchen wir grob in der Datenbank vor
    if (city && radius > 0 && cityLat && cityLng) {
      // Grobe "Box" Suche in der DB (schneller als exakte Berechnung)
      // ca. 1 Grad ~ 111km. Wir nehmen einen Puffer.
      const degreeDelta = (radius + 20) / 111;
      query = query
        .gte("latitude", cityLat - degreeDelta)
        .lte("latitude", cityLat + degreeDelta)
        .gte("longitude", cityLng - degreeDelta)
        .lte("longitude", cityLng + degreeDelta);
    } else if (city) {
      query = query.or(`address_city.ilike.%${city}%,location.ilike.%${city}%`);
    }

    if (categoryId) query = query.eq("category_main_id", categoryId);
    if (subcategoryId) query = query.eq("category_sub_id", subcategoryId);

    // Zeit-Filter (SQL)
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

    // Wir laden max 250 Events für die Nachbearbeitung (schneller als 400)
    query = query.order("start_date", { ascending: true }).limit(250);

    const { data, error, count } = await query;
    if (error) throw error;

    let filteredData = data || [];

    // --- 2. JAVASCRIPT FEIN-TUNING ---

    // A. Strenges Grouping (Zusammenfassen)
    const groupedMap = new Map();

    filteredData.forEach((event) => {
      if (!event.title) return;

      // Wir bereinigen den Titel extrem, um Varianten zu finden
      // "Taylor Swift | Eras Tour" -> "taylorswift"
      // "Zirkus Knie - Nachmittag" -> "zirkusknie"
      const cleanTitle = event.title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .substring(0, 15);
      const cleanCity = (event.address_city || "ch").toLowerCase().trim();
      const key = `${cleanTitle}_${cleanCity}`;

      if (!groupedMap.has(key)) {
        groupedMap.set(key, { ...event, allDates: [event.start_date] });
      } else {
        const existing = groupedMap.get(key);
        existing.allDates.push(event.start_date);

        // Zeitraum updaten
        const sorted = existing.allDates.sort();
        existing.start_date = sorted[0];
        existing.end_date = sorted[sorted.length - 1];
        existing.is_range = true;
      }
    });

    let finalEvents = Array.from(groupedMap.values());

    // B. Exakter Radius Check (nur für die übrig gebliebenen)
    if (city && radius > 0 && cityLat && cityLng) {
      finalEvents = finalEvents.filter((event) => {
        if (!event.latitude || !event.longitude) {
          // RETTUNG: Wenn keine Koords da sind, aber die Stadt stimmt -> behalten!
          return (event.address_city || "").toLowerCase().includes(city.toLowerCase());
        }
        const d = haversineDistance(cityLat, cityLng, event.latitude, event.longitude);
        return d <= radius;
      });
    }

    // C. Keywords (Tagging)
    if (tags && tags.length > 0) {
      finalEvents = finalEvents.filter((event) => {
        const txt = (event.title + " " + (event.venue_name || "")).toLowerCase();
        return tags.some((tag: string) => {
          if (tag.includes("nightlife")) return /party|club|dj|dance/i.test(txt);
          if (tag.includes("romantisch")) return /romant|love|dinner/i.test(txt);
          if (tag.includes("familie")) return /kind|familie|zirkus/i.test(txt);
          return event.tags?.includes(tag);
        });
      });
    }

    // Pagination
    const total = finalEvents.length;
    finalEvents = finalEvents.slice(offset, offset + limit);

    // Initial Load Extras
    let taxonomy: any[] = [];
    let vipArtists: any[] = [];
    if (initialLoad) {
      const { data: tax } = await supabase.from("taxonomy").select("id, name, type, parent_id");
      taxonomy = tax || [];
      const { data: vips } = await supabase.from("vip_artists").select("artists_name").limit(100);
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
