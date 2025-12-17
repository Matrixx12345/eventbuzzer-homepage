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
    } = filters;

    const externalSupabase = createClient(Deno.env.get("Supabase_URL")!, Deno.env.get("Supabase_ANON_KEY")!);

    // Wir laden 400 Events als Puffer für das Grouping
    const hasComplexFilters = radius > 0 || vipArtistsFilter?.length > 0 || tags?.length > 0;
    const fetchLimit = hasComplexFilters ? 400 : 100;

    let query = externalSupabase.from("events").select("*", { count: "exact" });

    // --- SQL FILTER ---
    if (searchQuery?.trim()) {
      const s = `%${searchQuery.trim()}%`;
      query = query.or(`title.ilike.${s},venue_name.ilike.${s},address_city.ilike.${s}`);
    }
    if (city && (!radius || radius === 0)) {
      query = query.or(`address_city.ilike.%${city}%,location.ilike.%${city}%`);
    }
    if (categoryId) query = query.eq("category_main_id", categoryId);

    // Sortierung: Neueste zuerst
    query = query.order("start_date", { ascending: true });
    const { data, error: queryError, count } = await query.limit(fetchLimit);
    if (queryError) throw queryError;

    let filteredData = data || [];

    // --- JAVASCRIPT LOGIK: Radius & Keywords ---
    if (tags?.length > 0) {
      filteredData = filteredData.filter((event) => {
        const txt = `${event.title} ${event.short_description || ""}`.toLowerCase();
        return tags.some((tag: string) => {
          if (tag.includes("nightlife")) return /party|club|dj|disco|bar|nacht/i.test(txt);
          if (tag.includes("romantisch")) return /romant|liebe|love|date|candle|dinner/i.test(txt);
          if (tag.includes("familie")) return /kind|familie|zoo|kids|märchen|spiel/i.test(txt);
          return event.tags?.includes(tag);
        });
      });
    }

    if (city && radius > 0 && cityLat && cityLng) {
      filteredData = filteredData.filter((event) => {
        if (event.latitude && event.longitude) {
          const dLat = ((event.latitude - cityLat) * Math.PI) / 180;
          const dLng = ((event.longitude - cityLng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((cityLat * Math.PI) / 180) * Math.cos((event.latitude * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
          const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return dist <= radius;
        }
        return (event.address_city || "").toLowerCase().includes(city.toLowerCase());
      });
    }

    if (vipArtistsFilter?.length > 0) {
      filteredData = filteredData.filter((event) =>
        vipArtistsFilter.some((artist: string) => event.title?.toLowerCase().includes(artist.toLowerCase())),
      );
    }

    // --- NEU: DUBLETTEN ZUSAMMENFASSEN (GROUPING) ---
    const groupedMap = new Map();
    filteredData.forEach((event) => {
      // Wir gruppieren nach Name + Stadt (damit Basel und Zürich getrennt bleiben)
      const key = `${event.title}-${event.address_city || "CH"}`.toLowerCase().replace(/\s/g, "");

      if (!groupedMap.has(key)) {
        groupedMap.set(key, { ...event, allDates: [event.start_date] });
      } else {
        const existing = groupedMap.get(key);
        existing.allDates.push(event.start_date);
        // Datum updaten auf Zeitraum
        const sortedDates = existing.allDates.filter(Boolean).sort();
        if (sortedDates.length > 1) {
          existing.start_date = sortedDates[0];
          existing.end_date = sortedDates[sortedDates.length - 1];
          // Markierung für das Frontend, dass dies ein Zeitraum ist
          existing.is_range = true;
        }
      }
    });

    let finalEvents = Array.from(groupedMap.values());
    const totalFiltered = finalEvents.length;

    // Paginierung (Slice)
    finalEvents = finalEvents.slice(offset, offset + limit);

    // Initial Load Zusatzinfos
    let taxonomy = [],
      vipArtists = [];
    if (initialLoad) {
      const { data: tax } = await externalSupabase.from("taxonomy").select("id, name, type, parent_id");
      taxonomy = tax || [];
      const { data: vips } = await externalSupabase.from("vip_artists").select("artists_name");
      vipArtists = vips?.map((a) => a.artists_name).filter(Boolean) || [];
    }

    return new Response(
      JSON.stringify({
        events: finalEvents,
        taxonomy,
        vipArtists,
        pagination: { offset, limit, total: totalFiltered, hasMore: offset + limit < totalFiltered },
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
