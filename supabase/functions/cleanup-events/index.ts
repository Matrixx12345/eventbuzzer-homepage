import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const externalUrl = Deno.env.get('Supabase_URL');
    const serviceRoleKey = Deno.env.get('Supabase_SERVICE_ROLE_KEY');

    if (!externalUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "External Supabase credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const externalSupabase = createClient(externalUrl, serviceRoleKey);

    // Delete events with null venue_name (broken imports)
    console.log("Deleting events with null venue_name...");
    const { data: deletedBroken, error: deleteError1 } = await externalSupabase
      .from('events')
      .delete()
      .is('venue_name', null)
      .select('id');

    if (deleteError1) {
      console.error("Error deleting broken events:", deleteError1);
    }

    // Delete events with empty location
    console.log("Deleting events with empty location...");
    const { data: deletedEmpty, error: deleteError2 } = await externalSupabase
      .from('events')
      .delete()
      .eq('location', '')
      .select('id');

    if (deleteError2) {
      console.error("Error deleting empty location events:", deleteError2);
    }

    const totalDeleted = (deletedBroken?.length || 0) + (deletedEmpty?.length || 0);
    console.log(`Deleted ${totalDeleted} broken events`);

    // Count remaining events
    const { count } = await externalSupabase
      .from('events')
      .select('*', { count: 'exact', head: true });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${totalDeleted} fehlerhafte Events gelöscht. ${count || 0} Events verbleiben.`,
        deleted: totalDeleted,
        remaining: count
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error cleaning up events:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
