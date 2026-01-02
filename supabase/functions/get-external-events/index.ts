import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Cloud Supabase für buzz_boost Overrides
const cloudSupabaseUrl = Deno.env.get("SUPABASE_URL");
const cloudSupabaseKey = Deno.env.get("SUPABASE_ANON_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { offset = 0, limit = 30, filters = {}, eventId } = body;
    
    const supabase = createClient(Deno.env.get("Supabase_URL")!, Deno.env.get("Supabase_ANON_KEY")!);
    
    // Cloud Supabase für buzz_boost (optional)
    let buzzBoostMap: Record<string, number> = {};
    if (cloudSupabaseUrl && cloudSupabaseKey) {
      try {
        const cloudSupabase = createClient(cloudSupabaseUrl, cloudSupabaseKey);
        const { data: boostData } = await cloudSupabase
          .from("event_vibe_overrides")
          .select("external_id, buzz_boost")
          .not("buzz_boost", "is", null)
          .neq("buzz_boost", 1);
        
        if (boostData) {
          boostData.forEach((b: any) => {
            if (b.buzz_boost && b.buzz_boost !== 1) {
              buzzBoostMap[b.external_id] = b.buzz_boost;
            }
          });
        }
        console.log(`Loaded ${Object.keys(buzzBoostMap).length} buzz boosts`);
      } catch (e) {
        console.log("Could not load buzz boosts:", e);
      }
    }
    
    // Helper to apply buzz boost
    const applyBuzzBoost = (event: any) => {
      const externalId = event.external_id || String(event.id);
      const boost = buzzBoostMap[externalId];
      if (boost && boost !== 1 && event.buzz_score !== null && event.buzz_score !== undefined) {
        event.buzz_score = Math.min(100, Math.round(event.buzz_score * boost));
      }
      return event;
    };
    
    // Fast path: Single event lookup by ID
    if (eventId) {
      console.log("=== SINGLE EVENT LOOKUP ===");
      console.log("Requested eventId:", eventId, "Type:", typeof eventId);
      
      let { data: event, error } = await supabase
        .from("events")
        .select("*")
        .eq("external_id", eventId)
        .maybeSingle();
      
      console.log("Query by external_id result:", event ? `Found: ${event.title}` : "Not found");
      
      if (!event && !error) {
        const numericId = parseInt(eventId, 10);
        console.log("Trying numeric ID:", numericId);
        if (!isNaN(numericId)) {
          const result = await supabase
            .from("events")
            .select("*")
            .eq("id", numericId)
            .maybeSingle();
          event = result.data;
          error = result.error;
          console.log("Query by numeric id result:", event ? `Found: ${event.title}` : "Not found");
        }
      }
      
      if (error) {
        console.error("Error fetching event:", error);
        throw error;
      }
      
      // Apply buzz boost
      if (event) {
        event = applyBuzzBoost(event);
        console.log("=== ATTRIBUTION DEBUG ===");
        console.log("Event ID:", event.id);
        console.log("External ID:", event.external_id);
        console.log("Title:", event.title);
        console.log("Buzz Score (after boost):", event.buzz_score);
      }
      
      return new Response(
        JSON.stringify({ events: event ? [event] : [], pagination: { total: event ? 1 : 0, hasMore: false } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { 
      tags = [], 
      searchQuery,
      search, 
      categoryId, 
      subcategoryId, 
      priceTier, 
      timeFilter, 
      city, 
      radius, 
      cityLat, 
      cityLng,
      singleDate,
      dateFrom,
      dateTo
    } = filters;
    
    // Support both "search" and "searchQuery" parameter names
    const searchTerm = search || searchQuery;

    console.log("Received filters:", JSON.stringify(filters));

    // Übersetzer von Frontend-Tags zu Datenbank-Tags
    const tagTranslator: Record<string, string[]> = {
      "romantisch-date": ["romantik-date"],
      "wellness-selfcare": ["wellness"],
      "schlechtwetter-indoor": ["mistwetter"],
      "familie-kinder": ["kinder", "familie-kinder"],
      "kleinkinder": ["kleinkinder"],
      "schulkinder": ["schulkinder"],
      "teenager": ["teenager"],
      "natur-erlebnisse": ["natur"],
      "open-air": ["open-air"],
      "foto-spot": ["foto-spot"],
      "nightlife-party": ["nightlife-party"],
      "afterwork": ["afterwork"],
      "rooftop-aussicht": ["rooftop-aussicht"],
      "vip-artists": ["vip-artists"],
      "besondere-anlaesse": ["besondere-anlaesse"],
      "freunde-gruppen": ["freunde-gruppen"],
    };

    // Use SELECT * to avoid column mismatch issues, then filter in response
    let query = supabase.from("events").select("*", { count: "exact" });

    // ✅ TAG-FILTER: Direkt mit .contains() auf der tags-Spalte filtern
    if (tags.length > 0) {
      // Alle Frontend-Tags zu DB-Tags übersetzen
      const dbTags: string[] = [];
      for (const tag of tags) {
        const translated = tagTranslator[tag];
        if (translated) {
          dbTags.push(...translated);
        } else {
          dbTags.push(tag); // Falls kein Mapping, original verwenden
        }
      }
      
      console.log("Filtering by tags:", dbTags);
      
      // Für jeden Tag einzeln prüfen mit .contains()
      // Wir nutzen .or() mit mehreren contains-Bedingungen
      if (dbTags.length === 1) {
        query = query.contains("tags", [dbTags[0]]);
      } else {
        // Bei mehreren Tags: Event muss mindestens einen davon haben
        const tagFilters = dbTags.map(tag => `tags.cs.{${tag}}`).join(",");
        query = query.or(tagFilters);
      }
    }

    // Kategorien-Filter (neue Spalten: category_main_id und category_sub_id)
    if (categoryId) {
      query = query.eq("category_main_id", categoryId);
    }
    if (subcategoryId) {
      query = query.eq("category_sub_id", subcategoryId);
    }

    // Suchtext-Filter
    if (searchTerm && searchTerm.trim()) {
      const s = searchTerm.trim().toLowerCase();
      query = query.or(`title.ilike.%${s}%,short_description.ilike.%${s}%,venue_name.ilike.%${s}%,description.ilike.%${s}%`);
    }

    // Preis-Filter
    if (priceTier) {
      switch (priceTier) {
        case "gratis":
          query = query.or("price_from.eq.0,price_from.is.null");
          break;
        case "$":
          query = query.lte("price_from", 30);
          break;
        case "$$":
          query = query.gte("price_from", 30).lte("price_from", 100);
          break;
        case "$$$":
          query = query.gte("price_from", 100);
          break;
      }
    }

    // Zeit-Filter
    const now = new Date();
    if (timeFilter) {
      const today = now.toISOString().split("T")[0];
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      
      switch (timeFilter) {
        case "now":
          query = query.lte("start_date", now.toISOString()).gte("end_date", now.toISOString());
          break;
        case "today":
          query = query.gte("start_date", `${today}T00:00:00`).lte("start_date", `${today}T23:59:59`);
          break;
        case "tomorrow":
          query = query.gte("start_date", `${tomorrow}T00:00:00`).lte("start_date", `${tomorrow}T23:59:59`);
          break;
        case "thisWeek":
          // Berechne nächstes Wochenende (Samstag + Sonntag)
          const dayOfWeek = now.getDay();
          const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
          const saturday = new Date(now.getTime() + daysUntilSaturday * 24 * 60 * 60 * 1000);
          const sunday = new Date(saturday.getTime() + 24 * 60 * 60 * 1000);
          query = query
            .gte("start_date", saturday.toISOString().split("T")[0])
            .lte("start_date", `${sunday.toISOString().split("T")[0]}T23:59:59`);
          break;
      }
    }

    // Datum-Filter
    if (singleDate) {
      const date = new Date(singleDate).toISOString().split("T")[0];
      query = query.gte("start_date", `${date}T00:00:00`).lte("start_date", `${date}T23:59:59`);
    }
    if (dateFrom) {
      query = query.gte("start_date", dateFrom);
    }
    if (dateTo) {
      query = query.lte("start_date", dateTo);
    }

    // Stadt/Radius-Filter (muss nach dem Fetch angewendet werden da PostGIS nicht verfügbar)
    // Für jetzt: einfacher City-Name-Filter
    if (city && !radius) {
      query = query.ilike("address_city", `%${city}%`);
    }

    const { data: events, error, count } = await query
      .order("start_date", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Database error:", error);
      throw error;
    }

    // Radius-Filter im Code (da PostGIS nicht verfügbar)
    let filteredEvents = events || [];
    if (city && radius && radius > 0 && cityLat && cityLng) {
      filteredEvents = filteredEvents.filter((event: any) => {
        if (!event.latitude || !event.longitude) return true; // Events ohne Coords durchlassen
        const dLat = (event.latitude - cityLat) * 111;
        const dLng = (event.longitude - cityLng) * 85;
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);
        return dist <= radius;
      });
    }

    // Apply buzz boosts to all events
    filteredEvents = filteredEvents.map(applyBuzzBoost);

    console.log(`Returning ${filteredEvents.length} events (total: ${count})`);

    return new Response(
      JSON.stringify({
        events: filteredEvents,
        pagination: {
          total: count || 0,
          hasMore: (count || 0) > offset + limit,
          nextOffset: offset + limit,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("Error in get-external-events:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
