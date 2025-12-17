import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Hilfsfunktion: Macht Titel extrem vergleichbar (entfernt ALLES außer Buchstaben/Zahlen)
// "Mamma Mia! - Das Musical" -> "mammamiadasmusical"
function getNormalizationKey(text: string): string {
  if (!text) return "";
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
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
      singleDate,
    } = filters;

    const externalUrl = Deno.env.get("Supabase_URL");
    const externalKey = Deno.env.get("Supabase_ANON_KEY");
    if (!externalUrl || !externalKey) throw new Error("Missing secrets");

    const supabase = createClient(externalUrl, externalKey);

    // 1. DATEN LADEN (800 Stück für ausreichend "Futter" zum Gruppieren)
    let query = supabase.from("events").select("*", { count: "exact" });

    // SQL Filter
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
    if (timeFilter === "now") {
      query = query
        .gte("start_date", now.toISOString())
        .lte("start_date", new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString());
    } else if (timeFilter === "today") {
      query = query
        .gte("start_date", now.toISOString())
        .lte("start_date", new Date(now.setHours(23, 59, 59)).toISOString());
    } else if (timeFilter === "tomorrow") {
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

    // Sortierung
    query = query.order("start_date", { ascending: true }).limit(800);

    const { data, error } = await query;
    if (error) throw error;

    let rawEvents = data || [];

    // --- 2. DIE WEICHE (LOGIK) ---

    const finalEvents: any[] = [];
    const tmGroupMap = new Map();

    for (const event of rawEvents) {
      // Radius Check
      if (city && radius > 0 && cityLat && cityLng && event.latitude && event.longitude) {
        const d = haversineDistance(cityLat, cityLng, event.latitude, event.longitude);
        if (d > radius) continue;
      }

      // Check: Ist es Ticketmaster? (Checkt auf 'tm' am Anfang, um 'tm_' und 'tm-' zu fangen)
      const isTicketmaster = event.external_id && event.external_id.startsWith("tm");

      if (!isTicketmaster) {
        // MySwitzerland & Co: SOFORT ÜBERNEHMEN
        finalEvents.push(event);
      } else {
        // Ticketmaster: GRUPPIEREN
        // Wir nutzen den "gereinigten" Titel + Stadt als Schlüssel
        const titleKey = getNormalizationKey(event.title || "");
        const cityKey = getNormalizationKey(event.address_city || "");
        const key = `${titleKey}_${cityKey}`;

        if (!tmGroupMap.has(key)) {
          // Neues Ticketmaster Event -> Merken
          tmGroupMap.set(key, {
            ...event,
            _all_dates: [event.start_date],
          });
        } else {
          // Duplikat gefunden!
          const existing = tmGroupMap.get(key);
          existing._all_dates.push(event.start_date);

          // Datum sortieren & Range setzen
          existing._all_dates.sort();
          existing.start_date = existing._all_dates[0];
          existing.end_date = existing._all_dates[existing._all_dates.length - 1];
          existing.is_range = true;

          // Besseres Bild behalten
          if (!existing.image_url && event.image_url) existing.image_url = event.image_url;
        }
      }
    }

    // Ticketmaster Gruppen auflösen
    const groupedTM = Array.from(tmGroupMap.values());
    groupedTM.forEach((e) => delete e._all_dates); // Aufräumen

    // Alles zusammenfügen
    const allCombined = [...finalEvents, ...groupedTM];

    // 3. SORTIEREN & PAGINIEREN
    // WICHTIG: Nach Datum sortieren, damit die Liste chronologisch stimmt
    allCombined.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    const totalCount = allCombined.length;
    // 50 Stück abschneiden
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
