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
    } = filters;

    const externalUrl = Deno.env.get("Supabase_URL");
    const externalKey = Deno.env.get("Supabase_ANON_KEY");
    if (!externalUrl || !externalKey) throw new Error("Missing secrets");

    const supabase = createClient(externalUrl, externalKey);

    // 1. WICHTIG: Wir laden wieder '*' (ALLES), damit Descriptions und Bilder da sind!
    // Wir laden 600 Stück, um genug Material für das Grouping zu haben.
    let query = supabase.from("events").select("*", { count: "exact" });

    // --- SQL FILTER ---
    if (searchQuery?.trim()) {
      const s = `%${searchQuery.trim()}%`;
      query = query.or(`title.ilike.${s},venue_name.ilike.${s},address_city.ilike.${s}`);
    }
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

    // Sortierung nach Datum
    query = query.order("start_date", { ascending: true }).limit(600);

    const { data, error } = await query;
    if (error) throw error;

    let rawData = data || [];

    // --- DIE WEICHE: Ticketmaster vs. MySwitzerland ---

    const mysEvents: any[] = [];
    const tmGroupMap = new Map();

    rawData.forEach((event) => {
      // Zuerst: Checken ob das Event überhaupt den Filter-Kriterien (Radius/Tags) entspricht
      let keep = true;

      // Radius Check (JS)
      if (city && radius > 0 && cityLat && cityLng) {
        if (event.latitude && event.longitude) {
          const d = haversineDistance(cityLat, cityLng, event.latitude, event.longitude);
          if (d > radius) keep = false;
        } else {
          if (!(event.address_city || "").toLowerCase().includes(city.toLowerCase())) keep = false;
        }
      }

      // Keyword Check
      if (keep && tags && tags.length > 0) {
        const txt = (
          event.title +
          " " +
          (event.description || "") +
          " " +
          (event.tags ? event.tags.join(" ") : "")
        ).toLowerCase();
        const matches = tags.some((tag: string) => {
          if (tag.includes("nightlife")) return /party|club|dj|dance|feiern/i.test(txt);
          if (tag.includes("romantisch")) return /romant|love|dinner|candle/i.test(txt);
          if (tag.includes("familie")) return /kind|familie|zirkus/i.test(txt);
          return event.tags?.includes(tag);
        });
        if (!matches) keep = false;
      }

      if (!keep) return; // Event fliegt raus

      // --- HIER IST DIE LOGIK FÜR SARAH CONNOR ---
      const isTicketmaster = event.external_id && event.external_id.startsWith("tm_");

      if (!isTicketmaster) {
        // MySwitzerland & Co: SOFORT ÜBERNEHMEN (Kein Grouping)
        mysEvents.push(event);
      } else {
        // Ticketmaster: GRUPPIEREN
        // Wir gruppieren nur exakt gleichen Titel in gleicher Stadt
        const key = `${event.title.trim().toLowerCase()}_${(event.address_city || "").trim().toLowerCase()}`;

        if (!tmGroupMap.has(key)) {
          // Das erste Mal, dass wir Sarah Connor sehen
          tmGroupMap.set(key, {
            ...event,
            date_list: [event.start_date],
          });
        } else {
          // Das zweite Mal (anderer Tag): Wir updaten nur das Datum
          const existing = tmGroupMap.get(key);
          existing.date_list.push(event.start_date);

          // Wir nehmen das Bild vom neuen Event, falls das alte keins hat
          if (!existing.image_url && event.image_url) existing.image_url = event.image_url;

          // Datum sortieren (Erstes bis Letztes)
          const dates = existing.date_list.sort();
          existing.start_date = dates[0];
          existing.end_date = dates[dates.length - 1];

          // Nur wenn Start != Ende ist es eine Range
          if (existing.start_date !== existing.end_date) {
            existing.is_range = true;
          }
        }
      }
    });

    // Ticketmaster Map auflösen
    const tmEvents = Array.from(tmGroupMap.values());

    // Beide Listen zusammenfügen
    let finalEvents = [...mysEvents, ...tmEvents];

    // Nochmal final nach Datum sortieren
    finalEvents.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    // Paginierung: Jetzt schneiden wir die 50 Stück ab
    const total = finalEvents.length;
    finalEvents = finalEvents.slice(offset, offset + limit);

    // Extras laden
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
