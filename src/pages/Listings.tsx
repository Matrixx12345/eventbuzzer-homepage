import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const offset = body.offset || 0;
    const limit = body.limit || 50;
    const initialLoad = body.initialLoad ?? true;

    const filters = body.filters || {};
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
      dateFrom,
      dateTo,
      singleDate,
      source,
      tags,
      availability,
      vipArtistsFilter,
    } = filters;

    const externalUrl = Deno.env.get("Supabase_URL");
    const externalKey = Deno.env.get("Supabase_ANON_KEY");

    if (!externalUrl || !externalKey) throw new Error("Missing secrets");

    const externalSupabase = createClient(externalUrl, externalKey);

    // PERFORMANCE-TUNING:
    // Wir senken das Limit von 1000 auf 350.
    // Das ist genug "Tiefe" für gute Suchergebnisse, aber deutlich schneller.
    const hasComplexFilters =
      (radius && radius > 0) || (vipArtistsFilter && vipArtistsFilter.length > 0) || (tags && tags.length > 0);
    const fetchLimit = hasComplexFilters ? 350 : limit;

    let query = externalSupabase.from("events").select("*", { count: "exact" });

    // --- 1. SQL BASIS FILTER ---

    if (searchQuery && searchQuery.trim()) {
      const search = `%${searchQuery.trim()}%`;
      query = query.or(
        `title.ilike.${search},venue_name.ilike.${search},address_city.ilike.${search},location.ilike.${search}`,
      );
    }

    if (city && (!radius || radius === 0)) {
      query = query.or(`address_city.ilike.%${city}%,location.ilike.%${city}%`);
    }

    if (categoryId !== null && categoryId !== undefined) query = query.eq("category_main_id", categoryId);
    if (subcategoryId !== null && subcategoryId !== undefined) query = query.eq("category_sub_id", subcategoryId);

    if (priceTier) {
      if (priceTier === "gratis")
        query = query.or("price_from.eq.0,price_label.ilike.%kostenlos%,price_label.ilike.%gratis%");
      else if (priceTier === "$") query = query.or("price_label.eq.$,and(price_from.gt.0,price_from.lte.50)");
      else if (priceTier === "$$") query = query.or("price_label.eq.$$,and(price_from.gt.50,price_from.lte.120)");
      else if (priceTier === "$$$") query = query.or("price_label.eq.$$$,price_from.gt.120");
    }

    // Zeit-Filter
    const now = new Date();
    if (timeFilter) {
      if (timeFilter === "now") {
        const fourHoursLater = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
        query = query.gte("start_date", now.toISOString()).lte("start_date", fourHoursLater);
      } else if (timeFilter === "today") {
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
        query = query.gte("start_date", now.toISOString()).lte("start_date", todayEnd);
      } else if (timeFilter === "tomorrow") {
        const tmr = new Date(now);
        tmr.setDate(tmr.getDate() + 1);
        const tmrStart = new Date(tmr.getFullYear(), tmr.getMonth(), tmr.getDate()).toISOString();
        const tmrEnd = new Date(tmr.getFullYear(), tmr.getMonth(), tmr.getDate(), 23, 59, 59).toISOString();
        query = query.gte("start_date", tmrStart).lte("start_date", tmrEnd);
      } else if (timeFilter === "thisWeek") {
        const day = now.getDay();
        const dist = (6 - day + 7) % 7 || 7;
        const sat = new Date(now);
        sat.setDate(now.getDate() + dist);
        const satStart = new Date(sat.getFullYear(), sat.getMonth(), sat.getDate()).toISOString();
        const sun = new Date(sat);
        sun.setDate(sat.getDate() + 1);
        const sunEnd = new Date(sun.getFullYear(), sun.getMonth(), sun.getDate(), 23, 59, 59).toISOString();
        query = query.gte("start_date", satStart).lte("start_date", sunEnd);
      }
    }

    if (singleDate) {
      const d = new Date(singleDate);
      const s = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
      const e = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).toISOString();
      query = query.gte("start_date", s).lte("start_date", e);
    }
    if (dateFrom) query = query.gte("start_date", new Date(dateFrom).toISOString());
    if (dateTo) query = query.lte("start_date", new Date(dateTo).toISOString());

    if (availability) {
      const month = now.getMonth() + 1;
      if (availability === "now") query = query.contains("available_months", [month]);
      else if (availability === "yearround" || availability === "year-round") {
        query = query.contains("available_months", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      }
    }

    // --- LADEN ---
    if (!hasComplexFilters) {
      query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
    } else {
      query = query.order("created_at", { ascending: false }).limit(fetchLimit);
    }

    const { data, error: queryError, count } = await query;
    if (queryError) throw new Error(queryError.message);

    let filteredData = data || [];
    let totalFiltered = count || 0;

    // --- 2. INTELLIGENTE FILTER ---

    // A. Keywords (Nightlife, Romantik, etc.)
    if (tags && tags.length > 0) {
      filteredData = filteredData.filter((event) => {
        const textToCheck =
          `${event.title} ${event.description || ""} ${event.short_description || ""} ${event.venue_name || ""}`.toLowerCase();

        return tags.some((tag: string) => {
          if (tag === "nightlife-party" || tag === "afterwork" || tag === "rooftop-aussicht")
            return /party|club|dj|techno|house|dance|disco|bar|pub|night|nacht|feiern|tanzen/i.test(textToCheck);
          if (tag === "romantisch-date")
            return /romanti|liebe|love|candle|dinner|piano|jazz|sunset|ballett|oper|klassik|paare|date/i.test(
              textToCheck,
            );
          if (tag === "familie-kinder" || tag === "kleinkinder" || tag === "schulkinder")
            return /kind|familie|family|zoo|zirkus|circus|märchen|puppet|figuren|jugend|kids|spiel|basteln/i.test(
              textToCheck,
            );
          if (tag === "wellness-selfcare")
            return /wellness|spa|yoga|massage|sauna|relax|entspannung|gesundheit|bad|therme/i.test(textToCheck);
          if (tag === "natur-erlebnisse" || tag === "open-air")
            return /natur|nature|wandern|hike|berg|see|park|garden|wald|open air|draussen|aussicht/i.test(textToCheck);
          if (tag === "schlechtwetter-indoor")
            return /indoor|drinnen|museum|theater|kino|cinema|halle|saal|ausstellung/i.test(textToCheck);
          // Fallback: DB Tags
          return event.tags && event.tags.includes(tag);
        });
      });
    }

    // B. Radius
    if (city && radius && radius > 0 && cityLat && cityLng) {
      filteredData = filteredData.filter((event) => {
        if (event.latitude && event.longitude) {
          const dist = haversineDistance(cityLat, cityLng, event.latitude, event.longitude);
          return dist <= radius;
        }
        const txt = (event.address_city || event.location || "").toLowerCase();
        return txt.includes(city.toLowerCase());
      });
    }

    // C. Top Stars (VIP Artists)
    if (vipArtistsFilter && vipArtistsFilter.length > 0) {
      filteredData = filteredData.filter((event) => {
        const title = (event.title || "").toLowerCase();
        // Optimierung: Findet den ersten Match und bricht dann ab (schneller)
        return vipArtistsFilter.some((artist: string) => {
          if (!artist || artist.length < 3) return false;
          const a = artist.toLowerCase().trim();
          if (title.startsWith(a)) return true;
          return title.includes(a); // Einfaches includes ist schneller als Regex
        });
      });
    }

    // Paginierung
    if (hasComplexFilters) {
      totalFiltered = filteredData.length;
      const start = offset;
      const end = offset + limit;
      filteredData = filteredData.slice(start, end);
    }

    let taxonomy: any[] = [];
    let vipArtists: any[] = [];

    if (initialLoad) {
      const { data: tax } = await externalSupabase.from("taxonomy").select("id, name, type, parent_id").order("name");
      taxonomy = tax || [];
      const { data: vips } = await externalSupabase.from("vip_artists").select("artists_name");
      vipArtists = vips?.map((a) => a.artists_name).filter(Boolean) || [];
    }

    const hasMore = offset + filteredData.length < totalFiltered;
    const nextOffset = offset + filteredData.length;

    return new Response(
      JSON.stringify({
        events: filteredData,
        taxonomy,
        vipArtists,
        pagination: { offset, limit, fetched: filteredData.length, total: totalFiltered, hasMore, nextOffset },
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
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
