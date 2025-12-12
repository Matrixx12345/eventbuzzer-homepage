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

    // Fetch feedback for all events with ratings
    const eventIds = data?.map((item: any) => item.event_id) || [];
    
    const { data: feedbackData, error: feedbackError } = await supabase
      .from("event_ratings")
      .select("event_id, feedback_category, feedback_text")
      .in("event_id", eventIds)
      .not("feedback_category", "is", null);

    if (feedbackError) {
      console.error("Feedback query error:", feedbackError);
    }

    // Group feedback by event_id
    const feedbackByEvent: Record<string, { categories: string[], texts: string[] }> = {};
    feedbackData?.forEach((fb: any) => {
      if (!feedbackByEvent[fb.event_id]) {
        feedbackByEvent[fb.event_id] = { categories: [], texts: [] };
      }
      if (fb.feedback_category) {
        feedbackByEvent[fb.event_id].categories.push(fb.feedback_category);
      }
      if (fb.feedback_text) {
        feedbackByEvent[fb.event_id].texts.push(fb.feedback_text);
      }
    });

    // Transform data for frontend
    const ratings = data?.map((item: any) => ({
      id: item.events.id,
      title: item.events.title,
      tags: item.events.tags,
      likes_count: item.likes_count,
      dislikes_count: item.dislikes_count,
      total_ratings: item.total_ratings,
      quality_score: item.quality_score,
      feedback_categories: feedbackByEvent[item.event_id]?.categories || [],
      feedback_texts: feedbackByEvent[item.event_id]?.texts || [],
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
