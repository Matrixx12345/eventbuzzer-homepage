import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function superClean(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim()
    .substring(0, 15);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { offset = 0, limit = 30, initialLoad = true, filters = {} } = body;
    const { searchQuery, categoryId, tags, cityLat, cityLng, radius } = filters;

    const supabase = createClient(Deno.env.get("Supabase_URL")!, Deno.env.get("Supabase_ANON_KEY")!);

    // 1. KEYWORDS LADEN (Mit Case-Korrektur)
    let activeKeywords: string[] = [];
    if (tags && tags.length > 0) {
      // Wir wandeln die Tags in Kleinschreibung um, passend zur Datenbank
      const searchTags = tags.map((t: string) => t.toLowerCase());
      const { data: kwData } = await supabase.from("mood_keywords").select("keyword").in("category", searchTags);
      activeKeywords = kwData?.map((k) => k.keyword.toLowerCase()) || [];
    }

    // 2. SQL ABFRAGE
    let query = supabase.from("events").select("*", { count: "exact" });

    if (activeKeywords.length > 0) {
      // Wir suchen in SQL nach den Top 10 Keywords für beste Trefferquote
      const sqlTerms = activeKeywords
        .slice(0, 10)
        .map((kw) => `title.ilike.%${kw}%`)
        .join(",");
      query = query.or(sqlTerms);
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
      // A. Radius Check
      if (cityLat && cityLng && radius > 0 && event.latitude && event.longitude) {
        const dLat = ((event.latitude - cityLat) * Math.PI) / 180;
        const dLng = ((event.longitude - cityLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((cityLat * Math.PI) / 180) * Math.cos((event.latitude * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
        const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        if (dist > radius) return;
      }

      // B. INTELLIGENTER MOOD-FILTER
      if (activeKeywords.length > 0) {
        const txt = ` ${event.title} ${event.short_description || ""} ${event.venue_name || ""} `.toLowerCase();

        const hasMatch = activeKeywords.some((kw) => {
          if (kw.length <= 3) {
            // Kurze Wörter wie 'spa' müssen freistehend sein (verhindert 'spass')
            const regex = new RegExp(`\\b${kw}\\b`, "i");
            return regex.test(txt);
          }
          // Lange Wörter dürfen Teil von anderen Wörtern sein (findet 'jazzabend')
          return txt.includes(kw);
        });

        if (!hasMatch) return;
      }

      // C. Ticketmaster Bündelung
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
