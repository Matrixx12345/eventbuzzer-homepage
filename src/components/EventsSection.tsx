import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { externalSupabase as supabase } from "@/integrations/supabase/externalClient";

// Haversine-Formel: Berechnet Distanz zwischen zwei Koordinaten in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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

interface BentoCardProps {
  title: string;
  description?: string;
  image: string;
  venue: string;
  location: string;
  imagePosition: string;
  isTall?: boolean;
  isWide?: boolean;
  slug?: string;
  latitude?: number;
  longitude?: number;
}

const BentoCard = ({
  title,
  description,
  image,
  venue,
  location,
  imagePosition,
  isTall,
  isWide,
  slug,
  latitude,
  longitude,
}: BentoCardProps) => {
  const CardContent = (
    <div className="flex flex-col justify-center p-6 text-center h-full">
      <span className="text-primary text-[10px] font-sans tracking-[0.2em] uppercase mb-2">Premium Highlight</span>
      <h3 className="font-serif text-lg text-white mb-2 line-clamp-2 min-h-[3rem]">{title}</h3>

      <div className="group/map relative inline-flex items-center justify-center gap-1 text-gray-400 text-xs mb-3 cursor-help">
        <span className="text-red-500">üìç</span>
        <span className="border-b border-dotted border-gray-600 hover:text-white transition-colors">{location}</span>

        {latitude && longitude && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover/map:block z-50 animate-in fade-in zoom-in duration-200">
            <div className="bg-white p-2 rounded-xl shadow-2xl border border-gray-200 w-36 h-24 overflow-hidden flex items-center justify-center">
              <div className="relative w-full h-full">
                <img src="/swiss-outline.svg" className="w-full h-full object-contain opacity-20" alt="CH Map" />
                <div
                  className="absolute w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white shadow-sm"
                  style={{
                    left: `${((longitude - 5.9) / (10.5 - 5.9)) * 100}%`,
                    top: `${(1 - (latitude - 45.8) / (47.8 - 45.8)) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div className="w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45 -mt-1.5 mx-auto shadow-sm" />
          </div>
        )}
      </div>

      <p className="text-gray-400 font-sans text-xs mb-2">{venue}</p>
      {description && (
        <p className="text-gray-400 font-sans text-xs leading-relaxed mb-4 line-clamp-2">{description}</p>
      )}

      <div className="mt-auto">
        <span className="inline-block border border-white/20 text-white hover:bg-white/10 text-[10px] px-3 py-1.5 rounded transition-colors uppercase tracking-wider">
          Explore
        </span>
      </div>
    </div>
  );

  const cardBaseClass =
    "bg-neutral-900 rounded-3xl overflow-hidden h-full group transition-all duration-300 hover:ring-1 hover:ring-white/20 shadow-xl";

  if (isWide) {
    return (
      <Link to={`/event/${slug}`} className="block h-full">
        <div className={`${cardBaseClass} grid grid-cols-1 md:grid-cols-2 min-h-[280px]`}>
          <div className="relative h-48 md:h-full overflow-hidden">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          {CardContent}
        </div>
      </Link>
    );
  }

  if (imagePosition === "left" || imagePosition === "right") {
    return (
      <Link to={`/event/${slug}`} className="block h-full">
        <div className={`${cardBaseClass} grid grid-cols-2 min-h-[280px]`}>
          {imagePosition === "left" && (
            <div className="relative overflow-hidden">
              <img
                src={image}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}
          {CardContent}
          {imagePosition === "right" && (
            <div className="relative overflow-hidden">
              <img
                src={image}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/event/${slug}`} className="block h-full">
      <div className={`${cardBaseClass} flex flex-col ${isTall ? "min-h-[580px]" : "min-h-[280px]"}`}>
        <div className={`relative overflow-hidden ${isTall ? "flex-1" : "h-40"}`}>
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="flex-shrink-0">{CardContent}</div>
      </div>
    </Link>
  );
};

const EventsSection = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [cityName, setCityName] = useState<string>("Zurich");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTodayEvents() {
      try {
        // 1. User-Position ermitteln
        let userLat: number = 47.3769;
        let userLon: number = 8.5417;

        try {
          const locationResponse = await fetch("https://ipapi.co/json/");
          const locationData = await locationResponse.json();

          if (locationData.latitude && locationData.longitude) {
            userLat = locationData.latitude;
            userLon = locationData.longitude;

            const countryCode = locationData.country_code;
            if (countryCode === "DE") {
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

        // 3. N√§chste Stadt finden
        let nearestCity = SWISS_CITIES[0];
        let minDistance = Infinity;

        for (const cityItem of SWISS_CITIES) {
          const distance = calculateDistance(userLat, userLon, cityItem.lat, cityItem.lon);
          if (distance < minDistance) {
            minDistance = distance;
            nearestCity = cityItem;
          }
        }

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
          if (nearbyEvents.length < 12) {
            nearbyEvents = eventsWithDistance.filter((event: any) => event.distance <= 50);
          }
          if (nearbyEvents.length < 12) {
            nearbyEvents = eventsWithDistance.filter((event: any) => event.distance <= 100);
          }
          if (nearbyEvents.length < 12) {
            nearbyEvents = eventsWithDistance; // Alle Events, sortiert nach Distanz
          }

          finalEvents = nearbyEvents.slice(0, 12);
        }

        // Fallback: Wenn keine Events von HEUTE oder zu wenige, hole Events der n√§chsten 7 Tage
        if (finalEvents.length < 12) {
          const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

          const { data: fallbackData } = await supabase
            .from("events")
            .select("*")
            .eq("source", "ticketmaster")
            .not("latitude", "is", null)
            .not("longitude", "is", null)
            .gte("start_date", new Date().toISOString())
            .lte("start_date", nextWeek)
            .order("start_date", { ascending: true })
            .limit(50);

          if (fallbackData && fallbackData.length > 0) {
            const eventsWithDistance = fallbackData.map((event: any) => ({
              ...event,
              distance: calculateDistance(nearestCity.lat, nearestCity.lon, event.latitude, event.longitude),
            }));

            eventsWithDistance.sort((a: any, b: any) => a.distance - b.distance);

            // F√ºge fehlende Events hinzu (bis zu 12 insgesamt) - KEIN Distanzfilter beim Fallback!
            const additionalEvents = eventsWithDistance.slice(0, 12 - finalEvents.length);
            finalEvents = [...finalEvents, ...additionalEvents];
          }
        }

        setEvents(finalEvents);
      } catch (error) {
        console.error("Error loading today events:", error);
      } finally {
        setLoading(false);
      }
    }

    loadTodayEvents();
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

  // NICHT VERSTECKEN! Immer anzeigen, auch wenn keine Events
  // if (events.length === 0) {
  //   return null;
  // }

  return (
    <section className="bg-background py-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Intro Text - mittig wie Switzerland Titel */}
        <div className="text-center mb-16">
          <p className="font-serif text-4xl md:text-5xl text-foreground italic flex items-center justify-center gap-2">
            Oder entdecke unsere Auswahl
            <ChevronDown size={24} className="text-primary animate-bounce" />
          </p>
        </div>

        {/* Title - links wie Weekend */}
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-muted-foreground mb-8 sm:mb-12">
          Heute in deiner Naehe
        </h2>

        {/* Grid wie Switzerland */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Event 0: 2-spaltig links */}
          {events[0] && (
            <div className="md:col-span-2">
              <BentoCard
                title={events[0].title}
                description={events[0].description}
                image={events[0].image_url || "/placeholder.jpg"}
                venue={events[0].venue || ""}
                location={events[0].location}
                imagePosition="left"
                slug={events[0].id}
                latitude={events[0].latitude}
                longitude={events[0].longitude}
              />
            </div>
          )}

          {/* Event 2: 1-spaltig tall rechts (2 Reihen hoch) */}
          {events[2] && (
            <div className="md:col-span-1 md:row-span-2">
              <BentoCard
                title={events[2].title}
                description={events[2].description}
                image={events[2].image_url || "/placeholder.jpg"}
                venue={events[2].venue || ""}
                location={events[2].location}
                imagePosition="top"
                isTall
                slug={events[2].id}
                latitude={events[2].latitude}
                longitude={events[2].longitude}
              />
            </div>
          )}

          {/* Event 1: 2-spaltig links (zweite Reihe) */}
          {events[1] && (
            <div className="md:col-span-2">
              <BentoCard
                title={events[1].title}
                description={events[1].description}
                image={events[1].image_url || "/placeholder.jpg"}
                venue={events[1].venue || ""}
                location={events[1].location}
                imagePosition="right"
                slug={events[1].id}
                latitude={events[1].latitude}
                longitude={events[1].longitude}
              />
            </div>
          )}

          {/* Event 3: 1-spaltig */}
          {events[3] && (
            <div className="md:col-span-1">
              <BentoCard
                title={events[3].title}
                description={events[3].description}
                image={events[3].image_url || "/placeholder.jpg"}
                venue={events[3].venue || ""}
                location={events[3].location}
                imagePosition="left"
                slug={events[3].id}
                latitude={events[3].latitude}
                longitude={events[3].longitude}
              />
            </div>
          )}

          {/* Event 4: 1-spaltig */}
          {events[4] && (
            <div className="md:col-span-1">
              <BentoCard
                title={events[4].title}
                description={events[4].description}
                image={events[4].image_url || "/placeholder.jpg"}
                venue={events[4].venue || ""}
                location={events[4].location}
                imagePosition="left"
                slug={events[4].id}
                latitude={events[4].latitude}
                longitude={events[4].longitude}
              />
            </div>
          )}

          {/* Event 5: 1-spaltig */}
          {events[5] && (
            <div className="md:col-span-1">
              <BentoCard
                title={events[5].title}
                description={events[5].description}
                image={events[5].image_url || "/placeholder.jpg"}
                venue={events[5].venue || ""}
                location={events[5].location}
                imagePosition="top"
                slug={events[5].id}
                latitude={events[5].latitude}
                longitude={events[5].longitude}
              />
            </div>
          )}

          {/* Event 6: 1-spaltig */}
          {events[6] && (
            <div className="md:col-span-1">
              <BentoCard
                title={events[6].title}
                description={events[6].description}
                image={events[6].image_url || "/placeholder.jpg"}
                venue={events[6].venue || ""}
                location={events[6].location}
                imagePosition="top"
                slug={events[6].id}
                latitude={events[6].latitude}
                longitude={events[6].longitude}
              />
            </div>
          )}

          {/* Event 7: 1-spaltig */}
          {events[7] && (
            <div className="md:col-span-1">
              <BentoCard
                title={events[7].title}
                description={events[7].description}
                image={events[7].image_url || "/placeholder.jpg"}
                venue={events[7].venue || ""}
                location={events[7].location}
                imagePosition="top"
                slug={events[7].id}
                latitude={events[7].latitude}
                longitude={events[7].longitude}
              />
            </div>
          )}

          {/* Event 8: Interlaken - 1-spaltig links */}
          {events[8] && (
            <div className="md:col-span-1">
              <BentoCard
                title={events[8].title}
                description={events[8].description}
                image={events[8].image_url || "/placeholder.jpg"}
                venue={events[8].venue || ""}
                location={events[8].location}
                imagePosition="top"
                slug={events[8].id}
                latitude={events[8].latitude}
                longitude={events[8].longitude}
              />
            </div>
          )}

          {/* Event 9: Basel - 1-spaltig mitte */}
          {events[9] && (
            <div className="md:col-span-1">
              <BentoCard
                title={events[9].title}
                description={events[9].description}
                image={events[9].image_url || "/placeholder.jpg"}
                venue={events[9].venue || ""}
                location={events[9].location}
                imagePosition="top"
                slug={events[9].id}
                latitude={events[9].latitude}
                longitude={events[9].longitude}
              />
            </div>
          )}

          {/* Event 10: TALL rechts - 2 Zeilen hoch! (L√úCKE GEF√úLLT) */}
          {events[10] && (
            <div className="md:col-span-1 md:row-span-2">
              <BentoCard
                title={events[10].title}
                description={events[10].description}
                image={events[10].image_url || "/placeholder.jpg"}
                venue={events[10].venue || ""}
                location={events[10].location}
                imagePosition="top"
                isTall
                slug={events[10].id}
                latitude={events[10].latitude}
                longitude={events[10].longitude}
              />
            </div>
          )}

          {/* Event 11: Grand Train Tour - 2-spaltig breit unten */}
          {events[11] && (
            <div className="md:col-span-2">
              <BentoCard
                title={events[11].title}
                description={events[11].description}
                image={events[11].image_url || "/placeholder.jpg"}
                venue={events[11].venue || ""}
                location={events[11].location}
                imagePosition="left"
                isWide
                slug={events[11].id}
                latitude={events[11].latitude}
                longitude={events[11].longitude}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
