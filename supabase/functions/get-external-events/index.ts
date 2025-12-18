import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fix für Helene Fischer / Linkin Park: Wir bündeln nach den ersten 12 Zeichen
function superClean(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim()
    .substring(0, 12);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { offset = 0, limit = 30, initialLoad = true, filters = {} } = body;
    const { searchQuery, categoryId, tags, cityLat, cityLng, radius } = filters;

    const supabase = createClient(Deno.env.get("Supabase_URL")!, Deno.env.get("Supabase_ANON_KEY")!);

    // 1. MAPPING (ERWEITERT: Slug & Anzeigename)
    const tagMapping: Record<string, string> = {
      "romantisch-date": "romantik-date",
      "Romantisch & Date-Idee": "romantik-date",
      "wellness-selfcare": "wellness",
      "Wellness & Self-Care": "wellness",
      "schlechtwetter-indoor": "mistwetter",
      "Schlechtwetter-Tipp & Indoor": "mistwetter",
      "familie-kinder": "kinder",
      "Familientauglich & Mit Kindern": "kinder",
    };

    let activeKeywords: string[] = [];
    if (tags && tags.length > 0) {
      // Wir prüfen jedes geschickte Tag gegen unsere Übersetzungsliste
      const mappedCategories = tags.map((t: string) => tagMapping[t] || t.toLowerCase());

      const { data: kwData } = await supabase.from("mood_keywords").select("keyword").in("category", mappedCategories);

      activeKeywords = kwData?.map((k) => k.keyword.toLowerCase().trim()) || [];
    }

    // 2. DATENBANK ABFRAGE
    let query = supabase.from("events").select("*", { count: "exact" });

    // Wenn Keywords da sind, suchen wir gezielt in der ganzen DB (nicht nur 1000)
    if (activeKeywords.length > 0) {
      const sqlTerms = activeKeywords
        .slice(0, 10)
        .map((kw) => `title.ilike.%${kw}%`)
        .join(",");
      query = query.or(sqlTerms);
    } else if (tags && tags.length > 0) {
      // Falls ein Mood-Tag aktiv ist, aber keine Keywords gefunden wurden -> 0 Treffer
      return new Response(JSON.stringify({ events: [], pagination: { total: 0, hasMore: false } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (searchQuery?.trim()) {
      const s = `%${searchQuery.trim()}%`;
      query = query.or(`title.ilike.${s},venue_name.ilike.${s}`);
    }
    if (categoryId) query = query.eq("category_main_id", categoryId);

    const { data: rawEvents, error: dbError } = await query.order("start_date", { ascending: true }).limit(1000);
    if (dbError) throw dbError;

    const processed: any[] = [];
    const tmMap = new Map<string, any>();

    (rawEvents || []).forEach((event) => {
      // Radius Filter
      if (cityLat && cityLng && radius > 0 && event.latitude && event.longitude) {
        const dLat = ((event.latitude - cityLat) * Math.PI) / 180;
        const dLng = ((event.longitude - cityLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((cityLat * Math.PI) / 180) * Math.cos((event.latitude * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
        const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        if (dist > radius) return;
      }

      // PRÄZISER MOOD-FILTER (Prüft Titel & Description)
      if (activeKeywords.length > 0) {
        const fullText = ` ${event.title || ""} ${event.short_description || ""} `.toLowerCase();
        const hasMatch = activeKeywords.some((kw) => {
          if (kw.length <= 4) {
            // Kurze Wörter (spa, pool) müssen isoliert stehen
            return new RegExp(`\\b${kw}\\b`, "i").test(fullText);
          }
          // Lange Wörter (romantisch, jazz) dürfen Teil von Wörtern sein
          return fullText.includes(kw);
        });
        if (!hasMatch) return;
      }

      // TICKETMASTER BÜNDELUNG
      const isTM = event.external_id?.toLowerCase().startsWith("tm");
      if (!isTM) {
        processed.push(event);
      } else {
        const key = `${superClean(event.title)}_${(event.address_city || "ch").toLowerCase()}`;
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

    const result = final.slice(offset, offset + limit);

    // Initial Load (VIPs & Taxonomy)
    let taxonomy: any[] = [];
    let vipArtists: any[] = [];
    if (initialLoad) {
      const { data: tax } = await supabase.from("taxonomy").select("id, name, type, parent_id");
      taxonomy = tax || [];
      const { data: vips } = await supabase.from("vip_artists").select("artist_name");
      vipArtists = vips?.map((a) => a.artist_name).filter(Boolean) || [];
    }

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
