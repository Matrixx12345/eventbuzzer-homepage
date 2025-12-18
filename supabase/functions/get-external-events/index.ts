import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { offset = 0, limit = 30, filters = {} } = body;
    const { searchQuery, categoryId, tags } = filters;

    const supabase = createClient(Deno.env.get("Supabase_URL")!, Deno.env.get("Supabase_ANON_KEY")!);

    // --- DIE ÜBERSETZUNG (Exakt abgestimmt auf deine Listings.tsx) ---
    const translator: Record<string, string> = {
      "romantisch-date": "romantik-date",
      "wellness-selfcare": "wellness",
      "schlechtwetter-indoor": "mistwetter",
      "familie-kinder": "kinder",
      "natur-erlebnisse": "natur",
    };

    let keywords: string[] = [];
    if (tags && tags.length > 0) {
      // Wir übersetzen 'romantisch-date' zu 'romantik-date' für die DB-Suche
      const dbCategories = tags.map((t: string) => translator[t] || t);
      const { data: kwData } = await supabase.from("mood_keywords").select("keyword").in("category", dbCategories);
      keywords = kwData?.map((k) => k.keyword.toLowerCase()) || [];
    }

    let query = supabase.from("events").select("*", { count: "exact" });

    // Wenn Keywords da sind, suchen wir gezielt in Titeln UND Beschreibungen
    if (keywords.length > 0) {
      const sqlParts = keywords
        .slice(0, 10)
        .flatMap((kw) => [`title.ilike.%${kw}%`, `short_description.ilike.%${kw}%`])
        .join(",");
      query = query.or(sqlParts);
    } else if (tags && tags.length > 0) {
      // Sicherheit: Falls ein Button gedrückt wurde, aber keine Keywords da sind -> 0 Treffer
      return new Response(JSON.stringify({ events: [], pagination: { total: 0, hasMore: false } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,venue_name.ilike.%${searchQuery}%`);
    }
    if (categoryId) query = query.eq("category_main_id", categoryId);

    const { data: rawEvents, error: dbError } = await query.order("start_date", { ascending: true }).limit(500);
    if (dbError) throw dbError;

    // Feinfilterung im Code (für den 'Spa'-Fix bei Wellness)
    const finalEvents = (rawEvents || []).filter((event) => {
      if (keywords.length === 0) return true;
      const fullText = ` ${event.title} ${event.short_description || ""} `.toLowerCase();
      return keywords.some((kw) => {
        if (kw.length <= 3) return new RegExp(`\\b${kw}\\b`, "i").test(fullText);
        return fullText.includes(kw);
      });
    });

    const result = finalEvents.slice(offset, offset + limit);

    return new Response(
      JSON.stringify({
        events: result,
        pagination: { total: finalEvents.length, hasMore: offset + limit < finalEvents.length },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
