import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS Preflight
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

    const externalSupabase = createClient(externalUrl, externalKey);

    // Wir laden mehr Events (400), um sie danach zu gruppieren.
    // Erst nach dem Gruppieren schneiden wir auf 'limit' (50) zu.
    const hasComplexFilters = (radius && radius > 0) || vipArtistsFilter?.length > 0 || tags?.length > 0;
    const fetchLimit = hasComplexFilters ? 400 : 200;

    let query = externalSupabase.from("events").select("*", { count: "exact" });

    // --- 1. SQL VOR-FILTERUNG ---
    if (searchQuery?.trim()) {
      const s = `%${searchQuery.trim()}%`;
      query = query.or(`title.ilike.${s},venue_name.ilike.${s},address_city.ilike.${s}`);
    }
    // Stadt-Filter nur, wenn Radius 0 ist (sonst macht das JS)
    if (city && (!radius || radius === 0)) {
      query = query.or(`address_city.ilike.%${city}%,location.ilike.%${city}%`);
    }
    if (categoryId) query = query.eq("category_main_id", categoryId);
    if (subcategoryId) query = query.eq("category_sub_id", subcategoryId);

    if (priceTier) {
      if (priceTier === "gratis")
        query = query.or("price_from.eq.0,price_label.ilike.%kostenlos%,price_label.ilike.%gratis%");
      else if (priceTier === "$") query = query.or("price_label.eq.$,and(price_from.gt.0,price_from.lte.50)");
      else if (priceTier === "$$") query = query.or("price_label.eq.$$,and(price_from.gt.50,price_from.lte.120)");
      else if (priceTier === "$$$") query = query.or("price_label.eq.$$$,price_from.gt.120");
    }

    // Zeit-Logik
    const now = new Date();
    if (timeFilter) {
      if (timeFilter === "now")
        query = query
          .gte("start_date", now.toISOString())
          .lte("start_date", new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString());
      else if (timeFilter === "today")
        query = query
          .gte("start_date", now.toISOString())
          .lte("start_date", new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString());
      else if (timeFilter === "tomorrow") {
        const tmr = new Date(now);
        tmr.setDate(tmr.getDate() + 1);
        query = query
          .gte("start_date", new Date(tmr.setHours(0, 0, 0, 0)).toISOString())
          .lte("start_date", new Date(tmr.setHours(23, 59, 59, 999)).toISOString());
      } else if (timeFilter === "thisWeek") {
        // Wochenende
        const day = now.getDay();
        const dist = (6 - day + 7) % 7 || 7;
        const sat = new Date(now);
        sat.setDate(now.getDate() + dist);
        const sun = new Date(sat);
        sun.setDate(sat.getDate() + 1);
        query = query
          .gte("start_date", new Date(sat.setHours(0, 0, 0, 0)).toISOString())
          .lte("start_date", new Date(sun.setHours(23, 59, 59, 999)).toISOString());
      }
    }
    if (singleDate) {
      const d = new Date(singleDate);
      query = query
        .gte("start_date", new Date(d.setHours(0, 0, 0, 0)).toISOString())
        .lte("start_date", new Date(d.setHours(23, 59, 59, 999)).toISOString());
    }

    // Sortierung & Limit
    query = query.order("start_date", { ascending: true }).limit(fetchLimit);

    const { data, error: queryError } = await query;
    if (queryError) throw queryError;

    let filteredData = data || [];

    // --- 2. JAVASCRIPT LOGIK (Radius, Keywords, Grouping) ---

    // A. Keywords
    if (tags?.length > 0) {
      filteredData = filteredData.filter((event) => {
        const txt =
          `${event.title} ${event.description || ""} ${event.short_description || ""} ${event.venue_name || ""}`.toLowerCase();
        return tags.some((tag: string) => {
          if (tag.includes("nightlife") || tag.includes("party"))
            return /party|club|dj|disco|bar|nacht|techno|dance/i.test(txt);
          if (tag.includes("romantisch")) return /romant|liebe|love|date|candle|dinner|piano|jazz/i.test(txt);
          if (tag.includes("familie") || tag.includes("kind"))
            return /kind|familie|zoo|kids|märchen|spiel|zirkus/i.test(txt);
          if (tag.includes("wellness")) return /wellness|spa|sauna|bad|relax|yoga/i.test(txt);
          if (tag.includes("natur")) return /natur|wandern|see|berg|park|aussicht|open air/i.test(txt);
          if (tag.includes("schlechtwetter")) return /indoor|museum|kino|theater|drinnen|halle/i.test(txt);
          return event.tags?.includes(tag);
        });
      });
    }

    // B. Radius
    if (city && radius > 0 && cityLat && cityLng) {
      filteredData = filteredData.filter((event) => {
        if (event.latitude && event.longitude) {
          const d = haversineDistance(cityLat, cityLng, event.latitude, event.longitude);
          return d <= radius;
        }
        // Fallback: Textsuche, falls keine Koordinaten
        return (event.address_city || "").toLowerCase().includes(city.toLowerCase());
      });
    }

    // C. Top Stars
    if (vipArtistsFilter?.length > 0) {
      filteredData = filteredData.filter((event) =>
        vipArtistsFilter.some((artist: string) => {
          const t = event.title?.toLowerCase() || "";
          const a = artist.toLowerCase();
          return t.includes(a);
        }),
      );
    }

    // --- D. GROUPING (ZUSAMMENFASSEN) ---
    // Hier passiert die Magie: Gleiche Events werden zu einem "Von-Bis" Event verschmolzen
    const groupedMap = new Map();
    filteredData.forEach((event) => {
      // Key: Titel + Stadt (ohne Leerzeichen, lowercase) als eindeutige ID
      const key = `${event.title}-${event.address_city || "CH"}`.toLowerCase().replace(/\s/g, "");

      if (!groupedMap.has(key)) {
        // Erstes Event dieser Art speichern
        groupedMap.set(key, { ...event, allDates: [event.start_date] });
      } else {
        // Dublette gefunden -> Datum zur Liste hinzufügen
        const existing = groupedMap.get(key);
        existing.allDates.push(event.start_date);

        // Start/Ende des Zeitraums berechnen
        const sortedDates = existing.allDates.filter(Boolean).sort();
        if (sortedDates.length > 1) {
          existing.start_date = sortedDates[0];
          existing.end_date = sortedDates[sortedDates.length - 1];
          existing.is_range = true; // Signal für das Frontend
        }
      }
    });

    let finalEvents = Array.from(groupedMap.values());
    const totalFiltered = finalEvents.length;

    // --- 3. PAGINIERUNG (SLICE) ---
    // Erst jetzt schneiden wir die 50 Stück raus
    finalEvents = finalEvents.slice(offset, offset + limit);

    // Initial Load Zusatzinfos
    let taxonomy: any[] = [];
    let vipArtists: any[] = [];

    if (initialLoad) {
      const { data: tax } = await externalSupabase.from("taxonomy").select("id, name, type, parent_id").order("name");
      taxonomy = tax || [];
      const { data: vips } = await externalSupabase.from("vip_artists").select("artists_name");
      vipArtists = vips?.map((a) => a.artists_name).filter(Boolean) || [];
    }

    return new Response(
      JSON.stringify({
        events: finalEvents,
        taxonomy,
        vipArtists,
        pagination: {
          offset,
          limit,
          total: totalFiltered,
          hasMore: offset + limit < totalFiltered,
          fetched: finalEvents.length,
        },
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

// Helper: Haversine
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
