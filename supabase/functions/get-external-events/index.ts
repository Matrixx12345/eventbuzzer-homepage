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
    } = filters;

    const externalUrl = Deno.env.get("Supabase_URL");
    const externalKey = Deno.env.get("Supabase_ANON_KEY");

    if (!externalUrl || !externalKey) throw new Error("Missing secrets");

    const supabase = createClient(externalUrl, externalKey);

    // 1. DATEN LADEN
    // Wir laden 800 Events (statt 50), damit wir Duplikate finden können, die zeitlich auseinander liegen.
    // Wir laden "*" (ALLES), damit Bilder und AI-Beschreibungen da sind.
    let query = supabase.from("events").select("*", { count: "exact" });

    // --- 2. SQL FILTER (Die Basis-Filterung in der Datenbank) ---

    // Suche
    if (searchQuery?.trim()) {
      const s = `%${searchQuery.trim()}%`;
      query = query.or(`title.ilike.${s},venue_name.ilike.${s},address_city.ilike.${s}`);
    }

    // Stadt (Grob-Filter, Feinheit macht JS)
    if (city && (!radius || radius === 0)) {
      query = query.or(`address_city.ilike.%${city}%,location.ilike.%${city}%`);
    }

    // Kategorien
    if (categoryId) query = query.eq("category_main_id", categoryId);
    if (subcategoryId) query = query.eq("category_sub_id", subcategoryId);

    // Preis-Filter (WICHTIG: War im Original drin, muss hier auch rein)
    if (priceTier) {
      if (priceTier === "gratis")
        query = query.or("price_from.eq.0,price_label.ilike.%kostenlos%,price_label.ilike.%gratis%");
      else if (priceTier === "$") query = query.or("price_label.eq.$,and(price_from.gt.0,price_from.lte.50)");
      else if (priceTier === "$$") query = query.or("price_label.eq.$$,and(price_from.gt.50,price_from.lte.120)");
      else if (priceTier === "$$$") query = query.or("price_label.eq.$$$,price_from.gt.120");
    }

    // Zeit-Filter
    const now = new Date();
    if (timeFilter === "now") {
      query = query
        .gte("start_date", now.toISOString())
        .lte("start_date", new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString());
    } else if (timeFilter === "today") {
      query = query
        .gte("start_date", now.toISOString())
        .lte("start_date", new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString());
    } else if (timeFilter === "tomorrow") {
      const tmr = new Date(now);
      tmr.setDate(tmr.getDate() + 1);
      query = query
        .gte("start_date", new Date(tmr.setHours(0, 0, 0, 0)).toISOString())
        .lte("start_date", new Date(tmr.setHours(23, 59, 59, 999)).toISOString());
    } else if (timeFilter === "thisWeek") {
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
    if (singleDate) {
      const d = new Date(singleDate);
      query = query
        .gte("start_date", new Date(d.setHours(0, 0, 0, 0)).toISOString())
        .lte("start_date", new Date(d.setHours(23, 59, 59, 999)).toISOString());
    }

    // Sortierung und Limit
    query = query.order("start_date", { ascending: true }).limit(800);

    const { data, error } = await query;
    if (error) throw error;

    let rawEvents = data || [];

    // --- 3. JAVASCRIPT LOGIK (Grouping & Fein-Filter) ---

    const finalEvents: any[] = [];
    const tmGroupMap = new Map(); // Speicher für Ticketmaster-Gruppen

    for (const event of rawEvents) {
      // A. Radius Check
      if (city && radius > 0 && cityLat && cityLng && event.latitude && event.longitude) {
        const d = haversineDistance(cityLat, cityLng, event.latitude, event.longitude);
        if (d > radius) continue; // Überspringen wenn zu weit weg
      }

      // B. Keyword/Tag Check
      if (tags && tags.length > 0) {
        const txt = `${event.title} ${event.short_description || ""} ${event.venue_name || ""}`.toLowerCase();
        const matches = tags.some((tag: string) => {
          if (tag.includes("nightlife")) return /party|club|dj|disco|bar|nacht/i.test(txt);
          if (tag.includes("romantisch")) return /romant|liebe|love|date|candle|dinner/i.test(txt);
          if (tag.includes("familie")) return /kind|familie|zoo|kids|märchen|spiel/i.test(txt);
          return event.tags?.includes(tag);
        });
        if (!matches) continue;
      }

      // C. VIP Artists Check
      if (vipArtistsFilter?.length > 0) {
        const isVip = vipArtistsFilter.some((artist: string) =>
          event.title?.toLowerCase().includes(artist.toLowerCase()),
        );
        if (!isVip) continue;
      }

      // D. DIE WEICHE (GROUPING)
      const isTicketmaster = event.external_id && event.external_id.startsWith("tm_");

      if (!isTicketmaster) {
        // MySwitzerland & Co: SOFORT ÜBERNEHMEN (Kein Grouping, keine Veränderung)
        finalEvents.push(event);
      } else {
        // Ticketmaster: PRÜFEN OB DOPPELT
        // Wir nutzen Titel + Stadt (lowercase) als Schlüssel
        const key = `${(event.title || "").trim().toLowerCase()}_${(event.address_city || "").trim().toLowerCase()}`;

        if (!tmGroupMap.has(key)) {
          // Neues Ticketmaster Event gefunden -> Merken
          // Wir speichern eine temporäre Liste aller Datumswerte (_all_dates)
          tmGroupMap.set(key, {
            ...event,
            _all_dates: [event.start_date],
          });
        } else {
          // Duplikat gefunden! (Gleicher Titel, gleiche Stadt)
          const existing = tmGroupMap.get(key);

          // Datum zur Liste hinzufügen
          existing._all_dates.push(event.start_date);

          // Sortieren
          existing._all_dates.sort();

          // Startdatum bleibt das allererste, Enddatum wird das allerletzte
          existing.start_date = existing._all_dates[0];
          existing.end_date = existing._all_dates[existing._all_dates.length - 1];

          // Markierung setzen
          existing.is_range = true;

          // Falls das neue Event ein Bild hat und das alte nicht, Bild übernehmen
          if (!existing.image_url && event.image_url) existing.image_url = event.image_url;
        }
      }
    }

    // Ticketmaster Gruppen auflösen und zur Liste hinzufügen
    const groupedTM = Array.from(tmGroupMap.values());
    // Hilfsfeld _all_dates löschen vor dem Senden
    groupedTM.forEach((e) => delete e._all_dates);

    // Alles zusammenfügen
    const allCombined = [...finalEvents, ...groupedTM];

    // 4. SORTIEREN & PAGINIEREN
    // Nach Datum sortieren
    allCombined.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    const totalCount = allCombined.length;
    // Hier schneiden wir die 50 Stück für den Browser ab
    const paginatedEvents = allCombined.slice(offset, offset + limit);

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
        events: paginatedEvents,
        taxonomy,
        vipArtists,
        pagination: {
          offset,
          limit,
          total: totalCount,
          hasMore: offset + limit < totalCount,
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

// Helper: Distanz
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
