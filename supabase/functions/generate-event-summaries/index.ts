import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use the external Supabase credentials from secrets
    const externalUrl = Deno.env.get("Supabase_URL");
    const serviceRoleKey = Deno.env.get("Supabase_SERVICE_ROLE_KEY");

    console.log("External URL configured:", !!externalUrl);
    console.log("Service Role Key configured:", !!serviceRoleKey);

    if (!externalUrl || !serviceRoleKey) {
      const missing = [];
      if (!externalUrl) missing.push("Supabase_URL");
      if (!serviceRoleKey) missing.push("Supabase_SERVICE_ROLE_KEY");
      throw new Error(`Missing secrets: ${missing.join(", ")}`);
    }

    // Create client for external Supabase with SERVICE ROLE KEY to bypass RLS for updates
    const externalSupabase = createClient(externalUrl, serviceRoleKey);

    // Fetch events that need AI descriptions (where short_description is null or empty)
    const { data: events, error: fetchError } = await externalSupabase
      .from("events")
      .select("id, title, description, venue_name, address_city, start_date, short_description")
      .or("short_description.is.null,short_description.eq.")
      .order("id", { ascending: false })
      .limit(100);

    if (fetchError) {
      console.error("Supabase query error:", JSON.stringify(fetchError));
      throw new Error(`Query failed: ${fetchError.message}`);
    }

    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ message: "Alle Events haben bereits Beschreibungen", updated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log(`Found ${events.length} events needing AI descriptions`);

    // Use our own generate-ai-descriptions edge function (which uses OpenAI)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://phlhbbjeqabjhkkyennz.supabase.co";
    const aiDescriptionUrl = `${supabaseUrl}/functions/v1/generate-ai-descriptions`;
    
    let updatedCount = 0;
    const errors: string[] = [];

    // Process each event
    for (const event of events) {
      try {
        console.log(`Processing event: ${event.id} - ${event.title}`);

        // Call our generate-ai-descriptions function
        const aiResponse = await fetch(aiDescriptionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: event.title || "",
            venue: event.venue_name || "",
            city: event.address_city || "",
            start_date: event.start_date || "",
            original_description: event.description || "",
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error(`AI API error for event ${event.id}:`, errorText);
          errors.push(`Event ${event.id}: AI error ${aiResponse.status}`);
          continue;
        }

        const aiData = await aiResponse.json();
        
        if (aiData.error) {
          console.error(`AI error for event ${event.id}:`, aiData.error);
          errors.push(`Event ${event.id}: ${aiData.error}`);
          continue;
        }

        if (!aiData.short_description) {
          console.error(`No short_description returned for event ${event.id}`);
          errors.push(`Event ${event.id}: No short_description in response`);
          continue;
        }

        console.log(`Got descriptions for ${event.id}: "${aiData.short_description.substring(0, 50)}..."`);

        // Update the event with both descriptions
        const updateData: Record<string, string> = {
          short_description: aiData.short_description,
        };
        
        // Also update long description if returned
        if (aiData.long_description) {
          updateData.description = aiData.long_description;
        }

        const { error: updateError } = await externalSupabase
          .from("events")
          .update(updateData)
          .eq("id", event.id);

        if (updateError) {
          console.error(`Update error for event ${event.id}:`, updateError);
          errors.push(`Event ${event.id}: Update failed - ${updateError.message}`);
          continue;
        }

        updatedCount++;
        console.log(`Successfully updated event ${event.id}`);

      } catch (eventError) {
        const msg = eventError instanceof Error ? eventError.message : String(eventError);
        console.error(`Error processing event ${event.id}:`, msg);
        errors.push(`Event ${event.id}: ${msg}`);
      }
    }

    return new Response(JSON.stringify({ 
      message: `${updatedCount} von ${events.length} Events mit AI-Beschreibungen aktualisiert`,
      updated: updatedCount,
      total: events.length,
      errors: errors.length > 0 ? errors : undefined
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error generating summaries:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
