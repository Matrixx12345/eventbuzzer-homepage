import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventId, trackingType, userFingerprint } = await req.json();
    
    if (!eventId || !trackingType) {
      return new Response(
        JSON.stringify({ error: "Missing eventId or trackingType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Tracking ${trackingType} for event ${eventId}`);

    const supabase = createClient(
      Deno.env.get("Supabase_URL")!,
      Deno.env.get("Supabase_SERVICE_ROLE_KEY")!
    );

    // Determine which column to increment
    const columnToIncrement = trackingType === "click" ? "click_count" : "referral_count";
    
    // First, get current value
    const { data: event, error: fetchError } = await supabase
      .from("events")
      .select(`id, ${columnToIncrement}, favorite_count, click_count, referral_count`)
      .eq("id", eventId)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching event:", fetchError);
      throw fetchError;
    }

    if (!event) {
      // Try by external_id
      const { data: eventByExternal, error: extError } = await supabase
        .from("events")
        .select(`id, ${columnToIncrement}, favorite_count, click_count, referral_count`)
        .eq("external_id", eventId)
        .maybeSingle();

      if (extError || !eventByExternal) {
        return new Response(
          JSON.stringify({ error: "Event not found", eventId }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Increment the count
      const currentValue = eventByExternal[columnToIncrement] || 0;
      const newValue = currentValue + 1;

      const { error: updateError } = await supabase
        .from("events")
        .update({ 
          [columnToIncrement]: newValue,
          // Recalculate buzz_score: favorite_count * 3 + click_count * 0.5 + referral_count * 5 + 20 (capped at 100)
          buzz_score: Math.min(100, Math.floor(
            (eventByExternal.favorite_count || 0) * 3 +
            (trackingType === "click" ? newValue : eventByExternal.click_count || 0) * 0.5 +
            (trackingType === "referral" ? newValue : eventByExternal.referral_count || 0) * 5 +
            20
          ))
        })
        .eq("id", eventByExternal.id);

      if (updateError) {
        console.error("Error updating event:", updateError);
        throw updateError;
      }

      console.log(`Successfully tracked ${trackingType} for event ${eventByExternal.id}`);
      
      return new Response(
        JSON.stringify({ success: true, trackingType, newValue }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Increment the count for direct ID match
    const currentValue = event[columnToIncrement] || 0;
    const newValue = currentValue + 1;

    const { error: updateError } = await supabase
      .from("events")
      .update({ 
        [columnToIncrement]: newValue,
        buzz_score: Math.min(100, Math.floor(
          (event.favorite_count || 0) * 3 +
          (trackingType === "click" ? newValue : event.click_count || 0) * 0.5 +
          (trackingType === "referral" ? newValue : event.referral_count || 0) * 5 +
          20
        ))
      })
      .eq("id", event.id);

    if (updateError) {
      console.error("Error updating event:", updateError);
      throw updateError;
    }

    console.log(`Successfully tracked ${trackingType} for event ${event.id}`);

    return new Response(
      JSON.stringify({ success: true, trackingType, newValue }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("Error in track-event-buzz:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
