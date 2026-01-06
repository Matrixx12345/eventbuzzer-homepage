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
      <div className="bg-white rounded-2xl overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-stone-300 shadow-md border border-stone-200 grid grid-cols-[55%_45%] h-[280px]">
        {/* Image with premium treatment */}
        <div className="relative overflow-hidden">
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover transition-all duration-500
                       blur-[0.3px] saturate-[1.12] contrast-[1.03] brightness-[1.03] sepia-[0.08]
                       group-hover:scale-105 group-hover:saturate-[1.18] group-hover:sepia-0 group-hover:blur-0" 
          />
          {/* Subtle Vignette */}
          <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.08)] pointer-events-none" />
        </div>
        
        {/* Content */}
        <div className="p-6 flex flex-col relative">
          {/* Premium Accent Line */}
          <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-amber-400/70 via-amber-300/40 to-transparent" />
          
          <h3 className="font-serif text-xl md:text-2xl font-bold text-[#1a1a1a] mb-4 line-clamp-2 leading-tight">{title}</h3>

          <p className="text-[#2d2d2d] font-sans text-[15px] leading-relaxed line-clamp-4 mb-4">{description}</p>

          {/* Location at bottom */}
          <div className="mt-auto pt-3 group/map relative inline-flex items-center gap-1.5 text-stone-500 text-sm cursor-help">
            <span className="text-red-500">📍</span>
            <span className="border-b border-dotted border-stone-300 hover:text-stone-700 transition-colors">{location}</span>

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
  maxEvents = 6
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
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const { data, error } = await supabase
          .from("events")
          .select("*")
          .contains("tags", [tagFilter])
          .not("image_url", "is", null)
          .gte("relevance_score", 50)
          .or(`start_date.is.null,start_date.lte.${nextWeek}`)
          .or(`end_date.is.null,end_date.gte.${today}`)
          .order("relevance_score", { ascending: false })
          .limit(maxEvents * 3);

        if (error) {
          console.error(`Error loading ${tagFilter} events:`, error);
          return;
        }

        const BLACKLIST = [
          "hop-on-hop-off", "hop on hop off", "city sightseeing bus", "stadtrundfahrt bus", 
          "malen wie", "zeichnen wie", "basteln wie", 
          "schafe scheren", "schafschur", "sheep shearing", "schafe werden geschoren",
          "wenn schafe geschoren werden", "wenn schafe geschieden werden",
          "schaf", "sheep", "geschieden", "geschoren",
          "disc golf", "discgolf", "frisbee golf"
        ];
        
        let filtered = (data || []).filter(event => {
          const searchText = `${event.title || ""} ${event.description || ""}`.toLowerCase();
          return !BLACKLIST.some(keyword => searchText.includes(keyword.toLowerCase()));
        });

        const diversified = diversifyEvents(filtered, 2);
        setEvents(diversified.slice(0, maxEvents));
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
      <section className="bg-background py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <h2 className="font-serif text-3xl mb-10 not-italic text-left md:text-4xl text-muted-foreground">
            {title}
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
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <h2 className="font-serif text-3xl mb-10 not-italic text-left md:text-4xl text-muted-foreground">
          {title}
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