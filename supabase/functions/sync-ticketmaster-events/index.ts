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
    const serviceRoleKey = Deno.env.get('Supabase_SERVICE_ROLE_KEY');
    const ticketmasterApiKey = Deno.env.get('TICKETMASTER_API_KEY');

    if (!externalUrl || !serviceRoleKey) {
      console.error("External Supabase credentials not configured");
      return new Response(
        JSON.stringify({ error: "External Supabase credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ticketmasterApiKey) {
      console.error("TICKETMASTER_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "TICKETMASTER_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Step 1: Fetching events directly from Ticketmaster Discovery API...");

    // Fetch events directly from Ticketmaster Discovery API for Switzerland
    const ticketmasterUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${ticketmasterApiKey}&countryCode=CH&size=50&sort=date,asc`;
    
    const ticketmasterResponse = await fetch(ticketmasterUrl);

    if (!ticketmasterResponse.ok) {
      const errorText = await ticketmasterResponse.text();
      console.error("Ticketmaster API error:", ticketmasterResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `Ticketmaster API error: ${ticketmasterResponse.status}`, details: errorText }),
        { status: ticketmasterResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ticketmasterData = await ticketmasterResponse.json();
    const ticketmasterEvents = ticketmasterData._embedded?.events || [];
    console.log(`Fetched ${ticketmasterEvents.length} events from Ticketmaster Discovery API`);

    if (ticketmasterEvents.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No events found from Ticketmaster", synced: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create external Supabase client with SERVICE ROLE KEY to bypass RLS
    const externalSupabase = createClient(externalUrl, serviceRoleKey);

    console.log("Step 2: Parsing events with full venue data...");

    // Map Ticketmaster events to our events table schema
    const eventsToInsert = ticketmasterEvents.map((event: any) => {
      // Extract venue information from _embedded
      const venue = event._embedded?.venues?.[0];
      const venueName = venue?.name || null;
      const addressStreet = venue?.address?.line1 || null;
      const addressCity = venue?.city?.name || null;
      const addressZip = venue?.postalCode || null;
      const addressCountry = venue?.country?.countryCode || "CH";
      
      // Build location string
      const locationParts = [venueName, addressCity].filter(Boolean);
      const location = locationParts.join(", ");

      // Get best image (prefer larger images)
      const images = event.images || [];
      const bestImage = images.find((img: any) => img.ratio === "16_9" && img.width >= 1024) 
        || images.find((img: any) => img.ratio === "16_9") 
        || images[0];
      const imageUrl = bestImage?.url || null;

      // Get price
      const priceFrom = event.priceRanges?.[0]?.min || null;

      // Get date
      const startDate = event.dates?.start?.dateTime || event.dates?.start?.localDate || null;
      const endDate = event.dates?.end?.dateTime || event.dates?.end?.localDate || null;

      // Get description
      const description = event.info || event.description || event.pleaseNote || null;

      // Get ticket link
      const ticketLink = event.url || null;

      // Get external ID
      const externalId = event.id || null;

      console.log(`Event: ${event.name} | Venue: ${venueName} | City: ${addressCity} | Street: ${addressStreet}`);

      return {
        title: event.name || "Unnamed Event",
        description: description,
        venue_name: venueName,
        address_street: addressStreet,
        address_city: addressCity,
        address_zip: addressZip,
        address_country: addressCountry,
        start_date: startDate,
        end_date: endDate,
        price_from: priceFrom,
        ticket_link: ticketLink,
        image_url: imageUrl,
        location: location,
        external_id: externalId,
      };
    });

    console.log(`Prepared ${eventsToInsert.length} events with venue data`);

    console.log("Step 3: Inserting events into database...");

    // Insert events
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

    // Step 4: Generate AI descriptions using OpenAI
    console.log("Step 4: Generating AI descriptions for new events...");
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://phlhbbjeqabjhkkyennz.supabase.co';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const aiDescriptionUrl = `${supabaseUrl}/functions/v1/generate-ai-descriptions`;
    
    let descriptionsGenerated = 0;
    const descriptionErrors: string[] = [];

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
