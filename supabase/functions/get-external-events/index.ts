import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Aggressives Bündeln: Wir nehmen 12 Zeichen (Fix für Helene Fischer & Linkin Park)
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
    // Limit 30 für maximale Stabilität
    const { offset = 0, limit = 30, initialLoad = true, filters = {} } = body;
    const { searchQuery, categoryId, tags, cityLat, cityLng, radius } = filters;

    const supabase = createClient(Deno.env.get("Supabase_URL")!, Deno.env.get("Supabase_ANON_KEY")!);

    // 1. ÜBERSETZUNG (Mapping Frontend -> DB)
    const tagMapping: Record<string, string> = {
      "romantisch-date": "romantik-date",
      "wellness-selfcare": "wellness",
      "schlechtwetter-indoor": "mistwetter",
      "familie-kinder": "kinder",
      "nightlife-party": "nightlife",
      "natur-erlebnisse": "natur",
    };

    let activeKeywords: string[] = [];
    if (tags && tags.length > 0) {
      // Wir übersetzen die Tags von der Webseite in deine DB-Kategorien
      const mappedTags = tags.map((t: string) => tagMapping[t] || t);
      const { data: kwData } = await supabase.from("mood_keywords").select("keyword").in("category", mappedTags);
      activeKeywords = kwData?.map((k) => k.keyword.toLowerCase()) || [];
    }

    // 2. BASIS ABFRAGE
    let query = supabase.from("events").select("*", { count: "exact" });

    // Volltext-Vorsuche in SQL (Titel & Beschreibung)
    if (activeKeywords.length > 0) {
      const topKws = activeKeywords.slice(0, 8); // Top 8 Keywords für SQL
      const sqlFilter = topKws.flatMap((kw) => [`title.ilike.%${kw}%`, `short_description.ilike.%${kw}%`]).join(",");
      query = query.or(sqlFilter);
    } else if (tags && tags.length > 0) {
      // Wenn Tag aktiv, aber keine Keywords in DB -> Leere Liste statt ALLES
      return new Response(JSON.stringify({ events: [], pagination: { total: 0, hasMore: false } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (searchQuery?.trim()) {
      const s = `%${searchQuery.trim()}%`;
      query = query.or(`title.ilike.${s},venue_name.ilike.${s},address_city.ilike.${s}`);
    }
    if (categoryId) query = query.eq("category_main_id", categoryId);

    const { data: rawEvents, error: dbError } = await query.order("start_date", { ascending: true }).limit(1000);
    if (dbError) throw dbError;

    const processed: any[] = [];
    const tmMap = new Map<string, any>();

    (rawEvents || []).forEach((event) => {
      // Umkreis-Check
      if (cityLat && cityLng && radius > 0 && event.latitude && event.longitude) {
        const dLat = ((event.latitude - cityLat) * Math.PI) / 180;
        const dLng = ((event.longitude - cityLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((cityLat * Math.PI) / 180) * Math.cos((event.latitude * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
        const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        if (dist > radius) return;
      }

      // INTELLIGENTER FILTER (Weighted Search)
      if (activeKeywords.length > 0) {
        const title = (event.title || "").toLowerCase();
        const desc = (event.short_description || "").toLowerCase();
        const combined = ` ${title} ${desc} `;

        const isMatch = activeKeywords.some((kw) => {
          if (kw.length <= 3) {
            // "Spa" Fix: Nur als ganzes Wort
            return new RegExp(`\\b${kw}\\b`, "i").test(combined);
          }
          // "Jazz" Fix: Darf Teil von Wörtern sein (findet Jazzabend)
          return combined.includes(kw);
        });
        if (!isMatch) return;
      }

      // Ticketmaster Bündelung (Fix für Helene & Linkin Park)
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
