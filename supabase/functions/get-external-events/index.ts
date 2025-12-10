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

    // Fetch taxonomy for categories
    const { data: taxonomy, error: taxonomyError } = await externalSupabase
      .from("taxonomy")
      .select("id, name, type, parent_id")
      .order("name");

    // Fetch VIP artists for "Top Stars" filter
    const { data: vipArtists, error: vipArtistsError } = await externalSupabase
      .from("vip_artists")
      .select("artists_name");

    if (vipArtistsError) {
      console.error("VIP Artists query error:", JSON.stringify(vipArtistsError));
    } else {
      console.log(`VIP Artists: ${vipArtists?.length || 0} loaded`);
    }

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

    if (taxonomyError) {
      console.error("Taxonomy query error:", JSON.stringify(taxonomyError));
    }

    // Log price and category statistics
    const stats = {
      total: data?.length || 0,
      noMainCategory: 0,
      noSubCategory: 0,
      eventsWithoutMainCategory: [] as { id: number; title: string; external_id: string }[],
      eventsWithoutSubCategory: [] as { id: number; title: string; external_id: string; category_main_id: number | null }[],
    };
    
    if (data && data.length > 0) {
      const withPrice = data.filter(e => e.price_from !== null && e.price_from !== undefined);
      const withLabel = data.filter(e => e.price_label !== null && e.price_label !== undefined);
      const noMainCat = data.filter(e => e.category_main_id === null || e.category_main_id === undefined);
      const noSubCat = data.filter(e => e.category_sub_id === null || e.category_sub_id === undefined);
      
      stats.noMainCategory = noMainCat.length;
      stats.noSubCategory = noSubCat.length;
      stats.eventsWithoutMainCategory = noMainCat.map(e => ({ 
        id: e.id, 
        title: e.title, 
        external_id: e.external_id || '' 
      }));
      stats.eventsWithoutSubCategory = noSubCat
        .filter(e => e.category_main_id !== null) // Only show events that HAVE main but missing sub
        .map(e => ({ 
          id: e.id, 
          title: e.title, 
          external_id: e.external_id || '',
          category_main_id: e.category_main_id
        }));
      
      console.log(`Events: ${data.length} total, ${withPrice.length} with price, ${withLabel.length} with label`);
      console.log(`Categories: ${noMainCat.length} without main, ${noSubCat.length} without sub`);
      console.log(`Taxonomy: ${taxonomy?.length || 0} categories loaded`);
    } else {
      console.log("No future events found in table");
    }

    return new Response(JSON.stringify({ 
      events: data || [], 
      taxonomy: taxonomy || [],
      vipArtists: vipArtists?.map(a => a.artists_name).filter(Boolean) || [],
      stats,
      columns: data && data.length > 0 ? Object.keys(data[0]) : [] 
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
