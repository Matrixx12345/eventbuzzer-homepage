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
    const serviceRoleKey = Deno.env.get('Supabase_SERVICE_ROLE_KEY');

    if (!externalUrl || !externalKey || !serviceRoleKey) {
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

    // Create external Supabase client with SERVICE ROLE KEY to bypass RLS
    const externalSupabase = createClient(externalUrl, serviceRoleKey);

    console.log("Step 2: Mapping and inserting events into database...");

    // Map Ticketmaster events to our events table schema
    // Note: We don't include 'id' - let the database auto-generate it
    const eventsToInsert = ticketmasterEvents.map((event: any) => ({
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

    // Insert events (simple insert, no upsert since we're not tracking external IDs)
    const { data: insertedData, error: insertError } = await externalSupabase
      .from('events')
      .insert(eventsToInsert)
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

    // Step 3: Generate AI descriptions using OpenAI (via generate-ai-descriptions edge function)
    console.log("Step 3: Generating AI descriptions for new events...");
    
    // Get the Lovable Cloud function URL and anon key from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://phlhbbjeqabjhkkyennz.supabase.co';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const aiDescriptionUrl = `${supabaseUrl}/functions/v1/generate-ai-descriptions`;
    
    let descriptionsGenerated = 0;
    const descriptionErrors: string[] = [];

    // Only process the newly inserted events
    const eventsToDescribe = insertedData || [];
    
    console.log(`Processing ${eventsToDescribe.length} events for AI descriptions...`);
    
    for (const event of eventsToDescribe) {
      try {
        console.log(`Generating AI descriptions for: ${event.id} - ${event.title}`);

        const aiResponse = await fetch(aiDescriptionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseAnonKey}`,
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
          console.error(`AI description error for event ${event.id}:`, errorText);
          descriptionErrors.push(`Event ${event.id}: AI error ${aiResponse.status}`);
          continue;
        }

        const aiData = await aiResponse.json();
        
        if (!aiData.long_description || !aiData.short_description) {
          console.error(`Incomplete AI response for event ${event.id}`);
          descriptionErrors.push(`Event ${event.id}: Incomplete AI response`);
          continue;
        }

        console.log(`Got descriptions for ${event.id}: short="${aiData.short_description.substring(0, 40)}..."`);

        // Update the event with both descriptions
        const { error: updateError } = await externalSupabase
          .from("events")
          .update({ 
            description: aiData.long_description,
            short_description: aiData.short_description 
          })
          .eq("id", event.id);

        if (updateError) {
          console.error(`Update error for event ${event.id}:`, updateError);
          descriptionErrors.push(`Event ${event.id}: Update failed - ${updateError.message}`);
          continue;
        }

        descriptionsGenerated++;
        console.log(`Successfully generated descriptions for event ${event.id}`);

      } catch (eventError) {
        const msg = eventError instanceof Error ? eventError.message : String(eventError);
        console.error(`Error generating descriptions for event ${event.id}:`, msg);
        descriptionErrors.push(`Event ${event.id}: ${msg}`);
      }
    }

    console.log(`Successfully generated ${descriptionsGenerated} AI descriptions`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${syncedCount} Events synchronisiert, ${descriptionsGenerated} AI-Beschreibungen generiert`,
        synced: syncedCount,
        descriptions: descriptionsGenerated,
        descriptionErrors: descriptionErrors.length > 0 ? descriptionErrors : undefined,
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
