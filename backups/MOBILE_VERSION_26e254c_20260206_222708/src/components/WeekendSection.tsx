import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { externalSupabase as supabase } from "@/integrations/supabase/externalClient";

// Helper function to get nearest Swiss city from coordinates
const getNearestPlace = (lat: number, lng: number): string => {
  const places = [{
    name: "Z√ºrich",
    lat: 47.3769,
    lng: 8.5417
  }, {
    name: "Bern",
    lat: 46.948,
    lng: 7.4474
  }, {
    name: "Basel",
    lat: 47.5596,
    lng: 7.5886
  }, {
    name: "Luzern",
    lat: 47.0502,
    lng: 8.3093
  }, {
    name: "Genf",
    lat: 46.2044,
    lng: 6.1432
  }, {
    name: "Lausanne",
    lat: 46.5197,
    lng: 6.6323
  }, {
    name: "Winterthur",
    lat: 47.4984,
    lng: 8.7246
  }, {
    name: "St. Gallen",
    lat: 47.4245,
    lng: 9.3767
  }, {
    name: "Lugano",
    lat: 46.0037,
    lng: 8.9511
  }];
  let nearest = places[0];
  let minDistance = Infinity;
  places.forEach(place => {
    const distance = Math.sqrt(Math.pow((lat - place.lat) * 111, 2) + Math.pow((lng - place.lng) * 85, 2));
    if (distance < minDistance) {
      minDistance = distance;
      nearest = place;
    }
  });
  return nearest.name;
};
interface WeekendCardProps {
  id: string;
  image: string;
  title: string;
  description?: string;
  venue: string;
  location: string;
  isLarge?: boolean;
  slug?: string;
  latitude?: number;
  longitude?: number;
  onClick?: () => void;
}
const WeekendCard = ({
  id,
  image,
  title,
  description,
  venue,
  location,
  isLarge = false,
  slug,
  latitude,
  longitude,
  onClick
}: WeekendCardProps) => {
  const {
    isFavorite,
    toggleFavorite
  } = useFavorites();
  const isCurrentlyFavorite = isFavorite(id);
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick) {
      onClick();
    }
  };
  
  return <div onClick={handleClick} className="block h-full cursor-pointer">
      <article className="relative h-full bg-card rounded-2xl overflow-hidden group">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-card/95 via-card/60 to-transparent" />
        </div>

        {/* Favorite Button */}
        <button onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite({
          id,
          slug,
          image,
          title,
          venue,
          location
        });
      }} className="absolute top-4 right-4 p-2 rounded-full bg-card/20 backdrop-blur-sm hover:bg-card/40 transition-colors z-10" aria-label={isCurrentlyFavorite ? "Remove from favorites" : "Add to favorites"}>
          <Heart size={20} className={isCurrentlyFavorite ? "fill-red-500 text-red-500" : "text-card-foreground"} />
        </button>

        {/* Content */}
        <div className="relative h-full flex flex-col justify-end p-5">
          <span className="text-primary text-xs font-semibold tracking-wider mb-2">PREMIUM SELECTION</span>
          <h3 className="font-serif text-card-foreground text-xl lg:text-2xl font-semibold leading-tight mb-2 line-clamp-2">
            {title}
          </h3>
          {description && isLarge && <p className="text-gray-100 text-sm mb-4 line-clamp-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {description}
            </p>}
          <div className="mb-4">
            <p className="text-muted-foreground text-sm">{venue}</p>

            {/* Location mit Mini-Map Hover */}
            <div className="group/map relative inline-flex items-center gap-1 text-muted-foreground text-sm cursor-help">
              <span className="border-b border-dotted border-muted-foreground/50 hover:text-white transition-colors">
                {location}
              </span>

              {/* MINI-MAP TOOLTIP */}
              {latitude && longitude && <div className="absolute bottom-full left-0 mb-3 hidden group-hover/map:block z-50 animate-in fade-in zoom-in duration-200">
                  <div className="bg-white p-2 rounded-xl shadow-2xl border border-gray-200 w-40 h-28 overflow-hidden flex items-center justify-center">
                    <div className="relative w-full h-full">
                      <img src="/swiss-outline.svg" className="w-full h-full object-contain opacity-20" alt="CH Map" />
                      <div className="absolute w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white shadow-sm shadow-black/50" style={{
                    left: `${(longitude - 5.9) / (10.5 - 5.9) * 100}%`,
                    top: `${(1 - (latitude - 45.8) / (47.8 - 45.8)) * 100}%`
                  }} />
                    </div>
                  </div>
                  <div className="w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45 -mt-1.5 ml-4 shadow-sm" />
                </div>}
            </div>
          </div>
          {isLarge && <span className="w-fit bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2.5 rounded-md transition-colors">
              Book Now
            </span>}
        </div>
      </article>
    </div>;
};

// Helper to get location - same logic as Discover page
const getEventLocation = (event: any): string => {
  const countryNames = ["schweiz", "switzerland", "suisse", "svizzera", "germany", "deutschland", "france", "frankreich", "austria", "√∂sterreich", "italy", "italien", "liechtenstein"];
  const isCountry = (str?: string) => {
    if (!str) return true;
    return countryNames.includes(str.toLowerCase().trim());
  };

  // 1. Try address_city first
  const city = event.address_city?.trim();
  if (city && city.length > 0 && !isCountry(city)) {
    return city;
  }

  // 2. Try venue_name
  if (event.venue_name && event.venue_name.trim() !== event.title.trim() && !isCountry(event.venue_name)) {
    return event.venue_name.trim();
  }

  // 3. Try location field
  if (event.location && !isCountry(event.location)) {
    return event.location.trim();
  }

  // 4. Calculate from GPS coordinates
  if (event.latitude && event.longitude) {
    return getNearestPlace(event.latitude, event.longitude);
  }
  return "Schweiz";
};
interface WeekendSectionProps {
  onEventClick?: (eventId: string) => void;
}

const WeekendSection = ({ onEventClick }: WeekendSectionProps) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function loadWeekendEvents() {
      try {
        // Load top 12 MySwitzerland events by score (mehr laden wegen Filter)
        const {
          data,
          error
        } = await supabase.from("events").select("*").eq("source", "myswitzerland").not("image_url", "is", null).order("relevance_score", {
          ascending: false
        }).limit(12);
        if (error) {
          console.error("Error loading weekend events:", error);
          return;
        }

        // FILTER: Entferne schlechte Events
        const BLACKLIST = ["hop-on-hop-off", "hop on hop off", "city sightseeing bus", "stadtrundfahrt bus", "malen wie", "zeichnen wie", "basteln wie"];
        const filtered = (data || []).filter(event => {
          const searchText = `${event.title || ""} ${event.description || ""}`.toLowerCase();
          const isBlacklisted = BLACKLIST.some(keyword => searchText.includes(keyword.toLowerCase()));
          return !isBlacklisted;
        });
        setEvents(filtered.slice(0, 8));
      } catch (error) {
        console.error("Error loading weekend events:", error);
      } finally {
        setLoading(false);
      }
    }
    loadWeekendEvents();
  }, []);
  
  if (loading) {
    return <section className="py-12 sm:py-16 lg:py-20 pb-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-5xl font-serif text-muted-foreground mb-8 sm:mb-12 sm:text-3xl">Verpasse nicht an diesemWochenende</h2>
        </div>
      </section>;
  }
  if (events.length === 0) {
    return null;
  }

  // Map events to grid layout
  const weekendEvents = {
    row1: {
      large: events[0] ? {
        id: events[0].id,
        image: events[0].image_url,
        title: events[0].title,
        description: events[0].description,
        venue: events[0].venue_name || "Venue",
        location: getEventLocation(events[0]),
        slug: events[0].id,
        latitude: events[0].latitude,
        longitude: events[0].longitude
      } : null,
      small: [events[1] ? {
        id: events[1].id,
        image: events[1].image_url,
        title: events[1].title,
        venue: events[1].venue_name || "Venue",
        location: getEventLocation(events[1]),
        slug: events[1].id,
        latitude: events[1].latitude,
        longitude: events[1].longitude
      } : null, events[2] ? {
        id: events[2].id,
        image: events[2].image_url,
        title: events[2].title,
        venue: events[2].venue_name || "Venue",
        location: getEventLocation(events[2]),
        slug: events[2].id,
        latitude: events[2].latitude,
        longitude: events[2].longitude
      } : null].filter(Boolean)
    },
    row2: [events[3] ? {
      id: events[3].id,
      image: events[3].image_url,
      title: events[3].title,
      description: events[3].description,
      venue: events[3].venue_name || "Venue",
      location: getEventLocation(events[3]),
      slug: events[3].id,
      latitude: events[3].latitude,
      longitude: events[3].longitude
    } : null, events[4] ? {
      id: events[4].id,
      image: events[4].image_url,
      title: events[4].title,
      venue: events[4].venue_name || "Venue",
      location: getEventLocation(events[4]),
      slug: events[4].id,
      latitude: events[4].latitude,
      longitude: events[4].longitude
    } : null].filter(Boolean),
    row3: {
      small: [events[5] ? {
        id: events[5].id,
        image: events[5].image_url,
        title: events[5].title,
        venue: events[5].venue_name || "Venue",
        location: getEventLocation(events[5]),
        slug: events[5].id,
        latitude: events[5].latitude,
        longitude: events[5].longitude
      } : null, events[6] ? {
        id: events[6].id,
        image: events[6].image_url,
        title: events[6].title,
        venue: events[6].venue_name || "Venue",
        location: getEventLocation(events[6]),
        slug: events[6].id,
        latitude: events[6].latitude,
        longitude: events[6].longitude
      } : null].filter(Boolean),
      large: events[7] ? {
        id: events[7].id,
        image: events[7].image_url,
        title: events[7].title,
        description: events[7].description,
        venue: events[7].venue_name || "Venue",
        location: getEventLocation(events[7]),
        slug: events[7].id,
        latitude: events[7].latitude,
        longitude: events[7].longitude
      } : null
    }
  };
  
  return <section className="py-12 sm:py-16 lg:py-20 pb-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-serif text-muted-foreground mb-8 sm:mb-12 lg:text-3xl">Verpasse nicht an diesem Wochenende:</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-auto">
          {weekendEvents.row1.large && <div className="h-[500px] lg:h-[520px]">
              <WeekendCard {...weekendEvents.row1.large} isLarge onClick={() => onEventClick?.(weekendEvents.row1.large!.id)} />
            </div>}

          <div className="flex flex-col gap-6 h-[500px] lg:h-[520px]">
            {weekendEvents.row1.small.map((event: any, index: number) => <div key={index} className="flex-1">
                <WeekendCard {...event} onClick={() => onEventClick?.(event.id)} />
              </div>)}
          </div>

          {weekendEvents.row2[0] && <div className="h-[400px]">
              <WeekendCard {...weekendEvents.row2[0]} isLarge onClick={() => onEventClick?.(weekendEvents.row2[0]!.id)} />
            </div>}

          {weekendEvents.row2[1] && <div className="h-[400px]">
              <WeekendCard {...weekendEvents.row2[1]} onClick={() => onEventClick?.(weekendEvents.row2[1]!.id)} />
            </div>}

          <div className="flex flex-col gap-6 h-[500px] lg:h-[520px]">
            {weekendEvents.row3.small.map((event: any, index: number) => <div key={index} className="flex-1">
                <WeekendCard {...event} onClick={() => onEventClick?.(event.id)} />
              </div>)}
          </div>

          {weekendEvents.row3.large && <div className="h-[500px] lg:h-[520px]">
              <WeekendCard {...weekendEvents.row3.large} isLarge onClick={() => onEventClick?.(weekendEvents.row3.large!.id)} />
            </div>}
        </div>
      </div>
    </section>;
};
export default WeekendSection;