import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Hilfsfunktion für den radikalen Ticketmaster-Abgleich
function superClean(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { offset = 0, limit = 50, initialLoad = true, filters = {} } = body;

    // ALLE DEINE BESTEHENDEN FILTER-VARIABLEN
    const {
      searchQuery,
      categoryId,
      subcategoryId,
      priceTier,
      source,
      city,
      radius,
      cityLat,
      cityLng,
      timeFilter,
      availability,
      singleDate,
      dateFrom,
      dateTo,
      tags,
      vipArtistsFilter,
    } = filters;

    const supabase = createClient(Deno.env.get("Supabase_URL")!, Deno.env.get("Supabase_ANON_KEY")!);

    // 1. DATEN LADEN (Erhöhtes Limit für Grouping-Futter)
    let query = supabase.from("events").select("*", { count: "exact" });

    // --- DEINE ORIGINAL SQL-FILTER (Mühsam erarbeitet) ---
    if (searchQuery?.trim()) {
      const s = `%${searchQuery.trim()}%`;
      query = query.or(`title.ilike.${s},venue_name.ilike.${s},address_city.ilike.${s}`);
    }

    if (categoryId) query = query.eq("category_main_id", categoryId);
    if (subcategoryId) query = query.eq("category_sub_id", subcategoryId);
    if (source) query = query.ilike("external_id", `${source}%`);

    // Preis-Logik wie besprochen
    if (priceTier) {
      if (priceTier === "gratis")
        query = query.or("price_from.eq.0,price_label.ilike.%kostenlos%,price_label.ilike.%gratis%");
      else if (priceTier === "$") query = query.lte("price_from", 50);
      else if (priceTier === "$$") query = query.gt("price_from", 50).lte("price_from", 120);
      else if (priceTier === "$$$") query = query.gt("price_from", 120);
    }

    // Zeit-Logik (Heute, Morgen, etc.)
    const now = new Date();
    if (timeFilter === "now") {
      query = query
        .gte("start_date", now.toISOString())
        .lte("start_date", new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString());
    } else if (timeFilter === "today") {
      query = query
        .gte("start_date", now.toISOString())
        .lte("start_date", new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString());
    } else if (singleDate) {
      const d = new Date(singleDate);
      query = query
        .gte("start_date", new Date(d.setHours(0, 0, 0, 0)).toISOString())
        .lte("start_date", new Date(d.setHours(23, 59, 59)).toISOString());
    }

    // Wir laden 1000 Stück, um Dubletten über Seiten hinweg zu finden
    const { data: rawEvents, error: dbError } = await query.order("start_date", { ascending: true }).limit(1000);
    if (dbError) throw dbError;

    // --- 2. JAVASCRIPT LOGIK (Bündelung & Deine Spezial-Filter) ---
    const processed: any[] = [];
    const tmMap = new Map<string, any>();

    (rawEvents || []).forEach((event) => {
      // A. Radius Check (Haversine)
      if (cityLat && cityLng && radius > 0 && event.latitude && event.longitude) {
        const dLat = ((event.latitude - cityLat) * Math.PI) / 180;
        const dLng = ((event.longitude - cityLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((cityLat * Math.PI) / 180) * Math.cos((event.latitude * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
        const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        if (dist > radius) return;
      }

      // B. DEINE SPEZIAL-TAGS (Mistwetter, Kids-Alter, Romantik, etc.)
      if (tags && tags.length > 0) {
        const eventText = `${event.title} ${event.short_description || ""} ${event.venue_name || ""}`.toLowerCase();
        const matchesTags = tags.some((tag: string) => {
          // Mistwetter / Indoor
          if (tag === "schlechtwetter-indoor")
            return /indoor|museum|kino|theater|halle|konzertsaal/i.test(eventText) || event.tags?.includes(tag);
          // Kinder Altersgruppen
          if (tag === "kleinkinder") return /baby|kleinkind|0-4|krabbeln/i.test(eventText) || event.tags?.includes(tag);
          if (tag === "schulkinder") return /schulkind|5-10|primarschule/i.test(eventText) || event.tags?.includes(tag);
          if (tag === "teenager")
            return /teenager|jugend|ab 12|jugendlich/i.test(eventText) || event.tags?.includes(tag);
          // Standard-Tags (Romantik, Nightlife, etc.)
          return event.tags?.includes(tag) || eventText.includes(tag.split("-")[0]);
        });
        if (!matchesTags) return;
      }

      // C. VIP ARTISTS FILTER
      if (vipArtistsFilter && vipArtistsFilter.length > 0) {
        const isVip = vipArtistsFilter.some((artist: string) =>
          event.title?.toLowerCase().includes(artist.toLowerCase()),
        );
        if (!isVip) return;
      }

      // D. DIE TICKETMASTER-BÜNDELUNG (Das eigentliche Problem heute)
      const isTM = event.external_id?.startsWith("tm");

      if (!isTM) {
        // MySwitzerland & Rest: 1:1 durchreichen, nichts verändern!
        processed.push(event);
      } else {
        // Ticketmaster: Gruppieren nach gereinigtem Titel + Stadt
        const key = `${superClean(event.title)}_${superClean(event.address_city || "ch")}`;

        if (!tmMap.has(key)) {
          tmMap.set(key, { ...event, all_dates: [event.start_date] });
        } else {
          const existing = tmMap.get(key);
          existing.all_dates.push(event.start_date);
          const sorted = existing.all_dates.sort();
          existing.start_date = sorted[0];
          existing.end_date = sorted[sorted.length - 1];
          existing.is_range = true;
          // Bild-Fallback
          if (!existing.image_url && event.image_url) existing.image_url = event.image_url;
        }
      }
    });

    // Alles mischen und final nach Datum sortieren
    const final = [...processed, ...Array.from(tmMap.values())];
    final.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    // 3. EXTRAS FÜR INITIAL LOAD (Kategorien & VIPs für deine Filter-Menüs)
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
        events: final.slice(offset, offset + limit),
        taxonomy,
        vipArtists,
        pagination: { total: final.length, hasMore: offset + limit < final.length },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers: corsHeaders });
  }
});
