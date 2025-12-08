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
    const externalKey = Deno.env.get("Supabase_ANON_KEY");

    console.log("External URL configured:", !!externalUrl);
    console.log("External Key configured:", !!externalKey);

    if (!externalUrl || !externalKey) {
      const missing = [];
      if (!externalUrl) missing.push("Supabase_URL");
      if (!externalKey) missing.push("Supabase_ANON_KEY");
      throw new Error(`Missing secrets: ${missing.join(", ")}`);
    }

    // Create client for external Supabase
    const externalSupabase = createClient(externalUrl, externalKey);

    // Fetch all events that need summaries
    const { data: events, error: fetchError } = await externalSupabase
      .from("events")
      .select("id, title, description, location, address_city, start_date, short_description")
      .order("start_date", { ascending: true });

    if (fetchError) {
      console.error("Supabase query error:", JSON.stringify(fetchError));
      throw new Error(`Query failed: ${fetchError.message}`);
    }

    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ message: "No events found", updated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log(`Found ${events.length} events to process`);

    const summarizeUrl = "https://tfkiyvhfhvkejpljsnrk.supabase.co/functions/v1/summarize-events";
    let updatedCount = 0;
    const errors: string[] = [];

    // Process each event
    for (const event of events) {
      try {
        console.log(`Processing event: ${event.id} - ${event.title}`);

        // Call the summarize-events function
        const summaryResponse = await fetch(summarizeUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: event.title || "",
            description: event.description || "",
            venue: event.location || "",
            city: event.address_city || "",
            start_date: event.start_date || "",
          }),
        });

        if (!summaryResponse.ok) {
          const errorText = await summaryResponse.text();
          console.error(`Summarize API error for event ${event.id}:`, errorText);
          errors.push(`Event ${event.id}: API error ${summaryResponse.status}`);
          continue;
        }

        const summaryData = await summaryResponse.json();
        const summary = summaryData.summary;

        if (!summary) {
          console.error(`No summary returned for event ${event.id}`);
          errors.push(`Event ${event.id}: No summary in response`);
          continue;
        }

        console.log(`Got summary for ${event.id}: ${summary.substring(0, 50)}...`);

        // Update the event with the new short_description
        const { error: updateError } = await externalSupabase
          .from("events")
          .update({ short_description: summary })
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
      message: `Processed ${events.length} events`,
      updated: updatedCount,
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
