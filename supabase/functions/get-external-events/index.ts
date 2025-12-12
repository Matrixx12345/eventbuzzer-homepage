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

    // Get today's date in ISO format for filtering future events
    const today = new Date().toISOString();

    // First, get total count for pagination info
    const { count: futureCount } = await externalSupabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .gte("start_date", today);

    const { count: permanentCount } = await externalSupabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .is("start_date", null);

    const totalEvents = (futureCount || 0) + (permanentCount || 0);
    console.log(`Total events in DB: ${totalEvents} (future: ${futureCount}, permanent: ${permanentCount})`);

    // Fetch paginated future events
    const { data: futureEvents, error: futureError } = await externalSupabase
      .from("events")
      .select("*")
      .gte("start_date", today)
      .order("start_date", { ascending: true })
      .range(offset, offset + limit - 1);

    // Calculate how many permanent events to fetch based on remaining slots
    const futureEventsFetched = futureEvents?.length || 0;
    const remainingSlots = limit - futureEventsFetched;
    const permanentOffset = Math.max(0, offset - (futureCount || 0));

    let permanentEvents: any[] = [];
    if (remainingSlots > 0 || offset >= (futureCount || 0)) {
      const { data: permData, error: permanentError } = await externalSupabase
        .from("events")
        .select("*")
        .is("start_date", null)
        .range(permanentOffset, permanentOffset + Math.max(remainingSlots, limit) - 1);
      
      if (permanentError) {
        console.error("Permanent events query error:", JSON.stringify(permanentError));
      }
      permanentEvents = permData || [];
    }

    // Combine events
    const allEvents = [...(futureEvents || []), ...permanentEvents];
    
    // Deduplicate by id
    const uniqueIds = new Set();
    const data = allEvents.filter(event => {
      if (uniqueIds.has(event.id)) return false;
      uniqueIds.add(event.id);
      return true;
    }).slice(0, limit); // Ensure we don't exceed limit

    console.log(`Fetched ${data.length} events (offset: ${offset})`);

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

    if (futureError) {
      console.error("Supabase query error:", JSON.stringify(futureError));
      throw new Error(`Query failed: ${futureError.message} (code: ${futureError.code})`);
    }

    const hasMore = offset + data.length < totalEvents;
    const nextOffset = offset + data.length;

    return new Response(JSON.stringify({ 
      events: data || [], 
      taxonomy,
      vipArtists,
      pagination: {
        offset,
        limit,
        fetched: data.length,
        total: totalEvents,
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
