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
    // Parse request body for pagination and filter parameters
    const body = await req.json().catch(() => ({}));
    const offset = body.offset || 0;
    const limit = body.limit || 50;
    const initialLoad = body.initialLoad ?? true;
    
    // Filter parameters
    const filters = body.filters || {};
    const {
      searchQuery,
      categoryId,
      subcategoryId,
      priceTier,
      city,
      radius,
      cityLat,
      cityLng,
      timeFilter,
      dateFrom,
      dateTo,
      singleDate,
      source,
      tags,
      availability,
      vipArtistsFilter,
    } = filters;

    // Use the external Supabase credentials from secrets
    const externalUrl = Deno.env.get("Supabase_URL");
    const externalKey = Deno.env.get("Supabase_ANON_KEY");

    console.log("External URL configured:", !!externalUrl);
    console.log("External Key configured:", !!externalKey);
    console.log(`Pagination: offset=${offset}, limit=${limit}`);
    console.log("Filters:", JSON.stringify(filters));

    if (!externalUrl || !externalKey) {
      const missing = [];
      if (!externalUrl) missing.push("Supabase_URL");
      if (!externalKey) missing.push("Supabase_ANON_KEY");
      throw new Error(`Missing secrets: ${missing.join(", ")}`);
    }

    // Create client for external Supabase
    const externalSupabase = createClient(externalUrl, externalKey);

    // Build query with filters
    let query = externalSupabase
      .from("events")
      .select("*", { count: "exact" });

    // Search filter
    if (searchQuery && searchQuery.trim()) {
      const search = `%${searchQuery.trim()}%`;
      query = query.or(`title.ilike.${search},venue_name.ilike.${search},address_city.ilike.${search},location.ilike.${search},short_description.ilike.${search}`);
    }

    // Category filter
    if (categoryId !== null && categoryId !== undefined) {
      query = query.eq("category_main_id", categoryId);
    }

    // Subcategory filter
    if (subcategoryId !== null && subcategoryId !== undefined) {
      query = query.eq("category_sub_id", subcategoryId);
    }

    // Price tier filter
    if (priceTier) {
      if (priceTier === "gratis") {
        query = query.or("price_from.eq.0,price_label.ilike.%kostenlos%,price_label.ilike.%gratis%");
      } else if (priceTier === "$") {
        query = query.or("price_label.eq.$,and(price_from.gt.0,price_from.lte.50)");
      } else if (priceTier === "$$") {
        query = query.or("price_label.eq.$$,and(price_from.gt.50,price_from.lte.120)");
      } else if (priceTier === "$$$") {
        query = query.or("price_label.eq.$$$,price_from.gt.120");
      }
    }

    // Source filter
    if (source === "ticketmaster") {
      query = query.like("external_id", "tm_%");
    } else if (source === "myswitzerland") {
      query = query.like("external_id", "mys_%");
    }

    // Tags filter (array contains)
    if (tags && tags.length > 0) {
      // Use overlaps for OR logic (any of the tags)
      query = query.overlaps("tags", tags);
    }

    // Time filter
    const now = new Date();
    if (timeFilter) {
      if (timeFilter === "today") {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
        query = query.gte("start_date", todayStart).lte("start_date", todayEnd);
      } else if (timeFilter === "tomorrow") {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate()).toISOString();
        const tomorrowEnd = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59).toISOString();
        query = query.gte("start_date", tomorrowStart).lte("start_date", tomorrowEnd);
      } else if (timeFilter === "thisWeek") {
        // This weekend (Saturday + Sunday)
        const dayOfWeek = now.getDay();
        const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
        const saturday = new Date(now);
        saturday.setDate(now.getDate() + daysUntilSaturday);
        const saturdayStart = new Date(saturday.getFullYear(), saturday.getMonth(), saturday.getDate()).toISOString();
        const sunday = new Date(saturday);
        sunday.setDate(saturday.getDate() + 1);
        const sundayEnd = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate(), 23, 59, 59).toISOString();
        query = query.gte("start_date", saturdayStart).lte("start_date", sundayEnd);
      } else if (timeFilter === "nextWeek") {
        const nextWeekStart = new Date(now);
        nextWeekStart.setDate(now.getDate() + (8 - now.getDay()));
        const nextWeekEnd = new Date(nextWeekStart);
        nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
        query = query.gte("start_date", nextWeekStart.toISOString()).lte("start_date", nextWeekEnd.toISOString());
      } else if (timeFilter === "thisMonth") {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
        query = query.gte("start_date", monthStart).lte("start_date", monthEnd);
      } else if (timeFilter === "now") {
        // Events starting within 4 hours
        const fourHoursLater = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
        query = query.gte("start_date", now.toISOString()).lte("start_date", fourHoursLater);
      }
    }

    // Single date filter
    if (singleDate) {
      const date = new Date(singleDate);
      const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
      const dateEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59).toISOString();
      query = query.gte("start_date", dateStart).lte("start_date", dateEnd);
    }

    // Date range filter
    if (dateFrom) {
      query = query.gte("start_date", new Date(dateFrom).toISOString());
    }
    if (dateTo) {
      query = query.lte("start_date", new Date(dateTo).toISOString());
    }

    // Availability filter
    if (availability) {
      const currentMonth = now.getMonth() + 1;
      if (availability === "now") {
        query = query.contains("available_months", [currentMonth]);
      } else if (availability === "winter") {
        query = query.overlaps("available_months", [11, 12, 1, 2, 3]);
      } else if (availability === "summer") {
        query = query.overlaps("available_months", [4, 5, 6, 7, 8, 9, 10]);
      } else if (availability === "yearround") {
        query = query.contains("available_months", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      }
    }

    // City filter (exact match or partial)
    if (city && !radius) {
      query = query.or(`address_city.ilike.%${city}%,location.ilike.%${city}%`);
    }

    // Fetch ALL matching events first (no pagination yet) to consolidate properly
    query = query.order("start_date", { ascending: true }).limit(2000);

    const { data, error: queryError } = await query;

    if (queryError) {
      console.error("Events query error:", JSON.stringify(queryError));
      throw new Error(`Query failed: ${queryError.message}`);
    }

    console.log(`Fetched ${data?.length || 0} events before consolidation`);

    // Radius filter (post-query since Supabase doesn't have native geo)
    let filteredData = data || [];
    if (city && radius && radius > 0 && cityLat && cityLng) {
      filteredData = filteredData.filter(event => {
        if (event.latitude && event.longitude) {
          const distance = haversineDistance(cityLat, cityLng, event.latitude, event.longitude);
          return distance <= radius;
        }
        // Fallback: city name match
        const eventCity = event.address_city || event.location || "";
        return eventCity.toLowerCase().includes(city.toLowerCase());
      });
    }

    // VIP Artists filter (post-query for now)
    if (vipArtistsFilter && vipArtistsFilter.length > 0) {
      filteredData = filteredData.filter(event => {
        const titleLower = (event.title || "").toLowerCase();
        return vipArtistsFilter.some((artist: string) => {
          if (!artist || artist.length < 3) return false;
          const artistLower = artist.toLowerCase().trim();
          if (titleLower.startsWith(artistLower)) return true;
          const regex = new RegExp(`\\b${artistLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          return regex.test(event.title || "");
        });
      });
    }

    // CONSOLIDATE DUPLICATE EVENTS (same title + venue → show date range)
    const consolidateEvents = (events: any[]) => {
      const grouped = new Map<string, any[]>();
      
      events.forEach(event => {
        // Key by title + venue (normalized)
        const key = `${(event.title || '').toLowerCase().trim()}|${(event.venue_name || event.location || '').toLowerCase().trim()}`;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(event);
      });

      const consolidated: any[] = [];
      grouped.forEach((group) => {
        if (group.length === 1) {
          consolidated.push(group[0]);
        } else {
          // Multiple events with same title/venue → consolidate
          // Sort by start_date
          group.sort((a, b) => {
            const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
            const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
            return dateA - dateB;
          });
          
          // Use first event as base, add date_range info
          const base = { ...group[0] };
          const firstDate = group[0].start_date;
          const lastDate = group[group.length - 1].start_date;
          
          if (firstDate && lastDate && firstDate !== lastDate) {
            base.date_range_start = firstDate;
            base.date_range_end = lastDate;
            base.show_count = group.length;
          }
          
          // Take best data from all events (prefer non-null values)
          group.forEach(e => {
            if (!base.latitude && e.latitude) base.latitude = e.latitude;
            if (!base.longitude && e.longitude) base.longitude = e.longitude;
            if (!base.short_description && e.short_description) base.short_description = e.short_description;
            if (!base.image_url && e.image_url) base.image_url = e.image_url;
          });
          
          consolidated.push(base);
        }
      });
      
      return consolidated;
    };

    filteredData = consolidateEvents(filteredData);
    const totalConsolidated = filteredData.length;
    console.log(`After consolidation: ${totalConsolidated} unique events`);

    // NOW apply pagination to consolidated results
    const paginatedData = filteredData.slice(offset, offset + limit);

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

    const hasMore = offset + paginatedData.length < totalConsolidated;
    const nextOffset = offset + paginatedData.length;

    return new Response(JSON.stringify({ 
      events: paginatedData, 
      taxonomy,
      vipArtists,
      pagination: {
        offset,
        limit,
        fetched: paginatedData.length,
        total: totalConsolidated,
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

// Haversine distance calculation
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
