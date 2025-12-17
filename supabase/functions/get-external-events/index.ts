import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Hilfsfunktion für den Vergleich (Entfernt ALLES außer Buchstaben/Zahlen)
function createCleanKey(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { offset = 0, limit = 50, initialLoad = true, filters = {} } = body;
    const { searchQuery, categoryId, city, radius, cityLat, cityLng } = filters;

    const supabase = createClient(Deno.env.get("Supabase_URL")!, Deno.env.get("Supabase_ANON_KEY")!);

    // Wir laden 1000 Stück (deckt alle TMs + Puffer ab)
    let query = supabase.from("events").select("*");

    if (searchQuery?.trim()) {
      const s = `%${searchQuery.trim()}%`;
      query = query.or(`title.ilike.${s},venue_name.ilike.${s},address_city.ilike.${s}`);
    }

    // Basis-Sortierung nach Startdatum
    const { data, error } = await query.order("start_date", { ascending: true }).limit(1000);
    if (error) throw error;

    const rawEvents = data || [];
    const processedEvents: any[] = [];
    const tmBundleMap = new Map(); // Speicher für Ticketmaster Gruppen

    rawEvents.forEach((event) => {
      // Radius-Filter (beibehalten)
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
        // MY SWITZERLAND: 1:1 übernehmen
        processedEvents.push(event);
      } else {
        // TICKETMASTER: Bündeln
        // Wir bündeln nach gereinigtem Titel + Stadt
        const key = `${createCleanKey(event.title)}_${createCleanKey(event.address_city || "ch")}`;

        if (!tmBundleMap.has(key)) {
          // Erstes Event dieser Gruppe
          tmBundleMap.set(key, { ...event, all_dates: [event.start_date] });
        } else {
          // Duplikat gefunden -> Bündeln
          const existing = tmBundleMap.get(key);
          if (event.start_date) existing.all_dates.push(event.start_date);

          const sorted = existing.all_dates.sort();
          existing.start_date = sorted[0];
          existing.end_date = sorted[sorted.length - 1];
          existing.is_range = true;

          // Bild behalten, falls vorhanden
          if (!existing.image_url && event.image_url) existing.image_url = event.image_url;
        }
      }
    });

    // TM Gruppen auflösen und mit dem Rest mischen
    let finalEvents = [...processedEvents, ...Array.from(tmBundleMap.values())];

    // Final für den User nach Datum sortieren
    finalEvents.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    // Die ersten 50 (limit) zurückgeben
    const result = finalEvents.slice(offset, offset + limit);

    return new Response(
      JSON.stringify({
        events: result,
        taxonomy: [],
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
