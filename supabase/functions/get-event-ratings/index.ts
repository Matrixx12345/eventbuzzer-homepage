import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Connect to external Supabase
    const supabaseUrl = Deno.env.get("Supabase_URL");
    const supabaseKey = Deno.env.get("Supabase_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch events with rating stats
    const { data, error } = await supabase
      .from("event_stats")
      .select(`
        event_id,
        likes_count,
        dislikes_count,
        total_ratings,
        quality_score,
        events!inner (
          id,
          title,
          tags
        )
      `)
      .gt("total_ratings", 0)
      .limit(100);

    if (error) {
      console.error("Query error:", error);
      throw error;
    }

    // Transform data for frontend
    const ratings = data?.map((item: any) => ({
      id: item.events.id,
      title: item.events.title,
      tags: item.events.tags,
      likes_count: item.likes_count,
      dislikes_count: item.dislikes_count,
      total_ratings: item.total_ratings,
      quality_score: item.quality_score,
    })) || [];

    return new Response(JSON.stringify({ success: true, data: ratings }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
