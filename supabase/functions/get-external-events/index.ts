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

    // First, fetch all columns to see what's available
    const { data, error } = await externalSupabase
      .from("events")
      .select("*")
      .limit(5);

    if (error) {
      console.error("Supabase query error:", JSON.stringify(error));
      throw new Error(`Query failed: ${error.message} (code: ${error.code})`);
    }

    // Log the column names from first row
    if (data && data.length > 0) {
      console.log("Available columns:", Object.keys(data[0]));
      console.log("Sample event:", JSON.stringify(data[0]));
    } else {
      console.log("No events found in table");
    }

    return new Response(JSON.stringify({ events: data, columns: data && data.length > 0 ? Object.keys(data[0]) : [] }), {
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
