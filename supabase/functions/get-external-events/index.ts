import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { offset = 0, limit = 50, filters = {} } = body;
    const { searchQuery, city, radius, cityLat, cityLng } = filters;

    const supabase = createClient(Deno.env.get("Supabase_URL")!, Deno.env.get("Supabase_ANON_KEY")!);

    // Wir laden 1000 Events, um sicherzugehen, dass wir alle Termine eines Musicals finden
    let query = supabase.from("events").select("*");

    if (searchQuery?.trim()) {
      query = query.ilike("title", `%${searchQuery.trim()}%`);
    }

    const { data: rawEvents, error } = await query.order("start_date", { ascending: true }).limit(1000);
    if (error) throw error;

    const mysList: any[] = [];
    const tmMap = new Map();

    (rawEvents || []).forEach((event) => {
      // Radius-Filter (optional)
      if (city && radius > 0 && cityLat && cityLng && event.latitude && event.longitude) {
        const dLat = ((event.latitude - cityLat) * Math.PI) / 180;
        const dLng = ((event.longitude - cityLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((cityLat * Math.PI) / 180) * Math.cos((event.latitude * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
        const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        if (dist > radius) return;
      }

      const isTM = event.external_id?.startsWith("tm");

      if (!isTM) {
        // MY SWITZERLAND: Finger weg, 1:1 rein
        mysList.push(event);
      } else {
        // TICKETMASTER: Radikales Bündeln
        // Wir nehmen nur die ersten 20 Zeichen des Titels (ohne Leerzeichen/Sonderzeichen) + Stadt
        const cleanTitle = event.title
          .toLowerCase()
          .replace(/[^a-z]/g, "")
          .substring(0, 20);
        const cleanCity = (event.address_city || "ch").toLowerCase().trim();
        const bundleKey = `${cleanTitle}_${cleanCity}`;

        if (!tmMap.has(bundleKey)) {
          tmMap.set(bundleKey, { ...event, all_dates: [event.start_date] });
        } else {
          const existing = tmMap.get(bundleKey);
          if (event.start_date) existing.all_dates.push(event.start_date);

          const sorted = existing.all_dates.sort();
          existing.start_date = sorted[0];
          existing.end_date = sorted[sorted.length - 1];
          // Flag für das Frontend
          if (existing.start_date !== existing.end_date) existing.is_range = true;

          if (!existing.image_url && event.image_url) existing.image_url = event.image_url;
        }
      }
    });

    // Zusammenführen und nach Datum sortieren
    let finalEvents = [...mysList, ...Array.from(tmMap.values())];
    finalEvents.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    const paginated = finalEvents.slice(offset, offset + limit);

    return new Response(
      JSON.stringify({
        events: paginated,
        pagination: { offset, limit, total: finalEvents.length, hasMore: offset + limit < finalEvents.length },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
