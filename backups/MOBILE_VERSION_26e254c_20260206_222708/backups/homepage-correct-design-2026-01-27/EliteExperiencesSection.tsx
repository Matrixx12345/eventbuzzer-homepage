import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { externalSupabase } from "@/integrations/supabase/externalClient";
import { supabase as cloudSupabase } from "@/integrations/supabase/client";
import { getNearestPlace } from "@/utils/swissPlaces";
import BuzzTracker from "@/components/BuzzTracker";
import QuickHideButton from "@/components/QuickHideButton";

interface CompactCardProps {
  title: string;
  description: string;
  image: string;
  location: string;
  latitude?: number;
  longitude?: number;
  categoryLabel?: string;
  ticketUrl?: string;
  buzzScore?: number | null;
  eventId?: string;
  externalId?: string;
  onBuzzChange?: (newScore: number) => void;
  onClick?: () => void;
  onHide?: () => void;
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
  buzzScore,
  eventId,
  externalId,
  onBuzzChange,
  onClick,
  onHide
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
          
          {/* Milky Category Pill - top left */}
          {categoryLabel && (
            <div className="absolute top-4 left-4 z-10">
              <span className="bg-white/70 backdrop-blur-sm text-stone-700 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded">
                {categoryLabel}
              </span>
            </div>
          )}
          
          {/* QuickHideButton - bottom right of image */}
          {externalId && onHide && (
            <QuickHideButton externalId={externalId} onHide={onHide} />
          )}
        </div>
        
        {/* Content - am UNTEREN Rand, alles dicht beieinander */}
        <div className="p-4 px-6 flex flex-col justify-end h-full">
          {/* Location - subtle */}
          <div className="group/map relative inline-flex items-center mb-1">
            <span className="text-[11px] font-medium tracking-widest text-stone-400 uppercase">{location}</span>

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

          {/* Title - 1 Zeile default, 2 Zeilen bei hover */}
          <h3 className="font-serif text-xl font-semibold text-[#1a1a1a] mb-2 line-clamp-1 group-hover:line-clamp-2 leading-tight transition-all duration-200">{title}</h3>

          {/* Description - 3 lines */}
          <p className="text-stone-500 text-sm leading-relaxed line-clamp-3">{description}</p>

          {/* BuzzTracker - mit Abstand zur description */}
          <div className="pt-12">
            <BuzzTracker 
              buzzScore={buzzScore} 
              editable={true}
              eventId={eventId}
              externalId={externalId}
              onBuzzChange={onBuzzChange}
            />
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

// Elite-Sektion: IMMER "Must-See" anzeigen
const getCategoryLabel = (_event: any): string => {
  return 'Must-See';
};

interface EliteExperiencesSectionProps {
  onEventClick?: (eventId: string) => void;
}

const EliteExperiencesSection = ({ onEventClick }: EliteExperiencesSectionProps) => {
  // Puffer: Lade doppelt so viele Events wie angezeigt werden
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const maxEvents = 12;
  
  // Sichtbare Events = alle minus versteckte, dann auf maxEvents begrenzen
  const events = allEvents.filter(e => !hiddenIds.has(e.external_id)).slice(0, maxEvents);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

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

        // 1. Lade Events vom externen Supabase
        const { data, error } = await externalSupabase
          .from("events")
          .select("*")
          .eq("hide_from_homepage", false)
          .contains("tags", ["must-see"])
          .not("image_url", "is", null)
          .gte("relevance_score", 50)
          .or(`start_date.is.null,start_date.lte.${nextMonth}`)
          .or(`end_date.is.null,end_date.gte.${today}`)
          .order("relevance_score", { ascending: false })
          .limit(20);

        if (error) {
          console.error("Error loading elite events:", error);
          return;
        }

        // 2. Lade Buzz-Overrides von Lovable Cloud
        const externalIds = (data || []).map(e => e.external_id).filter(Boolean);
        let overridesMap: Record<string, number> = {};
        
        if (externalIds.length > 0) {
          const { data: overrides } = await cloudSupabase
            .from("event_vibe_overrides")
            .select("external_id, buzz_boost")
            .in("external_id", externalIds);
          
          if (overrides) {
            overridesMap = Object.fromEntries(
              overrides
                .filter(o => o.buzz_boost !== null && o.buzz_boost > 10)
                .map(o => [o.external_id, o.buzz_boost])
            );
          }
        }

        // BLACKLIST für unerwünschte Events
        const BLACKLIST = [
          "schaf", "sheep", "geschieden", "geschoren",
          "wenn schafe geschoren werden", "wenn schafe geschieden werden"
        ];
        
        let filtered = (data || []).filter(event => {
          const searchText = `${event.title || ""} ${event.description || ""}`.toLowerCase();
          return !BLACKLIST.some(keyword => searchText.includes(keyword));
        });

        // 3. Wende Overrides an
        filtered = filtered.map(event => ({
          ...event,
          buzz_score: overridesMap[event.external_id] ?? event.buzz_score
        }));

        const diversified = diversifyEvents(filtered, 2);
        setAllEvents(diversified.slice(0, maxEvents * 2));
      } catch (error) {
        console.error("Error loading elite events:", error);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  // 2x2 Grid Navigation
  const eventsPerPage = 4;
  const totalPages = Math.ceil(events.length / eventsPerPage);
  const canScrollPrev = currentPage > 0;
  const canScrollNext = currentPage < totalPages - 1;

  const scrollPrev = useCallback(() => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  }, []);

  const scrollNext = useCallback(() => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  }, [totalPages]);

  // Get current 4 events for 2x2 grid
  const currentEvents = events.slice(currentPage * eventsPerPage, (currentPage + 1) * eventsPerPage);

  if (loading) {
    return (
      <section className="bg-transparent py-8 md:py-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <h2 className="font-serif text-2xl mb-6 not-italic text-left tracking-wide text-foreground/80">
            Die Schweizer Top Erlebnisse:
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[280px] bg-neutral-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return null;
  }

  const cardEvents = currentEvents.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description || event.short_description || "",
    image: event.image_url,
    location: getEventLocation(event),
    latitude: event.latitude,
    longitude: event.longitude,
    categoryLabel: getCategoryLabel(event), // Ganzes Event übergeben
    ticketUrl: event.ticket_link,
    buzzScore: event.buzz_score,
    externalId: event.external_id
  }));

  // Check if we should show "Alle anzeigen" card (on last page with less than 4 events)
  const isLastPage = currentPage === totalPages - 1;
  const showEndCard = isLastPage && cardEvents.length < 4;

  return (
    <section className="bg-transparent py-8 md:py-10">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Title with reduced size and increased letter-spacing - clickable */}
        <Link to="/eventlist1?tags=must-see">
          <h2 className="font-serif text-2xl mb-6 not-italic text-left tracking-wide text-foreground/80 hover:text-foreground transition-colors cursor-pointer">
            Die Schweizer Top Erlebnisse:
          </h2>
        </Link>

        {/* 2x2 Grid Container with Chevrons */}
        <div className="relative">
          {/* Previous Button - zwischen Zeile 1 und 2, IMMER sichtbar */}
          {canScrollPrev && (
            <button
              onClick={scrollPrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-white/70 backdrop-blur-md rounded-full shadow-lg border border-white/40 hover:bg-white/90 transition-colors -ml-4"
              aria-label="Vorherige"
            >
              <ChevronLeft size={28} strokeWidth={2.5} className="text-stone-700" />
            </button>
          )}

          {/* Next Button - zwischen Zeile 1 und 2, IMMER sichtbar */}
          {canScrollNext && (
            <button
              onClick={scrollNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-white/70 backdrop-blur-md rounded-full shadow-lg border border-white/40 hover:bg-white/90 transition-colors -mr-4"
              aria-label="Nächste"
            >
              <ChevronRight size={28} strokeWidth={2.5} className="text-stone-700" />
            </button>
          )}

          {/* 2x2 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cardEvents.map((event) => (
              <CompactCard 
                key={event.id}
                {...event}
                eventId={event.externalId}
                onBuzzChange={(newScore) => {
                  setAllEvents(prev => prev.map(e => 
                    e.id === event.id ? { ...e, buzz_score: newScore } : e
                  ));
                }}
                onClick={() => onEventClick?.(event.id)}
                onHide={() => setHiddenIds(prev => new Set([...prev, event.externalId]))}
              />
            ))}
            
            {/* End Card - "Alle anzeigen" - nur auf letzter Seite wenn Platz */}
            {showEndCard && (
              <Link
                to="/eventlist1?tags=must-see"
                className="flex items-center justify-center h-[280px] bg-white/50 backdrop-blur-sm rounded-2xl border border-stone-200/50 hover:bg-white/70 hover:border-stone-300 transition-all duration-300 group"
              >
                <div className="text-center px-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-stone-200 transition-colors">
                    <ArrowRight size={28} className="text-stone-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <span className="text-lg font-medium text-stone-700 group-hover:text-stone-900">
                    Alle anzeigen
                  </span>
                </div>
              </Link>
            )}
          </div>

          {/* "Alle anzeigen" Link unter dem Grid wenn nicht als Karte angezeigt */}
          {!showEndCard && (
            <div className="flex justify-center mt-6">
              <Link
                to="/eventlist1?tags=must-see"
                className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 font-medium transition-colors group"
              >
                <span>Alle Top Erlebnisse anzeigen</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default EliteExperiencesSection;