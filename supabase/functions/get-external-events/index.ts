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

    // WICHTIG: Wenn Radius oder VIP aktiv sind, laden wir mehr Daten (1000 statt 50),
    // damit wir JavaScript-Filter (Radius) auf eine größere Menge anwenden können.
    const hasComplexFilters = (radius && radius > 0) || (vipArtistsFilter && vipArtistsFilter.length > 0);
    const fetchLimit = hasComplexFilters ? 1000 : limit;

    let query = externalSupabase.from("events").select("*", { count: "exact" });

    // --- 1. SQL FILTER (Datenbank-Ebene) ---

    // Suche (Text)
    if (searchQuery && searchQuery.trim()) {
      const search = `%${searchQuery.trim()}%`;
      query = query.or(
        `title.ilike.${search},venue_name.ilike.${search},address_city.ilike.${search},location.ilike.${search}`,
      );
    }

    // Stadt (Text-Suche als Basis, falls Radius 0 oder leer)
    if (city && (!radius || radius === 0)) {
      query = query.or(`address_city.ilike.%${city}%,location.ilike.%${city}%`);
    }

    // Kategorien
    if (categoryId !== null && categoryId !== undefined) query = query.eq("category_main_id", categoryId);
    if (subcategoryId !== null && subcategoryId !== undefined) query = query.eq("category_sub_id", subcategoryId);

    // Preis
    if (priceTier) {
      if (priceTier === "gratis")
        query = query.or("price_from.eq.0,price_label.ilike.%kostenlos%,price_label.ilike.%gratis%");
      else if (priceTier === "$") query = query.or("price_label.eq.$,and(price_from.gt.0,price_from.lte.50)");
      else if (priceTier === "$$") query = query.or("price_label.eq.$$,and(price_from.gt.50,price_from.lte.120)");
      else if (priceTier === "$$$") query = query.or("price_label.eq.$$$,price_from.gt.120");
    }

    // Quelle
    if (source === "ticketmaster") query = query.like("external_id", "tm_%");
    else if (source === "myswitzerland") query = query.like("external_id", "mys_%");

    // Tags
    if (tags && tags.length > 0) query = query.overlaps("tags", tags);

    // Zeit
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

    // Verfügbarkeit (Ganzjährig etc.)
    if (availability) {
      const month = now.getMonth() + 1;
      if (availability === "now") query = query.contains("available_months", [month]);
      else if (availability === "winter") query = query.overlaps("available_months", [11, 12, 1, 2, 3]);
      else if (availability === "summer") query = query.overlaps("available_months", [4, 5, 6, 7, 8, 9, 10]);
      // Hier korrigieren wir den Begriff für das Backend
      else if (availability === "yearround" || availability === "year-round") {
        query = query.contains("available_months", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      }
    }

    // Laden der Daten
    if (!hasComplexFilters) {
      // Normale Paginierung (schnell)
      query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
    } else {
      // Erweiterter Load für Radius-Suche (wir filtern gleich manuell)
      query = query.order("created_at", { ascending: false }).limit(fetchLimit);
    }

    const { data, error: queryError, count } = await query;
    if (queryError) throw new Error(queryError.message);

    let filteredData = data || [];
    let totalFiltered = count || 0;

    // --- 2. JAVASCRIPT FILTER (Nach dem Laden) ---

    // A. Radius Filter (Geografisch)
    if (city && radius && radius > 0 && cityLat && cityLng) {
      filteredData = filteredData.filter((event) => {
        // Hat das Event Koordinaten?
        if (event.latitude && event.longitude) {
          const dist = haversineDistance(cityLat, cityLng, event.latitude, event.longitude);
          return dist <= radius;
        }
        // Fallback: Wenn keine Koordinaten, prüfe Text
        const txt = (event.address_city || event.location || "").toLowerCase();
        return txt.includes(city.toLowerCase());
      });
    }

    // B. VIP Artists Filter
    if (vipArtistsFilter && vipArtistsFilter.length > 0) {
      filteredData = filteredData.filter((event) => {
        const title = (event.title || "").toLowerCase();
        return vipArtistsFilter.some((artist: string) => {
          if (!artist || artist.length < 3) return false;
          const a = artist.toLowerCase().trim();
          if (title.startsWith(a)) return true;
          const regex = new RegExp(`\\b${a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
          return regex.test(title);
        });
      });
    }

    // Falls wir 1000 geladen haben, müssen wir jetzt manuell "schneiden" (Paginieren)
    if (hasComplexFilters) {
      totalFiltered = filteredData.length;
      const start = offset;
      const end = offset + limit;
      filteredData = filteredData.slice(start, end);
    }

    // Zusatzdaten (Taxonomy/VIPs) nur beim ersten Laden
    // FIX: Explizite Typisierung hinzugefügt (any[])
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

// Mathe-Funktion für Radius (Haversine)
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Erdradius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
