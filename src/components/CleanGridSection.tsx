import { useEffect, useState, useCallback } from "react";
import { Heart, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useFavorites } from "@/contexts/FavoritesContext";
import { externalSupabase as supabase } from "@/integrations/supabase/externalClient";
import { supabase as cloudSupabase } from "@/integrations/supabase/client";
import { getNearestPlace } from "@/utils/swissPlaces";
import BuzzTracker from "@/components/BuzzTracker";
import QuickHideButton from "@/components/QuickHideButton";
import useEmblaCarousel from "embla-carousel-react";

interface CleanGridCardProps {
  id: string;
  image: string;
  title: string;
  location: string;
  slug?: string;
  latitude?: number;
  longitude?: number;
  categoryLabel?: string;
  buzzScore?: number | null;
  externalId?: string;
  onBuzzChange?: (newScore: number) => void;
  onClick?: () => void;
  onHide?: () => void;
}

const CleanGridCard = ({
  id,
  image,
  title,
  location,
  slug,
  latitude,
  longitude,
  categoryLabel,
  buzzScore,
  externalId,
  onBuzzChange,
  onClick,
  onHide
}: CleanGridCardProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isCurrentlyFavorite = isFavorite(id);
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick) {
      onClick();
    }
  };
  
  return (
    <div onClick={handleClick} className="block h-full cursor-pointer flex-shrink-0 w-full">
      <article className="relative h-full rounded-2xl overflow-hidden group">
        {/* Background Image with premium treatment */}
        <div className="absolute inset-0">
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover transition-all duration-500
                       blur-[0.3px] saturate-[1.12] contrast-[1.03] brightness-[1.03] sepia-[0.08]
                       group-hover:scale-105 group-hover:saturate-[1.18] group-hover:sepia-0 group-hover:blur-0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          {/* Subtle Vignette for premium look */}
          <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.08)] pointer-events-none" />
          
          {/* QuickHideButton - bottom right of image */}
          {externalId && onHide && (
            <QuickHideButton externalId={externalId} onHide={onHide} />
          )}
        </div>

        {/* Category Badge - Milky Look */}
        {categoryLabel && (
          <div className="absolute top-4 left-4 z-10">
            <span className="bg-white/70 backdrop-blur-sm text-stone-700 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded">
              {categoryLabel}
            </span>
          </div>
        )}

        {/* Favorite Button */}
        <button 
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite({
              id,
              slug,
              image,
              title,
              venue: "",
              location
            });
          }} 
          className="absolute top-4 right-4 p-2 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/40 transition-colors z-10" 
          aria-label={isCurrentlyFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart size={18} className={isCurrentlyFavorite ? "fill-red-500 text-red-500" : "text-white"} />
        </button>

        {/* Content - Titel, Ort und BuzzTracker */}
        <div className="relative h-full flex flex-col justify-end p-5">
          <h3 className="font-serif text-white text-xl lg:text-2xl font-semibold leading-tight mb-1 line-clamp-2">
            {title}
          </h3>
          
          {/* Location mit Mini-Map Hover */}
          <div className="group/map relative inline-flex items-center gap-1 text-white/80 text-sm cursor-help mb-2">
            <span className="border-b border-dotted border-white/40 hover:text-white transition-colors">
              {location}
            </span>

            {/* MINI-MAP TOOLTIP */}
            {latitude && longitude && (
              <div className="absolute bottom-full left-0 mb-3 hidden group-hover/map:block z-50 animate-in fade-in zoom-in duration-200">
                <div className="bg-white p-2 rounded-xl shadow-2xl border border-gray-200 w-40 h-28 overflow-hidden flex items-center justify-center">
                  <div className="relative w-full h-full">
                    <img src="/swiss-outline.svg" className="w-full h-full object-contain opacity-20" alt="CH Map" />
                    <div 
                      className="absolute w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white shadow-sm shadow-black/50" 
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

          {/* BuzzTracker */}
          <BuzzTracker 
            buzzScore={buzzScore} 
            editable={true}
            eventId={id}
            externalId={externalId}
            onBuzzChange={onBuzzChange}
          />
        </div>
      </article>
    </div>
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

// Intelligente Kategorie-Erkennung mit includes() und Tag-Fallback
const getCategoryLabel = (event: any): string | undefined => {
  const subCat = (event.category_sub_id || event.sub_category || '').toString().toLowerCase();
  const tags = Array.isArray(event.tags) ? event.tags.join(' ').toLowerCase() : '';
  const title = (event.title || '').toLowerCase();
  const combined = `${subCat} ${tags} ${title}`;
  
  // Exakte und Teil-Matches für Kategorien
  if (combined.includes('museum') || combined.includes('kunst') || combined.includes('galer') || combined.includes('ausstellung')) return 'Museum';
  if (combined.includes('wanderung') || combined.includes('trail') || combined.includes('hike')) return 'Wanderung';
  if (combined.includes('wellness') || combined.includes('spa') || combined.includes('therm') || combined.includes('bad')) return 'Wellness';
  if (combined.includes('natur') || combined.includes('park') || combined.includes('garten') || combined.includes('wald')) return 'Natur';
  if (combined.includes('sehenswürdig') || combined.includes('attraction')) return 'Ausflug';
  if (combined.includes('schloss') || combined.includes('burg') || combined.includes('castle')) return 'Schloss';
  if (combined.includes('kirche') || combined.includes('kloster') || combined.includes('dom') || combined.includes('münster')) return 'Kultur';
  if (combined.includes('zoo') || combined.includes('tier') || combined.includes('aquar')) return 'Tierpark';
  if (combined.includes('familie') || combined.includes('kinder') || combined.includes('family')) return 'Familie';
  if (combined.includes('wissenschaft') || combined.includes('technik') || combined.includes('science') || combined.includes('planetar')) return 'Science';
  if (combined.includes('konzert') || combined.includes('music') || combined.includes('live')) return 'Konzert';
  if (combined.includes('theater') || combined.includes('oper') || combined.includes('bühne')) return 'Theater';
  if (combined.includes('sport')) return 'Sport';
  if (combined.includes('festival') || combined.includes('fest')) return 'Festival';
  if (combined.includes('food') || combined.includes('kulinar') || combined.includes('gastro') || combined.includes('wein') || combined.includes('käse')) return 'Kulinarik';
  if (combined.includes('nightlife') || combined.includes('party') || combined.includes('club')) return 'Nightlife';
  if (combined.includes('aussicht') || combined.includes('view') || combined.includes('panorama') || combined.includes('berg')) return 'Aussicht';
  if (combined.includes('see') || combined.includes('lake') || combined.includes('schiff')) return 'See';
  if (combined.includes('bahn') || combined.includes('zug') || combined.includes('train')) return 'Bahn';
  if (combined.includes('altstadt') || combined.includes('city') || combined.includes('stadt')) return 'Stadt';
  if (combined.includes('erlebnis')) return 'Erlebnis';
  
  // Fallback für myswitzerland: "Ausflug" als Default
  if (event.source === 'myswitzerland') return 'Ausflug';
  
  return undefined;
};

interface CleanGridSectionProps {
  title: string;
  tagFilter?: string;
  filterParam?: string;
  sourceFilter?: string;
  onEventClick?: (eventId: string) => void;
  maxEvents?: number;
}

const CleanGridSection = ({ 
  title, 
  tagFilter,
  filterParam,
  sourceFilter,
  onEventClick,
  maxEvents = 10
}: CleanGridSectionProps) => {
  // Puffer: Lade doppelt so viele Events wie angezeigt werden
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  
  // Sichtbare Events = alle minus versteckte, dann auf maxEvents begrenzen
  const events = allEvents.filter(e => !hiddenIds.has(e.external_id)).slice(0, maxEvents);
  const [loading, setLoading] = useState(true);

  // Embla Carousel - zeigt exakt 3 volle Karten
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: "start",
    containScroll: "trimSnaps",
    dragFree: false,
    slidesToScroll: 3,
  });
  
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

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

        let query = supabase
          .from("events")
          .select("*")
          .eq("hide_from_homepage", false)
          .not("image_url", "is", null)
          .gte("relevance_score", 50)
          .or(`start_date.is.null,start_date.lte.${nextWeek}`)
          .or(`end_date.is.null,end_date.gte.${today}`)
          .order("relevance_score", { ascending: false })
          .limit(maxEvents * 5);

        if (tagFilter) {
          query = query.contains("tags", [tagFilter]);
        }
        
        if (sourceFilter) {
          query = query.eq("source", sourceFilter);
        }

        const { data, error } = await query;

        if (error) {
          console.error(`Error loading events:`, error);
          return;
        }

        // Lade Buzz-Overrides von Lovable Cloud
        const externalIds = (data || []).map(e => e.external_id).filter(Boolean);
        let overridesMap: Record<string, number> = {};
        
        if (externalIds.length > 0) {
          const { data: overrides } = await cloudSupabase
            .from("event_vibe_overrides")
            .select("external_id, buzz_boost")
            .in("external_id", externalIds);
          
          if (overrides) {
            // Nur Werte > 10 sind absolute Scores (neue Logik)
            overridesMap = Object.fromEntries(
              overrides
                .filter(o => o.buzz_boost !== null && o.buzz_boost > 10)
                .map(o => [o.external_id, o.buzz_boost])
            );
          }
        }

        // FILTER: Entferne schlechte/saisonale Events - erweiterte Blacklist
        const BLACKLIST = [
          "hop-on-hop-off", "hop on hop off", "city sightseeing bus", "stadtrundfahrt bus", 
          "malen wie", "zeichnen wie", "basteln wie", 
          "schafe scheren", "schafschur", "sheep shearing", "schafe werden geschoren",
          "wenn schafe geschoren werden", "wenn schafe geschieden werden",
          "schaf", "sheep", "geschieden", "geschoren",
          "disc golf", "discgolf", "frisbee golf"
        ];
        
        // Zusätzlicher exakter Titel-Check für hartnäckige Events
        const TITLE_BLACKLIST = [
          "wenn schafe geschoren werden",
          "wenn schafe geschieden werden",
          "schafschur",
          "sheep shearing"
        ];
        
        let filtered = (data || []).filter(event => {
          const searchText = `${event.title || ""} ${event.description || ""}`.toLowerCase();
          const titleLower = (event.title || "").toLowerCase();
          
          const isBlacklisted = BLACKLIST.some(keyword => searchText.includes(keyword.toLowerCase()));
          const isTitleBlocked = TITLE_BLACKLIST.some(t => titleLower.includes(t));
          
          return !isBlacklisted && !isTitleBlocked;
        });

        // Wende Buzz-Overrides an
        filtered = filtered.map(event => ({
          ...event,
          buzz_score: overridesMap[event.external_id] ?? event.buzz_score
        }));

        // Apply category diversity: max 2 per category
        filtered = diversifyEvents(filtered, 2);

        // Fallback: Falls zu wenige Events, Diversifizierung lockern (3 pro Kategorie)
        if (filtered.length < maxEvents) {
          const refiltered = (data || []).filter(event => {
            const searchText = `${event.title || ""} ${event.description || ""}`.toLowerCase();
            const titleLower = (event.title || "").toLowerCase();
            const isBlacklisted = BLACKLIST.some(keyword => searchText.includes(keyword.toLowerCase()));
            const isTitleBlocked = TITLE_BLACKLIST.some(t => titleLower.includes(t));
            return !isBlacklisted && !isTitleBlocked;
          });
          filtered = diversifyEvents(refiltered, 3);
        }

        setAllEvents(filtered.slice(0, maxEvents * 2));
      } catch (error) {
        console.error(`Error loading events:`, error);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, [tagFilter, sourceFilter, maxEvents]);

  if (loading) {
    return (
      <section className="py-8 md:py-10 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <h2 className="text-2xl md:text-2xl font-serif text-foreground/80 mb-6 tracking-wide">
            {title}
          </h2>
          <div className="flex gap-6 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[300px] md:w-[320px] h-[320px] bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return null;
  }

  const gridEvents = events.slice(0, maxEvents).map(event => ({
    id: event.id,
    image: event.image_url,
    title: event.title,
    location: getEventLocation(event),
    slug: event.id,
    latitude: event.latitude,
    longitude: event.longitude,
    categoryLabel: getCategoryLabel(event), // Ganzes Event übergeben für intelligente Erkennung
    buzzScore: event.buzz_score,
    externalId: event.external_id
  }));

  return (
    <section className="py-8 md:py-10 bg-transparent">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Title with reduced size and increased letter-spacing */}
        <h2 className="text-2xl md:text-2xl font-serif text-foreground/80 mb-6 tracking-wide">
          {title}
        </h2>

        {/* Carousel Container */}
        <div className="relative">
          {/* Previous Button - Glassmorphism, IMMER sichtbar */}
          {canScrollPrev && (
            <button
              onClick={scrollPrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-white/70 backdrop-blur-md rounded-full shadow-lg border border-white/40 hover:bg-white/90 transition-colors -ml-4"
              aria-label="Vorherige"
            >
              <ChevronLeft size={28} strokeWidth={2.5} className="text-stone-700" />
            </button>
          )}

          {/* Next Button - Glassmorphism, IMMER sichtbar */}
          {canScrollNext && (
            <button
              onClick={scrollNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-white/70 backdrop-blur-md rounded-full shadow-lg border border-white/40 hover:bg-white/90 transition-colors -mr-4"
              aria-label="Nächste"
            >
              <ChevronRight size={28} strokeWidth={2.5} className="text-stone-700" />
            </button>
          )}

          {/* Embla Viewport - Nur 3 volle Karten */}
          <div className="overflow-hidden relative" ref={emblaRef}>
            <div className="flex gap-5">
              {gridEvents.slice(0, 9).map((event) => (
                <div key={event.id} className="h-[320px] flex-shrink-0 w-[calc(33.333%-14px)] min-w-[280px]">
                  <CleanGridCard 
                    {...event} 
                    onClick={() => onEventClick?.(event.id)}
                    onBuzzChange={(newScore) => {
                      setAllEvents(prev => prev.map(e => 
                        e.id === event.id ? { ...e, buzz_score: newScore } : e
                      ));
                    }}
                    onHide={() => setHiddenIds(prev => new Set([...prev, event.externalId]))}
                  />
                </div>
              ))}
              
              {/* End Card - "Alle anzeigen" */}
              {filterParam && (
                <div className="flex-shrink-0 w-[calc(33.333%-14px)] min-w-[280px]">
                  <Link 
                    to={`/listings?${filterParam}`}
                    className="flex items-center justify-center h-[320px] bg-white/50 backdrop-blur-sm rounded-2xl border border-stone-200/50 hover:bg-white/70 hover:border-stone-300 transition-all duration-300 group"
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
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CleanGridSection;
