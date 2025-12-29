import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import EventCard from "./EventCard";
import { externalSupabase as supabase } from "@/integrations/supabase/externalClient";

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

// üá®üá≠ Gro√üe Schweizer St√§dte (nur diese werden f√ºr Location-basierte Suche verwendet)
const SWISS_CITIES = [
  { name: "Zurich", lat: 47.3769, lon: 8.5417, minPopulation: 400000 },
  { name: "Geneva", lat: 46.2044, lon: 6.1432, minPopulation: 200000 },
  { name: "Basel", lat: 47.5596, lon: 7.5886, minPopulation: 170000 },
  { name: "Bern", lat: 46.948, lon: 7.4474, minPopulation: 130000 },
  { name: "Lausanne", lat: 46.5197, lon: 6.6323, minPopulation: 140000 },
  { name: "Winterthur", lat: 47.499, lon: 8.724, minPopulation: 110000 },
  { name: "Lucerne", lat: 47.0502, lon: 8.3093, minPopulation: 80000 },
  { name: "St. Gallen", lat: 47.4245, lon: 9.3767, minPopulation: 75000 },
];

const EventsSection = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [cityName, setCityName] = useState<string>("Zurich");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNearbyEvents() {
      try {
        // 1Ô∏è‚É£ User-Position von IP-API holen
        let userLat: number = 47.3769; // Default: Zurich
        let userLon: number = 8.5417;
        let city = "Zurich";
        let isInSwitzerland = true;

        try {
          const locationResponse = await fetch("https://ipapi.co/json/");
          const locationData = await locationResponse.json();

          if (locationData.latitude && locationData.longitude) {
            userLat = locationData.latitude;
            userLon = locationData.longitude;

            // Check country and set Swiss city accordingly
            const countryCode = locationData.country_code;

            if (countryCode === "CH") {
              // User in Schweiz ‚Üí Finde n√§chste gro√üe Stadt
              isInSwitzerland = true;
              console.log(`User in Switzerland: ${locationData.city}`);
            } else if (countryCode === "DE") {
              // User in Deutschland ‚Üí Zeige Basel (grenznah & cool!)
              city = "Basel";
              userLat = 47.5596;
              userLon = 7.5886;
              isInSwitzerland = true;
              console.log("User in Germany, showing Basel events");
            } else {
              // User irgendwo anders ‚Üí Zeige Zurich
              city = "Zurich";
              userLat = 47.3769;
              userLon = 8.5417;
              isInSwitzerland = true;
              console.log(`User in ${countryCode}, showing Zurich events`);
            }
          }
        } catch (error) {
          console.warn("IP-Location API failed, using fallback", error);
        }

        // 2Ô∏è‚É£ Events aus Supabase laden
        const { data: eventsData, error } = await supabase
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

        console.log(`Loaded ${eventsData?.length || 0} events from Supabase`);

        if (!eventsData || eventsData.length === 0) {
          // Fallback: Neueste Events
          const { data: fallbackData } = await supabase
            .from("events")
            .select("*")
            .gte("start_date", new Date().toISOString())
            .order("relevance_score", { ascending: false })
            .limit(4);

          setEvents(fallbackData || []);
          setLoading(false);
          return;
        }

        // 3Ô∏è‚É£ Finde n√§chste gro√üe Schweizer Stadt (IMMER!)
        let nearestCity = SWISS_CITIES[0]; // Default: Z√ºrich
        let minDistance = Infinity;

        for (const cityItem of SWISS_CITIES) {
          const distance = calculateDistance(userLat, userLon, cityItem.lat, cityItem.lon);
          if (distance < minDistance) {
            minDistance = distance;
            nearestCity = cityItem;
          }
        }

        // Wenn User > 50km von allen St√§dten entfernt ‚Üí Zeige Zurich
        if (minDistance > 50) {
          nearestCity = SWISS_CITIES[0]; // Zurich als Fallback
          console.log(`User too far from cities (${minDistance.toFixed(1)}km), showing Zurich`);
        }

        setCityName(nearestCity.name);

        // Sortiere Events nach Distanz zur n√§chsten gro√üen Stadt
        const eventsWithDistance = eventsData.map((event: any) => ({
          ...event,
          distance: calculateDistance(nearestCity.lat, nearestCity.lon, event.latitude, event.longitude),
        }));

        eventsWithDistance.sort((a: any, b: any) => a.distance - b.distance);
        const topEvents = eventsWithDistance.slice(0, 4);
        console.log(`Setting ${topEvents.length} events for ${nearestCity.name}:`, topEvents);
        setEvents(topEvents);
      } catch (error) {
        console.error("Error loading nearby events:", error);

        // Ultimate Fallback: Top Events
        const { data: fallbackData } = await supabase
          .from("events")
          .select("*")
          .gte("start_date", new Date().toISOString())
          .order("relevance_score", { ascending: false })
          .limit(4);

        setEvents(fallbackData || []);
        setCityName("Zurich"); // Immer eine Stadt zeigen
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
