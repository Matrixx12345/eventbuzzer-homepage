import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// BLOCKLIST - Events die NICHT importiert werden dürfen
const BLOCKED_EVENT_TITLES = [
  'malen wie paul klee',
  'meringues selber machen',
  'wenn schafe geschieden werden',
  'von tisch zu tisch',
  'disc golf',  // bereits gefiltert im Frontend
];

// Helper function to fetch venue details from Ticketmaster
async function fetchVenueDetails(venueId: string, apiKey: string): Promise<{
  street: string | null;
  city: string | null;
  postalCode: string | null;
  country: string;
  name: string | null;
}> {
  try {
    const venueUrl = `https://app.ticketmaster.com/discovery/v2/venues/${venueId}.json?apikey=${apiKey}`;
    const response = await fetch(venueUrl);
    
    if (!response.ok) {
      console.log(`Venue API returned ${response.status} for venue ${venueId}`);
      return { street: null, city: null, postalCode: null, country: "CH", name: null };
    }
    
    const venueData = await response.json();
    
    const street = venueData.address?.line1 || null;
    const city = venueData.city?.name || null;
    const postalCode = venueData.postalCode || null;
    const country = venueData.country?.countryCode || "CH";
    const name = venueData.name || null;
    
    console.log(`Venue ${venueId} details: ${name}, ${street}, ${postalCode} ${city}`);
    
    return { street, city, postalCode, country, name };
  } catch (error) {
    console.error(`Error fetching venue ${venueId}:`, error);
    return { street: null, city: null, postalCode: null, country: "CH", name: null };
  }
}

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

    console.log("Step 1: Fetching events from Ticketmaster Discovery API (with pagination)...");

    // Fetch multiple pages of events from Ticketmaster Discovery API for Switzerland
    const pageSize = 50;
    const maxPages = 4; // 4 pages x 50 = 200 events max
    const ticketmasterEvents: any[] = [];
    
    for (let page = 0; page < maxPages; page++) {
      const ticketmasterUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${ticketmasterApiKey}&countryCode=CH&size=${pageSize}&page=${page}&sort=date,asc`;
      
      console.log(`Fetching page ${page + 1}/${maxPages}...`);
      const ticketmasterResponse = await fetch(ticketmasterUrl);

      if (!ticketmasterResponse.ok) {
        const errorText = await ticketmasterResponse.text();
        console.error(`Ticketmaster API error on page ${page}:`, ticketmasterResponse.status, errorText);
        // Continue with what we have so far
        break;
      }

      const ticketmasterData = await ticketmasterResponse.json();
      const pageEvents = ticketmasterData._embedded?.events || [];
      console.log(`Page ${page + 1}: Got ${pageEvents.length} events`);
      
      ticketmasterEvents.push(...pageEvents);
      
      // Check if there are more pages
      const totalPages = ticketmasterData.page?.totalPages || 1;
      if (page + 1 >= totalPages) {
        console.log(`Reached last page (${totalPages} total pages)`);
        break;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`Fetched ${ticketmasterEvents.length} total events from Ticketmaster Discovery API`);

    if (ticketmasterEvents.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No events found from Ticketmaster", synced: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create external Supabase client with SERVICE ROLE KEY to bypass RLS
    const externalSupabase = createClient(externalUrl, serviceRoleKey);

    console.log("Step 2: Parsing events with FULL venue data (fetching each venue separately)...");

    // Map Ticketmaster events to our events table schema
    const eventsToInsert = [];
    
    for (const event of ticketmasterEvents) {
      // BLOCKLIST CHECK - Skip events on blocklist
      const title = event.name || "Unnamed Event";
      const titleLower = title.toLowerCase();
      if (BLOCKED_EVENT_TITLES.some(blocked => titleLower.includes(blocked))) {
        console.log(`⏭️  Skipped BLOCKED event: "${title}"`);
        continue;
      }

      // PAST DATE CHECK - Never import events with past dates
      const eventStartDate = event.dates?.start?.dateTime || event.dates?.start?.localDate;
      if (eventStartDate) {
        const eventDate = new Date(eventStartDate);
        if (eventDate < new Date()) {
          console.log(`⏭️  Skipped PAST event: "${title}" (${eventStartDate})`);
          continue;
        }
      }

      // CHRISTMAS FILTER - Only import Weihnachts-Events in Nov/Dec
      const currentMonth = new Date().getMonth() + 1;
      const isChristmasEvent = titleLower.includes('weihnacht') || titleLower.includes('noël') || titleLower.includes('noel');
      if (isChristmasEvent && currentMonth < 11) {
        console.log(`⏭️  Skipped CHRISTMAS event (not season): "${title}"`);
        continue;
      }

      // Extract venue ID from _embedded
      const venue = event._embedded?.venues?.[0];
      const venueId = venue?.id;
      
      let venueName = venue?.name || null;
      let addressStreet = venue?.address?.line1 || null;
      let addressCity = venue?.city?.name || null;
      let addressZip = venue?.postalCode || null;
      let addressCountry = venue?.country?.countryCode || "CH";
      
      // If venue ID exists and we don't have street address, fetch venue details
      if (venueId && !addressStreet) {
        console.log(`Fetching detailed venue info for ${venueId} (${venueName})...`);
        const venueDetails = await fetchVenueDetails(venueId, ticketmasterApiKey);
        
        // Use fetched data if available
        if (venueDetails.street) addressStreet = venueDetails.street;
        if (venueDetails.city) addressCity = venueDetails.city;
        if (venueDetails.postalCode) addressZip = venueDetails.postalCode;
        if (venueDetails.country) addressCountry = venueDetails.country;
        if (venueDetails.name && !venueName) venueName = venueDetails.name;
      }
      
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

      console.log(`Event: ${event.name} | Venue: ${venueName} | Street: ${addressStreet} | City: ${addressCity}`);

      eventsToInsert.push({
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
      });
    }

    console.log(`Prepared ${eventsToInsert.length} events with enriched venue data`);

    console.log("Step 3: Inserting events into database...");

    // Filter out admin-verified events
    console.log("Filtering out admin-verified events...");
    const externalIds = eventsToInsert.map(e => e.external_id);
    const { data: adminVerified } = await externalSupabase
      .from('events')
      .select('external_id, admin_verified')
      .in('external_id', externalIds)
      .eq('admin_verified', true);

    const adminVerifiedIds = new Set(adminVerified?.map(e => e.external_id) || []);
    const filteredEvents = eventsToInsert.filter(e => !adminVerifiedIds.has(e.external_id));

    console.log(`Skipping ${adminVerifiedIds.size} admin-verified events. Inserting ${filteredEvents.length} events.`);

    // Insert events - use upsert to handle duplicates (based on external_id)
    const { data: insertedData, error: insertError } = await externalSupabase
      .from('events')
      .upsert(filteredEvents, { onConflict: 'external_id', ignoreDuplicates: true })
      .select();

    if (insertError) {
      console.error("Error inserting events:", insertError);
      // Continue anyway - some events may have been inserted
      console.log("Continuing with AI description generation despite insert error...");
    }

    const syncedCount = insertedData?.length || eventsToInsert.length;
    console.log(`Successfully synced ${syncedCount} events to database`);

    // Step 4: Generate AI descriptions for events without short_description
    console.log("Step 4: Fetching events without AI descriptions...");
    
    // Query for events that don't have a short_description yet
    const { data: eventsNeedingDescriptions, error: fetchError } = await externalSupabase
      .from('events')
      .select('id, title, venue_name, address_city, start_date, description, short_description')
      .or('short_description.is.null,short_description.eq.')
      .order('id', { ascending: false })
      .limit(200);

    if (fetchError) {
      console.error("Error fetching events needing descriptions:", fetchError);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://phlhbbjeqabjhkkyennz.supabase.co';
    const aiDescriptionUrl = `${supabaseUrl}/functions/v1/generate-ai-descriptions`;
    
    let descriptionsGenerated = 0;
    const descriptionErrors: string[] = [];

    const eventsToDescribe = eventsNeedingDescriptions || [];
    
    console.log(`Found ${eventsToDescribe.length} events needing AI descriptions...`);
    
    for (const event of eventsToDescribe) {
      try {
        console.log(`Generating AI descriptions for: ${event.id} - ${event.title}`);

        const aiResponse = await fetch(aiDescriptionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
