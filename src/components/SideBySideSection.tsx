import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { externalSupabase as supabase } from "@/integrations/supabase/externalClient";
import { getNearestPlace } from "@/utils/swissPlaces";

interface SideBySideCardProps {
  title: string;
  description: string;
  image: string;
  imagePosition: "left" | "right";
  isTall?: boolean;
  isWide?: boolean;
  location: string;
  latitude?: number;
  longitude?: number;
  categoryLabel?: string;
  ticketUrl?: string;
  onClick?: () => void;
}

const SideBySideCard = ({
  title,
  description,
  image,
  imagePosition,
  isTall,
  isWide,
  location,
  latitude,
  longitude,
  categoryLabel,
  ticketUrl,
  onClick
}: SideBySideCardProps) => {
  const handleClick = (e: React.MouseEvent) => {
    if (!ticketUrl && onClick) {
      e.preventDefault();
      onClick();
    }
  };

  const CardContent = (
    <div className="flex flex-col justify-center p-6 text-center h-full">
      {/* Category Badge */}
      {categoryLabel && (
        <span className="text-primary text-[10px] font-sans tracking-[0.2em] uppercase mb-2">
          {categoryLabel}
        </span>
      )}
      {/* Titel fixiert auf 2 Zeilen */}
      <h3 className="font-serif text-lg text-white mb-2 line-clamp-2 min-h-[3rem]">{title}</h3>

      {/* Location mit Mini-Map Hover */}
      <div className="group/map relative inline-flex items-center justify-center gap-1 text-gray-400 text-xs mb-3 cursor-help">
        <span className="text-red-500">📍</span>
        <span className="border-b border-dotted border-gray-600 hover:text-white transition-colors">{location}</span>

        {/* MINI-MAP TOOLTIP */}
        {latitude && longitude && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover/map:block z-50 animate-in fade-in zoom-in duration-200">
            <div className="bg-white p-2 rounded-xl shadow-2xl border border-gray-200 w-36 h-24 overflow-hidden flex items-center justify-center">
              <div className="relative w-full h-full">
                <img src="/swiss-outline.svg" className="w-full h-full object-contain opacity-20" alt="CH Map" />
                <div 
                  className="absolute w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white shadow-sm" 
                  style={{
                    left: `${(longitude - 5.9) / (10.5 - 5.9) * 100}%`,
                    top: `${(1 - (latitude - 45.8) / (47.8 - 45.8)) * 100}%`
                  }} 
                />
              </div>
            </div>
            <div className="w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45 -mt-1.5 mx-auto shadow-sm" />
          </div>
        )}
      </div>

      <p className="text-gray-400 font-sans text-xs leading-relaxed mb-4 line-clamp-2">{description}</p>
      <div className="mt-auto">
        <span className="inline-block border border-white/20 text-white hover:bg-white/10 text-[10px] px-3 py-1.5 rounded transition-colors uppercase tracking-wider">
          {ticketUrl ? 'Tickets' : 'Entdecken'}
        </span>
      </div>
    </div>
  );

  const cardBaseClass = "bg-neutral-900 rounded-3xl overflow-hidden h-full group transition-all duration-300 hover:ring-1 hover:ring-white/20 shadow-xl";
  
  const Wrapper = ticketUrl ? 'a' : 'div';
  const wrapperProps = ticketUrl 
    ? { href: ticketUrl, target: "_blank", rel: "noopener noreferrer" }
    : {};

  if (isWide) {
    return (
      <Wrapper {...wrapperProps} onClick={handleClick} className="block h-full cursor-pointer">
        <div className={`${cardBaseClass} grid grid-cols-1 md:grid-cols-2 min-h-[280px]`}>
          <div className="relative h-48 md:h-full overflow-hidden">
            <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
          {CardContent}
        </div>
      </Wrapper>
    );
  }

  if (imagePosition === "left" || imagePosition === "right") {
    return (
      <Wrapper {...wrapperProps} onClick={handleClick} className="block h-full cursor-pointer">
        <div className={`${cardBaseClass} grid grid-cols-2 min-h-[280px]`}>
          {imagePosition === "left" && (
            <div className="relative overflow-hidden">
              <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
          )}
          {CardContent}
          {imagePosition === "right" && (
            <div className="relative overflow-hidden">
              <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
          )}
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper {...wrapperProps} onClick={handleClick} className="block h-full cursor-pointer">
      <div className={`${cardBaseClass} flex flex-col ${isTall ? "min-h-[580px]" : "min-h-[280px]"}`}>
        <div className={`relative overflow-hidden ${isTall ? "flex-1" : "h-40"}`}>
          <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
        <div className="flex-shrink-0">{CardContent}</div>
      </div>
    </Wrapper>
  );
};

// Helper to get location
const getEventLocation = (event: any): string => {
  const countryNames = ["schweiz", "switzerland", "suisse", "svizzera", "germany", "deutschland", "france", "frankreich", "austria", "österreich", "italy", "italien", "liechtenstein"];
  const isCountry = (str?: string) => {
    if (!str) return true;
    return countryNames.includes(str.toLowerCase().trim());
  };

  const city = event.address_city?.trim();
  if (city && city.length > 0 && !isCountry(city)) {
    return city;
  }

  if (event.venue_name && event.venue_name.trim() !== event.title.trim() && !isCountry(event.venue_name)) {
    return event.venue_name.trim();
  }

  if (event.location && !isCountry(event.location)) {
    return event.location.trim();
  }

  if (event.latitude && event.longitude) {
    return getNearestPlace(event.latitude, event.longitude);
  }
  return "Schweiz";
};

// Category label mapping
const getCategoryLabel = (categorySubId?: string | string[]): string | undefined => {
  const mapping: Record<string, string> = {
    'museum-kunst': 'Museum',
    'konzert': 'Konzert',
    'theater': 'Theater',
    'sport': 'Sport',
    'festival': 'Festival',
    'outdoor': 'Outdoor',
    'wellness': 'Wellness',
    'family': 'Familie',
    'food': 'Kulinarik',
    'nightlife': 'Nightlife',
    'erlebnisse': 'Erlebnisse',
    'spa': 'Wellness',
    'attraction': 'Attraktion',
  };
  if (!categorySubId) return undefined;
  const subId = Array.isArray(categorySubId) ? categorySubId[0] : categorySubId;
  if (!subId || typeof subId !== 'string') return undefined;
  return mapping[subId] || subId.charAt(0).toUpperCase() + subId.slice(1);
};

interface SideBySideSectionProps {
  title: string;
  tagFilter: string;
  filterParam: string;
  onEventClick?: (eventId: string) => void;
  maxEvents?: number;
}

const SideBySideSection = ({ 
  title, 
  tagFilter,
  filterParam,
  onEventClick,
  maxEvents = 9
}: SideBySideSectionProps) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Diversify events: max N per category to avoid too many spas/thermen
  const diversifyEvents = (events: any[], maxPerCategory: number = 2): any[] => {
    const categoryCounts: Record<string, number> = {};
    return events.filter(event => {
      const cat = event.category_sub_id || 'unknown';
      const catKey = Array.isArray(cat) ? cat[0] : cat;
      categoryCounts[catKey] = (categoryCounts[catKey] || 0) + 1;
      return categoryCounts[catKey] <= maxPerCategory;
    });
  };

  useEffect(() => {
    async function loadEvents() {
      try {
        // Date filtering: only show events that are currently active
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const { data, error } = await supabase
          .from("events")
          .select("*")
          .contains("tags", [tagFilter])
          .not("image_url", "is", null)
          .or(`start_date.is.null,start_date.lte.${nextWeek}`)
          .or(`end_date.is.null,end_date.gte.${today}`)
          .order("relevance_score", { ascending: false })
          .limit(maxEvents * 3); // Fetch more to allow for diversity filtering

        if (error) {
          console.error(`Error loading ${tagFilter} events:`, error);
          return;
        }

        // Apply category diversity: max 2 per category
        const diversified = diversifyEvents(data || [], 2);
        setEvents(diversified.slice(0, maxEvents + 1)); // +1 for the tall card fix
      } catch (error) {
        console.error(`Error loading ${tagFilter} events:`, error);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, [tagFilter, maxEvents]);

  if (loading) {
    return (
      <section className="bg-background py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-serif text-4xl mb-16 not-italic text-left md:text-4xl text-neutral-500">
            {title}
          </h2>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Lädt...</div>
          </div>
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return null;
  }

  // Map events to bento grid layout - need 10 for complete grid
  const bentoEvents = events.slice(0, 10).map((event, index) => ({
    id: event.id,
    title: event.title,
    description: event.description || event.short_description || "",
    image: event.image_url,
    location: getEventLocation(event),
    latitude: event.latitude,
    longitude: event.longitude,
    categoryLabel: getCategoryLabel(event.category_sub_id),
    ticketUrl: event.ticket_link,
    imagePosition: (index % 2 === 0 ? "left" : "right") as "left" | "right",
    isTall: index === 2 || index === 8, // Position 2 and 8 are tall cards
    isWide: index === 9 // Last card is wide
  }));

  return (
    <section className="bg-background py-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-serif text-4xl mb-16 not-italic text-left md:text-4xl text-neutral-500">
          {title}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {bentoEvents[0] && (
            <div className="md:col-span-2">
              <SideBySideCard {...bentoEvents[0]} onClick={() => onEventClick?.(bentoEvents[0].id)} />
            </div>
          )}
          {bentoEvents[2] && (
            <div className="md:col-span-1 md:row-span-2">
              <SideBySideCard {...bentoEvents[2]} isTall onClick={() => onEventClick?.(bentoEvents[2].id)} />
            </div>
          )}
          {bentoEvents[1] && (
            <div className="md:col-span-2">
              <SideBySideCard {...bentoEvents[1]} onClick={() => onEventClick?.(bentoEvents[1].id)} />
            </div>
          )}

          {bentoEvents[3] && (
            <div className="md:col-span-1">
              <SideBySideCard {...bentoEvents[3]} onClick={() => onEventClick?.(bentoEvents[3].id)} />
            </div>
          )}
          {bentoEvents[4] && (
            <div className="md:col-span-1">
              <SideBySideCard {...bentoEvents[4]} onClick={() => onEventClick?.(bentoEvents[4].id)} />
            </div>
          )}
          {bentoEvents[5] && (
            <div className="md:col-span-1">
              <SideBySideCard {...bentoEvents[5]} onClick={() => onEventClick?.(bentoEvents[5].id)} />
            </div>
          )}

          {bentoEvents[6] && (
            <div className="md:col-span-1">
              <SideBySideCard {...bentoEvents[6]} onClick={() => onEventClick?.(bentoEvents[6].id)} />
            </div>
          )}
          {bentoEvents[7] && (
            <div className="md:col-span-1">
              <SideBySideCard {...bentoEvents[7]} onClick={() => onEventClick?.(bentoEvents[7].id)} />
            </div>
          )}
          {/* Tall card in bottom right (1 column, 2 rows) */}
          {bentoEvents[8] && (
            <div className="md:col-span-1 md:row-span-2">
              <SideBySideCard {...bentoEvents[8]} isTall onClick={() => onEventClick?.(bentoEvents[8].id)} />
            </div>
          )}

          {/* Wide card bottom left (2 columns) */}
          {bentoEvents[9] && (
            <div className="md:col-span-2">
              <SideBySideCard {...bentoEvents[9]} isWide onClick={() => onEventClick?.(bentoEvents[9].id)} />
            </div>
          )}
        </div>

        {/* Mehr anzeigen Button */}
        <div className="mt-10 text-center">
          <Link 
            to={`/listings?${filterParam}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground border border-muted-foreground/30 hover:border-foreground/50 px-6 py-2.5 rounded-full transition-all text-sm font-medium"
          >
            Mehr anzeigen
          </Link>
        </div>
      </div>
    </section>
  );
};

export default SideBySideSection;