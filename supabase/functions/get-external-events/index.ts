import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Aggressives Bündeln: Wir nehmen nur die ersten 15 Zeichen
function superClean(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim()
    .substring(0, 15); // Der "Linkin Park" Fix
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { offset = 0, limit = 50, initialLoad = true, filters = {} } = body;
    const { searchQuery, categoryId, subcategoryId, priceTier, tags, cityLat, cityLng, radius } = filters;

    const supabase = createClient(Deno.env.get("Supabase_URL")!, Deno.env.get("Supabase_ANON_KEY")!);

    let query = supabase.from("events").select("*", { count: "exact" });

    // SQL-Vorfilterung
    if (searchQuery?.trim()) {
      const s = `%${searchQuery.trim()}%`;
      query = query.or(`title.ilike.${s},venue_name.ilike.${s},address_city.ilike.${s}`);
    }
    if (categoryId) query = query.eq("category_main_id", categoryId);

    const { data: rawEvents, error: dbError } = await query.order("start_date", { ascending: true }).limit(1000);
    if (dbError) throw dbError;

    const processed: any[] = [];
    const tmMap = new Map<string, any>();

    (rawEvents || []).forEach((event) => {
      // Radius-Check
      if (cityLat && cityLng && radius > 0 && event.latitude && event.longitude) {
        const dLat = ((event.latitude - cityLat) * Math.PI) / 180;
        const dLng = ((event.longitude - cityLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((cityLat * Math.PI) / 180) * Math.cos((event.latitude * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
        const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        if (dist > radius) return;
      }

      // --- THEMA 1: ROMANTIK (DIE MEGA-LISTE) ---
      if (tags && tags.includes("romantisch-date")) {
        const txt = `${event.title} ${event.short_description || ""} ${event.venue_name || ""}`.toLowerCase();
        const romantikKeywords = [
          // Klassik & Vibe
          "romant",
          "date",
          "love",
          "liebe",
          "herz",
          "kiss",
          "kuss",
          "sweetheart",
          "soulmate",
          "zweisam",
          "together",
          "candle",
          "kerzen",
          "valentinstag",
          "valentine",
          // Kulinarik (Essen & Trinken)
          "dinner",
          "gänge",
          "menü",
          "menu",
          "gourmet",
          "champagner",
          "champagne",
          "prosecco",
          "weinprobe",
          "wine",
          "dine",
          "degustation",
          "schokolade",
          "chocolate",
          "pralinen",
          "picknick",
          "brunch",
          "rooftop",
          "sunset",
          "sonnenuntergang",
          "aphrodisiac",
          "austern",
          "trüffel",
          // Erlebnisse
          "sternenhimmel",
          "stargazing",
          "moonlight",
          "mondschein",
          "kamin",
          "lagerfeuer",
          "fire",
          "piano",
          "klavier",
          "jazz",
          "chanson",
          "serenade",
          "ballade",
          "oper",
          "ballett",
          "schiff",
          "cruise",
          "gondel",
          "kutsche",
          "carriage",
          "schloss",
          "castle",
          "burg",
          "sommernacht",
          "openairkino",
          "sommerkino",
          // Wellness & Schweizerdeutsch
          "massage",
          "spa",
          "jacuzzi",
          "whirlpool",
          "wellness",
          "hamam",
          "schmüsele",
          "kuscheln",
          "chuschle",
          "liebi",
          "schätzli",
          "gnüsse",
          "zäme",
          "gnuss",
          "nachtässe",
          "usflug",
        ];

        const isRomantisch = romantikKeywords.some((key) => txt.includes(key));
        if (!isRomantisch) return; // Wenn nicht romantisch, aussortieren
      }

      // Bündelung
      const isTM = event.external_id?.toLowerCase().startsWith("tm");
      if (!isTM) {
        processed.push(event);
      } else {
        // Der aggressive Key für Helene/Linkin Park etc.
        const key = `${superClean(event.title)}_${(event.address_city || "ch").toLowerCase()}`;
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

    // WICHTIG: Limit 50 einhalten
    const result = final.slice(offset, offset + limit);

    let taxonomy: any[] = [];
    let vipArtists: any[] = [];
    if (initialLoad) {
      const { data: tax } = await supabase.from("taxonomy").select("id, name, type, parent_id");
      taxonomy = tax || [];
      const { data: vips } = await supabase.from("vip_artists").select("artists_name").limit(100);
      vipArtists = vips?.map((a) => a.artists_name).filter(Boolean) || [];
    }

    return new Response(
      JSON.stringify({
        events: result,
        taxonomy,
        vipArtists,
        pagination: { total: final.length, hasMore: offset + limit < final.length },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
