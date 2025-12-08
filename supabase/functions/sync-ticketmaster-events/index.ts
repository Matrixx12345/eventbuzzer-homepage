import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const externalUrl = Deno.env.get('Supabase_URL');
    const externalKey = Deno.env.get('Supabase_ANON_KEY');

    if (!externalUrl || !externalKey) {
      console.error("External Supabase credentials not configured");
      return new Response(
        JSON.stringify({ error: "External Supabase credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Step 1: Fetching events from Ticketmaster API...");

    // Fetch events from the external ticketmaster-events function
    const ticketmasterResponse = await fetch(
      'https://tfkiyvhfhvkejpljsnrk.supabase.co/functions/v1/ticketmaster-events',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${externalKey}`,
          'apikey': externalKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!ticketmasterResponse.ok) {
      const errorText = await ticketmasterResponse.text();
      console.error("Ticketmaster API error:", ticketmasterResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `Ticketmaster API error: ${ticketmasterResponse.status}`, details: errorText }),
        { status: ticketmasterResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ticketmasterData = await ticketmasterResponse.json();
    const ticketmasterEvents = ticketmasterData.events || [];
    console.log(`Fetched ${ticketmasterEvents.length} events from Ticketmaster`);

    if (ticketmasterEvents.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No events found from Ticketmaster", synced: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create external Supabase client
    const externalSupabase = createClient(externalUrl, externalKey);

    console.log("Step 2: Mapping and inserting events into database...");

    // Map Ticketmaster events to our events table schema
    const eventsToInsert = ticketmasterEvents.map((event: any) => ({
      id: event.id || crypto.randomUUID(),
      title: event.name || event.title || "Unnamed Event",
      description: event.description || event.info || null,
      venue_name: event.venue || event._embedded?.venues?.[0]?.name || null,
      address_city: event.city || event._embedded?.venues?.[0]?.city?.name || null,
      address_country: event.country || event._embedded?.venues?.[0]?.country?.name || "Schweiz",
      start_date: event.date || event.dates?.start?.localDate || null,
      price_from: event.priceRanges?.[0]?.min || event.price || null,
      ticket_link: event.url || event.ticket_link || null,
      image_url: event.image || event.images?.[0]?.url || null,
    }));

    console.log(`Prepared ${eventsToInsert.length} events for insertion`);

    // Upsert events (insert or update on conflict)
    const { data: insertedData, error: insertError } = await externalSupabase
      .from('events')
      .upsert(eventsToInsert, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select();

    if (insertError) {
      console.error("Error inserting events:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to insert events", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const syncedCount = insertedData?.length || eventsToInsert.length;
    console.log(`Successfully synced ${syncedCount} events to database`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${syncedCount} Events von Ticketmaster synchronisiert`,
        synced: syncedCount,
        events: insertedData || eventsToInsert
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error syncing Ticketmaster events:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
