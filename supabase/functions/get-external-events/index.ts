import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Reinigt den Titel für den Vergleich
function bundleKey(text: string): string {
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
      tags,
      vipArtistsFilter,
    } = filters;

    const supabase = createClient(Deno.env.get("Supabase_URL")!, Deno.env.get("Supabase_ANON_KEY")!);

    // 1. BREITE ABFRAGE STARTEN
    // Wir laden 1000 Events, um sicherzustellen, dass TM-Events dabei sind
    let query = supabase.from("events").select("*", { count: "exact" });

    // Nur grobe SQL-Filter, um TM-Events nicht vorab zu löschen
    if (searchQuery?.trim()) {
      const s = `%${searchQuery.trim()}%`;
      query = query.or(`title.ilike.${s},venue_name.ilike.${s},address_city.ilike.${s}`);
    }

    // WENN eine Kategorie gewählt ist, filtern wir in SQL (schneller)
    if (categoryId) query = query.eq("category_main_id", categoryId);
    if (subcategoryId) query = query.eq("category_sub_id", subcategoryId);

    // Sortierung nach Datum
    const { data: rawEvents, error: dbError } = await query.order("start_date", { ascending: true }).limit(1000);
    if (dbError) throw dbError;

    const processed: any[] = [];
    const tmMap = new Map<string, any>();

    (rawEvents || []).forEach((event) => {
      // A. RADIUS CHECK
      if (cityLat && cityLng && radius > 0 && event.latitude && event.longitude) {
        const dLat = ((event.latitude - cityLat) * Math.PI) / 180;
        const dLng = ((event.longitude - cityLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((cityLat * Math.PI) / 180) * Math.cos((event.latitude * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
        const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        if (dist > radius) return;
      }

      // B. DEINE SPEZIAL-TAGS (Mistwetter, Kids, Romantik)
      if (tags && tags.length > 0) {
        const txt = `${event.title} ${event.short_description || ""}`.toLowerCase();
        const hasTag = tags.some((t: string) => {
          if (t === "schlechtwetter-indoor") return /indoor|halle|museum|kino/i.test(txt);
          if (t === "kleinkinder") return /baby|0-4|krabbeln/i.test(txt);
          if (t === "schulkinder") return /5-10|primar/i.test(txt);
          if (t === "teenager") return /teenager|ab 12/i.test(txt);
          return event.tags?.includes(t) || txt.includes(t.split("-")[0]);
        });
        if (!hasTag) return;
      }

      // C. TICKETMASTER BÜNDELUNG
      const isTM = event.external_id?.toLowerCase().startsWith("tm");

      if (!isTM) {
        processed.push(event); // MySwitzerland & Rest
      } else {
        const key = `${bundleKey(event.title)}_${bundleKey(event.address_city || "ch")}`;
        if (!tmMap.has(key)) {
          tmMap.set(key, { ...event, all_dates: [event.start_date] });
        } else {
          const existing = tmMap.get(key);
          existing.all_dates.push(event.start_date);
          const sorted = existing.all_dates.sort();
          existing.start_date = sorted[0];
          existing.end_date = sorted[sorted.length - 1];
          existing.is_range = true;
        }
      }
    });

    const final = [...processed, ...Array.from(tmMap.values())];
    final.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    // 2. EXTRAS (Taxonomy für die Filter-Menüs)
    let taxonomy: any[] = [];
    let vipArtists: any[] = [];
    if (initialLoad) {
      const { data: tax } = await supabase.from("taxonomy").select("id, name, type, parent_id");
      taxonomy = tax || [];
      const { data: vips } = await supabase.from("vip_artists").select("artists_name").limit(100);
      vipArtists = vips?.map((a) => a.artists_name).filter(Boolean) || [];
    }

    // LIMIT 50 beachten (wegen Browser-Error aus History)
    const result = final.slice(offset, offset + limit);

    return new Response(
      JSON.stringify({
        events: result,
        taxonomy,
        vipArtists,
        pagination: { total: final.length, hasMore: offset + limit < final.length },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
