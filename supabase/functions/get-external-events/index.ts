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

    // Get today's date in ISO format for filtering future events
    const today = new Date().toISOString();

    // Fetch future events OR events with null start_date (permanent attractions)
    // Using two queries and combining them
    const { data: futureEvents, error: futureError } = await externalSupabase
      .from("events")
      .select("*")
      .gte("start_date", today)
      .order("start_date", { ascending: true })
      .limit(200);

    const { data: permanentEvents, error: permanentError } = await externalSupabase
      .from("events")
      .select("*")
      .is("start_date", null)
      .limit(100);

    const error = futureError || permanentError;
    
    // Combine and deduplicate by id
    const allEvents = [...(futureEvents || []), ...(permanentEvents || [])];
    const uniqueIds = new Set();
    const data = allEvents.filter(event => {
      if (uniqueIds.has(event.id)) return false;
      uniqueIds.add(event.id);
      return true;
    });

    if (error) {
      console.error("Supabase query error:", JSON.stringify(error));
      throw new Error(`Query failed: ${error.message} (code: ${error.code})`);
    }

    // Log price statistics
    if (data && data.length > 0) {
      const withPrice = data.filter(e => e.price_from !== null && e.price_from !== undefined);
      const withLabel = data.filter(e => e.price_label !== null && e.price_label !== undefined);
      console.log(`Future Events: ${data.length} total, ${withPrice.length} with price_from, ${withLabel.length} with price_label`);
      console.log("First event:", JSON.stringify(data[0]?.title));
    } else {
      console.log("No future events found in table");
    }

    return new Response(JSON.stringify({ events: data || [], columns: data && data.length > 0 ? Object.keys(data[0]) : [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error fetching events:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
