import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { externalSupabase as supabase } from "@/integrations/supabase/externalClient";
import { getNearestPlace } from "@/utils/swissPlaces";

interface CompactCardProps {
  title: string;
  description: string;
  image: string;
  location: string;
  latitude?: number;
  longitude?: number;
  categoryLabel?: string;
  ticketUrl?: string;
  onClick?: () => void;
}

const CompactCard = ({
  title,
  description,
  image,
  location,
  latitude,
  longitude,
  categoryLabel,
  ticketUrl,
  onClick
}: CompactCardProps) => {
  const handleClick = (e: React.MouseEvent) => {
    if (!ticketUrl && onClick) {
      e.preventDefault();
      onClick();
    }
  };

  const Wrapper = ticketUrl ? 'a' : 'div';
  const wrapperProps = ticketUrl 
    ? { href: ticketUrl, target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Wrapper {...wrapperProps} onClick={handleClick} className="block cursor-pointer">
      <div className="bg-neutral-900 rounded-2xl overflow-hidden group transition-all duration-300 hover:ring-1 hover:ring-white/20 shadow-lg grid grid-cols-2 h-[200px]">
        {/* Image */}
        <div className="overflow-hidden">
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
        </div>
        
        {/* Content */}
        <div className="p-4 flex flex-col justify-center">
          {categoryLabel && (
            <span className="text-primary text-[9px] font-sans tracking-[0.2em] uppercase mb-1.5 block">
              {categoryLabel}
            </span>
          )}
          <h3 className="font-serif text-sm md:text-base text-white mb-1.5 line-clamp-2 leading-tight">{title}</h3>

          <div className="group/map relative inline-flex items-center gap-1 text-gray-400 text-[10px] mb-1.5 cursor-help">
            <span className="text-red-500">📍</span>
            <span className="border-b border-dotted border-gray-600 hover:text-white transition-colors">{location}</span>

            {latitude && longitude && (
              <div className="absolute bottom-full left-0 mb-3 hidden group-hover/map:block z-50 animate-in fade-in zoom-in duration-200">
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
                <div className="w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45 -mt-1.5 ml-4 shadow-sm" />
              </div>
            )}
          </div>

          <p className="text-gray-400 font-sans text-[11px] leading-relaxed line-clamp-2">{description}</p>
        </div>
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
const getCategoryLabel = (categorySubId?: string): string | undefined => {
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
  };
  if (!categorySubId) return 'Must-See';
  return mapping[categorySubId] || 'Must-See';
};

interface EliteExperiencesSectionProps {
  onEventClick?: (eventId: string) => void;
}

const EliteExperiencesSection = ({ onEventClick }: EliteExperiencesSectionProps) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Diversify events: max N per category
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
        const today = new Date().toISOString().split('T')[0];
        const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const { data, error } = await supabase
          .from("events")
          .select("*")
          .contains("tags", ["elite"])
          .not("image_url", "is", null)
          .or(`start_date.is.null,start_date.lte.${nextMonth}`)
          .or(`end_date.is.null,end_date.gte.${today}`)
          .order("relevance_score", { ascending: false })
          .limit(20);

        if (error) {
          console.error("Error loading elite events:", error);
          return;
        }

        const diversified = diversifyEvents(data || [], 2);
        setEvents(diversified.slice(0, 6));
      } catch (error) {
        console.error("Error loading elite events:", error);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  if (loading) {
    return (
      <section className="bg-background py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-12 sm:px-16 lg:px-24">
          <h2 className="font-serif text-4xl mb-10 not-italic text-left md:text-4xl text-neutral-500">
            Die Schweizer Top Erlebnisse:
          </h2>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-[280px] bg-neutral-800 rounded-3xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return null;
  }

  const cardEvents = events.slice(0, 6).map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description || event.short_description || "",
    image: event.image_url,
    location: getEventLocation(event),
    latitude: event.latitude,
    longitude: event.longitude,
    categoryLabel: getCategoryLabel(event.category_sub_id),
    ticketUrl: event.ticket_link
  }));

  return (
    <section className="bg-background py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-12 sm:px-16 lg:px-24">
        <h2 className="font-serif text-4xl mb-10 not-italic text-left md:text-4xl text-neutral-500">
          Die Schweizer Top Erlebnisse:
        </h2>

        {/* 2-Spalten Grid mit vertikalen Karten */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cardEvents.map((event) => (
            <CompactCard 
              key={event.id}
              {...event}
              onClick={() => onEventClick?.(event.id)}
            />
          ))}
        </div>

        {/* Mehr anzeigen Button */}
        <div className="mt-10 text-center">
          <Link 
            to="/listings?tags=elite"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground border border-muted-foreground/30 hover:border-foreground/50 px-6 py-2.5 rounded-full transition-all text-sm font-medium"
          >
            Mehr anzeigen
          </Link>
        </div>
      </div>
    </section>
  );
};

export default EliteExperiencesSection;