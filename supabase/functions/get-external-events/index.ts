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
    // Parse request body for pagination parameters
    const body = await req.json().catch(() => ({}));
    const offset = body.offset || 0;
    const limit = body.limit || 50;
    const initialLoad = body.initialLoad ?? true; // For first load, also fetch taxonomy & vipArtists

    // Use the external Supabase credentials from secrets
    const externalUrl = Deno.env.get("Supabase_URL");
    const externalKey = Deno.env.get("Supabase_ANON_KEY");

    console.log("External URL configured:", !!externalUrl);
    console.log("External Key configured:", !!externalKey);
    console.log(`Pagination: offset=${offset}, limit=${limit}, initialLoad=${initialLoad}`);

    if (!externalUrl || !externalKey) {
      const missing = [];
      if (!externalUrl) missing.push("Supabase_URL");
      if (!externalKey) missing.push("Supabase_ANON_KEY");
      throw new Error(`Missing secrets: ${missing.join(", ")}`);
    }

    // Create client for external Supabase
    const externalSupabase = createClient(externalUrl, externalKey);

    // First, get total count for pagination info (ALL events, no date filter)
    const { count: totalEvents, error: countError } = await externalSupabase
      .from("events")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Count query error:", JSON.stringify(countError));
    }

    console.log(`Total events in DB: ${totalEvents}`);

    // Fetch paginated events - NO date filters, show ALL events
    const { data, error: queryError } = await externalSupabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (queryError) {
      console.error("Events query error:", JSON.stringify(queryError));
      throw new Error(`Query failed: ${queryError.message}`);
    }

    console.log(`Fetched ${data?.length || 0} events (offset: ${offset})`);

    // Only fetch taxonomy and VIP artists on initial load
    let taxonomy: any[] = [];
    let vipArtists: string[] = [];

    if (initialLoad) {
      const { data: taxonomyData, error: taxonomyError } = await externalSupabase
        .from("taxonomy")
        .select("id, name, type, parent_id")
        .order("name");

      if (taxonomyError) {
        console.error("Taxonomy query error:", JSON.stringify(taxonomyError));
      }
      taxonomy = taxonomyData || [];

      const { data: vipData, error: vipArtistsError } = await externalSupabase
        .from("vip_artists")
        .select("artists_name");

      if (vipArtistsError) {
        console.error("VIP Artists query error:", JSON.stringify(vipArtistsError));
      } else {
        console.log(`VIP Artists: ${vipData?.length || 0} loaded`);
      }
      vipArtists = vipData?.map(a => a.artists_name).filter(Boolean) || [];
    }

    const hasMore = offset + (data?.length || 0) < (totalEvents || 0);
    const nextOffset = offset + (data?.length || 0);

    return new Response(JSON.stringify({ 
      events: data || [], 
      taxonomy,
      vipArtists,
      pagination: {
        offset,
        limit,
        fetched: data?.length || 0,
        total: totalEvents || 0,
        hasMore,
        nextOffset
      }
    }), {
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
