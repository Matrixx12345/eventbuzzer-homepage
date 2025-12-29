import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import EventCard from "./EventCard";
import { supabase } from "@/integrations/supabase/client";

// üåç Haversine-Formel: Berechnet Distanz zwischen zwei Koordinaten in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Erdradius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const EventsSection = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [cityName, setCityName] = useState<string>("your area");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNearbyEvents() {
      try {
        // 1Ô∏è‚É£ User-Position von IP-API holen
        let userLat: number | null = null;
        let userLon: number | null = null;
        let city = "your area";

        try {
          const locationResponse = await fetch("https://ipapi.co/json/");
          const locationData = await locationResponse.json();

          if (locationData.latitude && locationData.longitude) {
            userLat = locationData.latitude;
            userLon = locationData.longitude;
            city = locationData.city || locationData.region || "your area";
            setCityName(city);
          }
        } catch (error) {
          console.warn("IP-Location API failed, using fallback", error);
        }

        // 2Ô∏è‚É£ Events aus Supabase laden (nur aktive mit Koordinaten)
        const { data: eventsData, error } = await (supabase as any)
          .from("events")
          .select("*")
          .not("latitude", "is", null)
          .not("longitude", "is", null)
          .gte("start_date", new Date().toISOString())
          .order("start_date", { ascending: true })
          .limit(100);

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

        if (!eventsData || eventsData.length === 0) {
          // Fallback: Neueste Events ohne Koordinaten-Filter
          const { data: fallbackData } = await (supabase as any)
            .from("events")
            .select("*")
            .gte("start_date", new Date().toISOString())
            .order("start_date", { ascending: true })
            .limit(4);

          setEvents(fallbackData || []);
          setLoading(false);
          return;
        }

        // 3Ô∏è‚É£ Distanz berechnen & sortieren
        if (userLat !== null && userLon !== null) {
          const eventsWithDistance = eventsData.map((event: any) => ({
            ...event,
            distance: calculateDistance(userLat!, userLon!, event.latitude, event.longitude),
          }));

          // Sortiere nach Distanz
          eventsWithDistance.sort((a: any, b: any) => a.distance - b.distance);
          setEvents(eventsWithDistance.slice(0, 4));
        } else {
          // Fallback: Zeige einfach die neuesten 4
          setEvents(eventsData.slice(0, 4));
        }
      } catch (error) {
        console.error("Error loading nearby events:", error);

        // Ultimate Fallback: Top Events by relevance
        const { data: fallbackData } = await (supabase as any)
          .from("events")
          .select("*")
          .gte("start_date", new Date().toISOString())
          .order("relevance_score", { ascending: false })
          .limit(4);

        setEvents(fallbackData || []);
      } finally {
        setLoading(false);
      }
    }

    loadNearbyEvents();
  }, []);

  if (loading) {
    return (
      <section className="py-12 sm:py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-6">
            <Zap size={20} className="text-primary" />
            <span className="text-sm font-semibold text-foreground">Loading...</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 h-64 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-6">
          <Zap size={20} className="text-primary" />
          <span className="text-sm font-semibold text-foreground">Right now in {cityName}</span>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {events.map((event: any, index: number) => (
            <div key={event.id} className="opacity-0 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <EventCard
                id={event.id}
                slug={event.id}
                image={event.image_url || "/placeholder.jpg"}
                title={event.title}
                venue={event.venue || ""}
                location={event.location}
                isPopular={true}
                latitude={event.latitude}
                longitude={event.longitude}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
