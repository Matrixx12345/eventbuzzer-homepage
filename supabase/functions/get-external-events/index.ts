import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Radikale Normalisierung: Entfernt ALLES außer Buchstaben und Zahlen
function superClean(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "") // Löscht Sonderzeichen, Leerzeichen, Bindestriche
    .trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { offset = 0, limit = 50, initialLoad = true, filters = {} } = body;
    const { searchQuery, categoryId, subcategoryId, city, radius, cityLat, cityLng, timeFilter, tags } = filters;

    const supabase = createClient(Deno.env.get("Supabase_URL")!, Deno.env.get("Supabase_ANON_KEY")!);

    // Wir laden 1000 Events, um wirklich alle Duplikate zu erwischen
    let query = supabase.from("events").select("*", { count: "exact" });

    // Filter anwenden
    if (searchQuery?.trim()) {
      const s = `%${searchQuery.trim()}%`;
      query = query.or(`title.ilike.${s},venue_name.ilike.${s},address_city.ilike.${s}`);
    }
    if (city && (!radius || radius === 0)) {
      query = query.or(`address_city.ilike.%${city}%,location.ilike.%${city}%`);
    }
    if (categoryId) query = query.eq("category_main_id", categoryId);

    // Sortierung nach Datum für die Basisliste
    query = query.order("start_date", { ascending: true }).limit(1000);

    const { data, error } = await query;
    if (error) throw error;

    const rawEvents = data || [];
    const finalEvents: any[] = [];
    const tmGroupMap = new Map();

    rawEvents.forEach((event) => {
      // Radius Filter (falls aktiv)
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
        finalEvents.push(event);
      } else {
        // Ticketmaster Gruppierung mit radikalem Key
        const key = `${superClean(event.title)}_${superClean(event.address_city || "ch")}`;

        if (!tmGroupMap.has(key)) {
          tmGroupMap.set(key, { ...event, all_dates: [event.start_date] });
        } else {
          const existing = tmGroupMap.get(key);
          existing.all_dates.push(event.start_date);
          const sorted = existing.all_dates.sort();
          existing.start_date = sorted[0];
          existing.end_date = sorted[sorted.length - 1];
          existing.is_range = true; // Flag für das Frontend
        }
      }
    });

    const combined = [...finalEvents, ...Array.from(tmGroupMap.values())];
    combined.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    const result = combined.slice(offset, offset + limit);

    return new Response(
      JSON.stringify({
        events: result,
        taxonomy: [], // Gekürzt für Speed
        pagination: { offset, limit, total: combined.length, hasMore: offset + limit < combined.length },
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
