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
    const { tags = [] } = filters;

    const supabase = createClient(Deno.env.get("Supabase_URL")!, Deno.env.get("Supabase_ANON_KEY")!);

    // --- DER DOLMETSCHER (Wichtig!) ---
    const translator: Record<string, string> = {
      "romantisch-date": "romantik-date",
      "wellness-selfcare": "wellness",
      "schlechtwetter-indoor": "mistwetter",
      "familie-kinder": "kinder",
    };

    let keywords: string[] = [];
    if (tags.length > 0) {
      const dbCategories = tags.map((t: string) => translator[t] || t);
      const { data: kwData } = await supabase.from("mood_keywords").select("keyword").in("category", dbCategories);
      keywords = kwData?.map((k) => k.keyword.toLowerCase()) || [];
    }

    let query = supabase.from("events").select("*", { count: "exact" });

    if (keywords.length > 0) {
      const sqlFilter = keywords
        .slice(0, 10)
        .flatMap((kw) => [`title.ilike.%${kw}%`, `short_description.ilike.%${kw}%`])
        .join(",");
      query = query.or(sqlFilter);
    } else if (tags.length > 0) {
      return new Response(
        JSON.stringify({
          events: [],
          pagination: { total: 0, hasMore: false },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: events, error, count } = await query
      .order("start_date", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return new Response(
      JSON.stringify({
        events: events || [],
        pagination: {
          total: count || 0,
          hasMore: (count || 0) > offset + limit,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("Error in get-external-events:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
