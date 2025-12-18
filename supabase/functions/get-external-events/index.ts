import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { offset = 0, limit = 50, filters = {} } = body;
    const { searchQuery, city, radius, cityLat, cityLng } = filters;

    const supabase = createClient(Deno.env.get("Supabase_URL")!, Deno.env.get("Supabase_ANON_KEY")!);

    // Wir laden 800 Events vorab für das Grouping
    let query = supabase.from("events").select("*");
    if (searchQuery?.trim()) query = query.ilike("title", `%${searchQuery.trim()}%`);

    const { data: rawEvents, error: dbError } = await query.order("start_date", { ascending: true }).limit(800);
    if (dbError) throw dbError;

    // Fix TS7034: Explizite Typzuweisung für das Array
    const processed: any[] = [];
    const tmMap = new Map<string, any>();

    (rawEvents || []).forEach((event) => {
      // Radius Filter Logik (Haversine)
      if (city && radius > 0 && cityLat && cityLng && event.latitude && event.longitude) {
        const dLat = ((event.latitude - cityLat) * Math.PI) / 180;
        const dLng = ((event.longitude - cityLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((cityLat * Math.PI) / 180) * Math.cos((event.latitude * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
        const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        if (dist > radius) return;
      }

      // Die Weiche: Ticketmaster vs. Rest
      const isTM = event.external_id?.startsWith("tm");
      if (!isTM) {
        processed.push(event);
      } else {
        // Bündelung: Alle Sonderzeichen/Leerzeichen raus für den Vergleich
        const key = `${event.title.toLowerCase().replace(/[^a-z0-9]/g, "")}_${(event.address_city || "ch").toLowerCase()}`;
        if (!tmMap.has(key)) {
          tmMap.set(key, { ...event, all_dates: [event.start_date] });
        } else {
          const existing = tmMap.get(key);
          existing.all_dates.push(event.start_date);
          const sorted = existing.all_dates.sort();
          existing.start_date = sorted[0];
          existing.end_date = sorted[sorted.length - 1];
          existing.is_range = true;
        }
      }
    });

    const final = [...processed, ...Array.from(tmMap.values())];
    final.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    return new Response(
      JSON.stringify({
        events: final.slice(offset, offset + limit),
        pagination: { total: final.length, hasMore: offset + limit < final.length },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    // Fix TS18046: Error Typ-Sicherheit
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
