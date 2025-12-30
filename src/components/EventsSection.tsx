import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import EventCard from "./EventCard";
import { externalSupabase as supabase } from "@/integrations/supabase/externalClient";

// Haversine-Formel: Berechnet Distanz zwischen zwei Koordinaten in km
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

// Grosse Schweizer Staedte
const SWISS_CITIES = [
  { name: "Zurich", lat: 47.3769, lon: 8.5417 },
  { name: "Geneva", lat: 46.2044, lon: 6.1432 },
  { name: "Basel", lat: 47.5596, lon: 7.5886 },
  { name: "Bern", lat: 46.948, lon: 7.4474 },
  { name: "Lausanne", lat: 46.5197, lon: 6.6323 },
  { name: "Winterthur", lat: 47.499, lon: 8.724 },
  { name: "Lucerne", lat: 47.0502, lon: 8.3093 },
  { name: "St. Gallen", lat: 47.4245, lon: 9.3767 },
];

const EventsSection = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [cityName, setCityName] = useState<string>("Zurich");
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -340, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 340, behavior: "smooth" });
    }
  };

  useEffect(() => {
    async function loadNearbyEvents() {
      try {
        // 1. User-Position von IP-API holen
        let userLat: number = 47.3769; // Default: Zurich
        let userLon: number = 8.5417;

        try {
          const locationResponse = await fetch("https://ipapi.co/json/");
          const locationData = await locationResponse.json();

          if (locationData.latitude && locationData.longitude) {
            userLat = locationData.latitude;
            userLon = locationData.longitude;

            // Check country and set Swiss city accordingly
            const countryCode = locationData.country_code;

            if (countryCode === "DE") {
              // User in Deutschland -> Zeige Basel (grenznah)
              userLat = 47.5596;
              userLon = 7.5886;
            }
          }
        } catch (error) {
          console.warn("IP-Location API failed, using fallback", error);
        }

        // 2. Events von HEUTE laden (nur Ticketmaster)
        const today = new Date();
        const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();

        const { data: eventsData, error } = await supabase
          .from("events")
          .select("*")
          .eq("source", "ticketmaster")
          .not("latitude", "is", null)
          .not("longitude", "is", null)
          .gte("start_date", todayStart)
          .lte("start_date", todayEnd)
          .order("start_date", { ascending: true })
          .limit(50);

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

        // 3. Naechste Stadt finden
        let nearestCity = SWISS_CITIES[0];
        let minDistance = Infinity;

        for (const cityItem of SWISS_CITIES) {
          const distance = calculateDistance(userLat, userLon, cityItem.lat, cityItem.lon);
          if (distance < minDistance) {
            minDistance = distance;
            nearestCity = cityItem;
          }
        }

        // Wenn User > 50km von allen Staedten entfernt -> Zeige Zurich
        if (minDistance > 50) {
          nearestCity = SWISS_CITIES[0];
        }

        setCityName(nearestCity.name);

        // 4. Events nach Distanz filtern
        let finalEvents: any[] = [];

        if (eventsData && eventsData.length > 0) {
          const eventsWithDistance = eventsData.map((event: any) => ({
            ...event,
            distance: calculateDistance(nearestCity.lat, nearestCity.lon, event.latitude, event.longitude),
          }));

          eventsWithDistance.sort((a: any, b: any) => a.distance - b.distance);

          // Versuche zuerst 30km, dann 50km, dann 100km, dann alle
          let nearbyEvents = eventsWithDistance.filter((event: any) => event.distance <= 30);
          if (nearbyEvents.length < 8) {
            nearbyEvents = eventsWithDistance.filter((event: any) => event.distance <= 50);
          }
          if (nearbyEvents.length < 8) {
            nearbyEvents = eventsWithDistance.filter((event: any) => event.distance <= 100);
          }
          if (nearbyEvents.length < 8) {
            nearbyEvents = eventsWithDistance; // Alle Events, sortiert nach Distanz
          }

          finalEvents = nearbyEvents.slice(0, 8);
        }

        // KEIN Fallback! Heute ist heute, nicht morgen!
        // Wenn keine Events heute -> Sektion wird nicht angezeigt
        setEvents(finalEvents);
      } catch (error) {
        console.error("Error loading nearby events:", error);
      } finally {
        setLoading(false);
      }
    }

    loadNearbyEvents();
  }, []);

  if (loading) {
    return (
      <section className="bg-background py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-serif text-4xl md:text-5xl text-foreground text-center mb-16 italic">Laedt...</h2>
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <section className="bg-background pt-8 pb-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Title - links wie Weekend */}
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-muted-foreground mb-8 sm:mb-12">
          Heute in deiner Naehe
        </h2>

        {/* Horizontal Scrollable Carousel */}
        <div className="relative group">
          {/* Left Chevron Button */}
          <button
            onClick={scrollLeft}
            className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Scroll left"
          >
            <ChevronLeft size={24} className="text-foreground" />
          </button>

          {/* Right Chevron Button */}
          <button
            onClick={scrollRight}
            className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Scroll right"
          >
            <ChevronRight size={24} className="text-foreground" />
          </button>

          <div ref={scrollContainerRef} className="overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex gap-6 pb-4">
              {events.map((event: any, index: number) => (
                <div
                  key={event.id}
                  className="flex-none w-[280px] sm:w-[320px] opacity-0 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
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
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
