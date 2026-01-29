import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import { SITE_URL } from "@/config/constants";
import ListingsFilterBar from "@/components/ListingsFilterBar";
import { externalSupabase } from "@/integrations/supabase/externalClient";
import { useFavorites } from "@/contexts/FavoritesContext";
import { Heart, MapPin, Maximize2, Minimize2, X, ShoppingCart } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import EventsMap from "@/components/EventsMap";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { toggleFavoriteApi } from "@/services/favorites";
import ChatbotPopupRight from "@/components/ChatbotPopupRight";
import { getLocationWithMajorCity } from "@/utils/swissPlaces";
import { useEventData } from "@/hooks/useEventData";
import { useEventFilters } from "@/hooks/useEventFilters";
import {
  getEventLocation,
  convertToUmlauts,
  getCategoryLabel,
  exportToCalendar,
  calculateDistance,
  CITY_COORDINATES,
} from "@/utils/eventUtilities";
import { EventDetailModal } from "@/components/EventDetailModal";

// Placeholder images
import eventAbbey from "@/assets/event-abbey.jpg";
import eventVenue from "@/assets/event-venue.jpg";
import eventConcert from "@/assets/event-concert.jpg";
import swissZurich from "@/assets/swiss-zurich.jpg";

const placeholderImages = [eventAbbey, eventVenue, eventConcert, swissZurich];
const getPlaceholderImage = (index: number) => placeholderImages[index % placeholderImages.length];

interface Event {
  id: string;
  external_id?: string;
  title: string;
  description?: string;
  short_description?: string;
  location?: string;
  venue_name?: string;
  address_city?: string;
  start_date?: string;
  end_date?: string;
  image_url?: string;
  price_from?: number;
  price_to?: number;
  latitude?: number;
  longitude?: number;
  tags?: string[];
  source?: string;
  relevance_score?: number;
  buzz_score?: number;
  buzz_boost?: number | string;
  favorite_count?: number;
  category_main_id?: number;
  category_sub_id?: number;
  gallery_urls?: string[];
  url?: string;
  ticket_url?: string;
}

interface TaxonomyItem {
  id: number;
  slug: string;
  name: string;
  type: "main" | "sub";
  parent_id: number | null;
  display_order?: number;
  is_active?: boolean;
}


// Event Card Component - Opens Modal on Click
const EventCard = ({
  event,
  index,
  isFavorited,
  onToggleFavorite,
  onEventClick,
  nearbyEventsFilter,
  setNearbyEventsFilter,
  setCurrentPage,
  setDisplayedEventsCount,
}: {
  event: Event;
  index: number;
  isFavorited: boolean;
  onToggleFavorite: (event: Event) => void;
  onEventClick: (event: Event) => void;
  nearbyEventsFilter: string | null;
  setNearbyEventsFilter: (id: string | null) => void;
  setCurrentPage: (page: number) => void;
  setDisplayedEventsCount: (count: number) => void;
}) => {
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const imageUrl = event.image_url || getPlaceholderImage(index);

  // Location formatieren - EXAKT wie auf "Alle Events" Seite
  const locationName = getEventLocation(event);
  const locationText = event.latitude && event.longitude
    ? getLocationWithMajorCity(event.latitude, event.longitude, locationName)
    : (locationName || "Schweiz");

  // Use AI-generated short_description or full description - NO FALLBACK
  const description = event.short_description || event.description || "";

  const buzzScore = event.buzz_score || event.relevance_score || 75;
  const isHot = buzzScore >= 80;

  // Rating berechnen (0-5) basierend auf buzzScore (0-100)
  const rating = buzzScore / 20; // z.B. 75 / 20 = 3.75
  const goldStars = Math.floor(rating); // z.B. Math.floor(3.75) = 3
  const grayStars = 5 - goldStars; // z.B. 5 - 3 = 2

  return (
    <article
      onClick={() => onEventClick(event)}
      className="group bg-[#FDFBF7] rounded-2xl transition-all duration-300 overflow-hidden border border-stone-200 cursor-pointer hover:shadow-lg"
      style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
    >
      <div className="flex gap-4 h-[200px]">
        {/* Image Section - Frame with even padding (like modal) */}
        <div className="relative w-[308px] flex-shrink-0 h-[200px] p-2 bg-white rounded-lg" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)' }}>
          <div className="relative w-full h-full overflow-hidden rounded">
            <img
              src={imageUrl}
              alt={event.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Category Badge - Milky Look wie auf Startseite */}
            {(() => {
              const categoryLabel = getCategoryLabel(event);
              return categoryLabel ? (
                <div className="absolute top-2 left-2 z-10">
                  <span className="bg-white/70 backdrop-blur-sm text-stone-700 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded">
                    {categoryLabel}
                  </span>
                </div>
              ) : null;
            })()}

            {/* Gallery Dots Indicator - only show if multiple images available */}
            {event.gallery_urls && event.gallery_urls.length > 0 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                {/* Primary image dot */}
                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                {/* Gallery images dots */}
                {event.gallery_urls.slice(0, 4).map((_: any, i: number) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/60 shadow-sm" />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 px-4 pt-4 pb-3 flex flex-col justify-between min-w-0">
          <div>
            {/* Title - ALWAYS 1 line only */}
            <h3 className="text-xl font-semibold text-stone-900 group-hover:text-amber-700 transition-colors mb-2 truncate leading-none font-sans">
              {event.title}
            </h3>

            {/* Location - NO PIN */}
            <div className="text-sm text-gray-500 mb-2">
              {locationText}

              {/* Mini-Map Tooltip */}
              {event.latitude && event.longitude && (
                <div className="absolute bottom-full left-0 mb-3 hidden group-hover/map:block z-50 animate-in fade-in zoom-in duration-200">
                  <div className="bg-white p-2 rounded-xl shadow-2xl border border-stone-200 w-44 h-32 overflow-hidden">
                    <div className="relative w-full h-full bg-slate-50 rounded-lg overflow-hidden">
                      <img
                        src="/swiss-outline.svg"
                        className="w-full h-full object-contain opacity-30 p-2"
                        alt="Switzerland Map"
                      />
                      <div
                        className="absolute w-3 h-3 bg-red-600 rounded-full border-2 border-white shadow-md animate-bounce"
                        style={{
                          left: `${((event.longitude - 5.95) / (10.5 - 5.95)) * 100}%`,
                          top: `${(1 - (event.latitude - 45.8) / (47.8 - 45.8)) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Description - always show short description with 2 line clamp */}
            {event.short_description && (
              <p className="text-[15px] text-gray-600 leading-relaxed line-clamp-2">
                {convertToUmlauts(event.short_description)}
              </p>
            )}
          </div>

          {/* MacBook Pro Style Glassmorphism Action Pill */}
          <div className="flex items-center justify-start pt-4">
            <div
              className="inline-flex items-center gap-4 px-5 py-1.5 rounded-full"
              style={{
                background: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(30px) saturate(180%)',
                WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
              }}
            >
              {/* Star Rating */}
              <div className="flex items-center gap-1.5">
                <span className="text-yellow-400 text-base">⭐</span>
                <span className="text-sm font-semibold text-gray-800">
                  {rating.toFixed(1)}
                </span>
              </div>

              {/* Divider */}
              <div className="w-px h-4 bg-gradient-to-b from-transparent via-gray-400/30 to-transparent" />

              {/* Favorit */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(event);
                }}
                className="group/heart relative p-1 hover:bg-white/30 rounded-md transition-all duration-200"
                title={isFavorited ? "Entfernen" : "Planen"}
              >
                <Heart
                  size={16}
                  className={isFavorited ? "fill-red-500 text-red-500" : "text-gray-700"}
                />
              </button>

              {/* Divider */}
              <div className="w-px h-4 bg-gradient-to-b from-transparent via-gray-400/30 to-transparent" />

              {/* Events in der Nähe */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (nearbyEventsFilter === event.id) {
                    setNearbyEventsFilter(null);
                  } else {
                    setIsLoadingNearby(true);
                    setTimeout(() => {
                      setNearbyEventsFilter(event.id);
                      setCurrentPage(1);
                      setDisplayedEventsCount(30);
                      setIsLoadingNearby(false);
                    }, 1500);
                  }
                }}
                disabled={isLoadingNearby}
                className={cn(
                  "group/nearby relative p-1 rounded-md transition-all duration-200",
                  nearbyEventsFilter === event.id ? "bg-orange-100" : "hover:bg-white/30",
                  isLoadingNearby && "opacity-50 cursor-wait"
                )}
                title="Events in der Nähe"
              >
                <MapPin
                  size={16}
                  className={cn(
                    nearbyEventsFilter === event.id ? "text-orange-600" : "text-gray-700",
                    isLoadingNearby && "animate-spin"
                  )}
                />
              </button>

              {/* Divider */}
              <div className="w-px h-4 bg-gradient-to-b from-transparent via-gray-400/30 to-transparent" />

              {/* Ticket kaufen - GANZ RECHTS, DUNKELBLAU */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (event.ticket_url || event.url) {
                    window.open(event.ticket_url || event.url, '_blank');
                  } else {
                    toast.info("Ticket-Verkauf demnächst verfügbar");
                  }
                }}
                className="group/ticket relative p-1 hover:bg-white/30 rounded-md transition-all duration-200"
                title="Ticket kaufen"
              >
                <ShoppingCart size={16} className="text-[#1e3a8a]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};


const EventList1 = () => {
  const [searchParams] = useSearchParams();
  const [mapExpanded, setMapExpanded] = useState(true);
  const [chatbotOpen, setChatbotOpen] = useState(false);

  // Modal state
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Use shared hooks
  const { rawEvents, loading, hoveredEventId, setHoveredEventId, handleMapEventsChange } = useEventData();
  const {
    filters,
    handleCategoryChange,
    handleMoodChange,
    handleCityChange,
    handleRadiusChange,
    handleTimeChange,
    handleDateChange,
    handleSearchChange,
  } = useEventFilters();

  // Taxonomy state for subcategories
  const [taxonomy, setTaxonomy] = useState<TaxonomyItem[]>([]);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [displayedEventsCount, setDisplayedEventsCount] = useState(30);
  const EVENTS_PER_PAGE = 120; // Max 120 events per page
  const SCROLL_LOAD_INCREMENT = 30; // Load 30 more on scroll

  const { favorites, toggleFavorite } = useFavorites();
  const favoriteIds = favorites.map(f => f.id);
  const navigate = useNavigate();

  // Nearby Events Filter
  const [nearbyEventsFilter, setNearbyEventsFilter] = useState<string | null>(null);

  const isFavorited = (eventId: string) => favorites.some(f => f.id === eventId);

  const handleToggleFavorite = useCallback(async (event: Event) => {
    const wasFavorite = isFavorited(event.id);
    const locationName = getEventLocation(event);

    // STEP 1: Update localStorage via FavoritesContext
    const favoriteData = {
      id: event.id,
      slug: event.external_id || event.id,
      title: event.title,
      venue: event.venue_name || "",
      image: event.image_url || getPlaceholderImage(0),
      location: locationName,
      date: event.start_date || "",
    };

    toggleFavorite(favoriteData);

    // STEP 2: Show toast ONLY when adding to favorites
    if (!wasFavorite) {
      toast("Event geplant ✨", { duration: 2000 });
    }

    // STEP 3: Update database favorite_count via API
    try {
      const numericId = parseInt(event.id, 10);
      if (!isNaN(numericId)) {
        const result = await toggleFavoriteApi(numericId);
        setRawEvents(prev => prev.map(e =>
          e.id === event.id
            ? { ...e, favorite_count: result.favoriteCount }
            : e
        ));
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  }, [toggleFavorite, isFavorited]);

  // Modal handlers
  const openEventModal = useCallback((event: Event) => {
    setSelectedEvent(event);
    setModalOpen(true);
  }, []);

  const closeEventModal = useCallback(() => {
    setModalOpen(false);
    setSelectedEvent(null);
  }, []);

  // Calculate subcategories for selected category
  const subCategories = useMemo(() => {
    if (!filters.categoryId) return [];
    return taxonomy
      .filter((t) => t.type === "sub" && t.parent_id === filters.categoryId)
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }, [taxonomy, filters.categoryId]);

  // Override handleCategoryChange to reset subcategory
  const handleCategoryChangeWithReset = (categoryId: number | null, categorySlug: string | null) => {
    handleCategoryChange(categoryId, categorySlug);
    setSelectedSubcategoryId(null);
  };

  // Load taxonomy from Supabase - with sessionStorage cache
  useEffect(() => {
    const loadTaxonomy = async () => {
      // Check sessionStorage cache first
      const cached = sessionStorage.getItem("taxonomy_cache");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.timestamp && Date.now() - parsed.timestamp < 5 * 60 * 1000) { // 5 min cache
            setTaxonomy(parsed.data);
            return;
          }
        } catch {}
      }

      try {
        const { data, error } = await externalSupabase
          .from("taxonomy")
          .select("id, slug, name, type, parent_id, display_order, is_active")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (error) {
          console.error("Taxonomy load error:", error);
          return;
        }

        if (data && data.length > 0) {
          const mapped = data.map((t: any) => ({
            id: t.id,
            slug: t.slug,
            name: t.name,
            type: t.type as "main" | "sub",
            parent_id: t.parent_id,
            display_order: t.display_order,
            is_active: t.is_active,
          }));
          setTaxonomy(mapped);
          // Cache in sessionStorage
          sessionStorage.setItem("taxonomy_cache", JSON.stringify({ data: mapped, timestamp: Date.now() }));
        }
      } catch (err) {
        console.error("Taxonomy fetch error:", err);
      }
    };
    loadTaxonomy();
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
    setDisplayedEventsCount(30);
  }, [filters]);

  // Filter events based on selected filters (client-side filtering)
  const filteredEvents = useMemo(() => {
    const startTime = performance.now();
    let result = [...rawEvents];

    // Nearby Events Filter - OVERRIDE all other filters
    if (nearbyEventsFilter) {
      const sourceEvent = rawEvents.find(e => e.id === nearbyEventsFilter);
      if (sourceEvent && sourceEvent.latitude && sourceEvent.longitude) {
        const NEARBY_DISTANCE_KM = 10; // Within 10km
        result = result.filter(event => {
          if (event.id === nearbyEventsFilter) return false; // Exclude source event
          if (!event.latitude || !event.longitude) return false;
          const distance = calculateDistance(
            sourceEvent.latitude,
            sourceEvent.longitude,
            event.latitude,
            event.longitude
          );
          return distance <= NEARBY_DISTANCE_KM;
        });
        return result; // Return early, ignore other filters
      }
    }

    // 1. Category Filter
    if (filters.categoryId) {
      result = result.filter(event => event.category_main_id === filters.categoryId);
    }

    // 1B. Subcategory Filter
    if (selectedSubcategoryId) {
      result = result.filter(event => event.category_sub_id === selectedSubcategoryId);
    }

    // 2. City + Radius Filter
    if (filters.city && filters.city !== "") {
      const cityCoords = CITY_COORDINATES[filters.city.toLowerCase()];
      if (cityCoords) {
        result = result.filter(event => {
          if (!event.latitude || !event.longitude) return false;
          const distance = calculateDistance(
            cityCoords.lat,
            cityCoords.lng,
            event.latitude,
            event.longitude
          );
          return distance <= filters.radius;
        });
      }
    }

    // 3. Date Filter
    if (filters.date) {
      const selectedDate = new Date(filters.date);
      selectedDate.setHours(0, 0, 0, 0);

      result = result.filter(event => {
        if (!event.start_date) return false;
        const eventDate = new Date(event.start_date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === selectedDate.getTime();
      });
    }

    // 4. Time Filter (heute, diese-woche, dieses-wochenende, etc.)
    if (filters.time) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      result = result.filter(event => {
        if (!event.start_date) return false;
        const eventDate = new Date(event.start_date);
        eventDate.setHours(0, 0, 0, 0);

        switch (filters.time) {
          case 'heute':
            return eventDate.getTime() === now.getTime();

          case 'diese-woche': {
            const weekEnd = new Date(now);
            weekEnd.setDate(weekEnd.getDate() + 7);
            return eventDate >= now && eventDate <= weekEnd;
          }

          case 'dieses-wochenende': {
            const dayOfWeek = now.getDay();
            const daysUntilSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
            const saturday = new Date(now);
            saturday.setDate(saturday.getDate() + daysUntilSaturday);
            const sunday = new Date(saturday);
            sunday.setDate(sunday.getDate() + 1);
            return (eventDate.getTime() === saturday.getTime()) ||
                   (eventDate.getTime() === sunday.getTime());
          }

          case 'naechste-woche': {
            const weekStart = new Date(now);
            weekStart.setDate(weekStart.getDate() + 7);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);
            return eventDate >= weekStart && eventDate < weekEnd;
          }

          case 'dieser-monat': {
            return eventDate.getMonth() === now.getMonth() &&
                   eventDate.getFullYear() === now.getFullYear();
          }

          default:
            return true;
        }
      });
    }

    // 5. Tags Filter (mood/tags from URL like "elite", "familie-freundlich", "mistwetter")
    if (filters.mood) {
      result = result.filter(event => {
        if (!event.tags || !Array.isArray(event.tags)) return false;

        // For familie-freundlich, also accept "familie", "family", "kinder", "familie-kinder"
        if (filters.mood === 'familie-freundlich') {
          return event.tags.some(tag =>
            tag === 'familie-freundlich' ||
            tag === 'familie' ||
            tag === 'family' ||
            tag === 'kinder' ||
            tag === 'familie-kinder'
          );
        }

        // For other tags, exact match
        return event.tags.includes(filters.mood);
      });
    }

    // 6. Source Filter (from URL like "myswitzerland")
    if (filters.search && filters.search === "myswitzerland") {
      result = result.filter(event => event.source === "myswitzerland");
    }

    // 7. Search Query Filter (minimum 3 characters, but skip if it's a source filter)
    if (filters.search && filters.search.length >= 3 && filters.search !== "myswitzerland") {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(event => {
        return (
          event.title?.toLowerCase().includes(searchLower) ||
          event.description?.toLowerCase().includes(searchLower) ||
          event.short_description?.toLowerCase().includes(searchLower) ||
          event.venue_name?.toLowerCase().includes(searchLower) ||
          event.location?.toLowerCase().includes(searchLower) ||
          event.address_city?.toLowerCase().includes(searchLower)
        );
      });
    }

    // 8. SORTING: Elite Events first, then by score/favorites
    // This ensures best events are always at the top of the list
    result.sort((a, b) => {
      // 1. Elite Events (buzz_boost = 100) ALWAYS first
      const aIsElite = a.buzz_boost === 100 || a.buzz_boost === "100";
      const bIsElite = b.buzz_boost === 100 || b.buzz_boost === "100";
      if (aIsElite && !bIsElite) return -1;
      if (!aIsElite && bIsElite) return 1;

      // 2. Sort by buzz_score (higher is better)
      const aScore = a.buzz_score || a.relevance_score || 0;
      const bScore = b.buzz_score || b.relevance_score || 0;
      if (aScore !== bScore) return bScore - aScore;

      // 3. Sort by favorite_count (higher is better)
      const aFavs = a.favorite_count || 0;
      const bFavs = b.favorite_count || 0;
      return bFavs - aFavs;
    });

    const endTime = performance.now();
    console.log(`⏱️ Filter + Sort took ${(endTime - startTime).toFixed(2)}ms for ${result.length} events`);

    return result;
  }, [rawEvents, filters, nearbyEventsFilter, selectedSubcategoryId]);

  // Pagination: Calculate displayed events based on current page
  const displayedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * EVENTS_PER_PAGE;
    const endIndex = startIndex + displayedEventsCount;
    return filteredEvents.slice(startIndex, endIndex);
  }, [filteredEvents, currentPage, displayedEventsCount, EVENTS_PER_PAGE]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;
  const canLoadMore = displayedEventsCount < EVENTS_PER_PAGE &&
                      (currentPage - 1) * EVENTS_PER_PAGE + displayedEventsCount < filteredEvents.length;

  // Map Pin Click Handler - Auto-jump to correct page
  const handleMapPinClick = useCallback((eventId: string) => {
    const eventIndex = filteredEvents.findIndex(e => e.id === eventId);

    if (eventIndex === -1) {
      return;
    }

    // Calculate which page this event is on
    const targetPage = Math.floor(eventIndex / EVENTS_PER_PAGE) + 1;

    // Jump to page if different
    if (targetPage !== currentPage) {
      setCurrentPage(targetPage);
      setDisplayedEventsCount(30); // Reset to initial count

      // Wait for re-render, then scroll to event
      setTimeout(() => {
        const eventElement = document.querySelector(`[data-event-id="${eventId}"]`);
        if (eventElement) {
          eventElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } else {
      // Same page, just scroll to it
      const eventElement = document.querySelector(`[data-event-id="${eventId}"]`);
      if (eventElement) {
        eventElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [filteredEvents, currentPage, EVENTS_PER_PAGE]);

  return (
    <div className="min-h-screen bg-[#F4F7FA]">
      <Helmet>
        <title>Alle Events in der Schweiz | EventBuzzer</title>
        <meta name="description" content="Entdecke über 1400 Events, Konzerte, Festivals und Aktivitäten in der Schweiz. Finde Events nach Kategorie, Stadt, Datum und mehr auf EventBuzzer." />
        <meta property="og:title" content="Alle Events in der Schweiz | EventBuzzer" />
        <meta property="og:description" content="Entdecke über 1400 Events, Konzerte, Festivals und Aktivitäten in der Schweiz." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/eventlist1`} />
        <meta property="og:image" content={`${SITE_URL}/og-image.jpg`} />
        <link rel="canonical" href={`${SITE_URL}/eventlist1`} />

        {/* BreadcrumbList Schema for Google Rich Snippets */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": SITE_URL
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Alle Events",
                "item": `${SITE_URL}/eventlist1`
              }
            ]
          })}
        </script>
      </Helmet>

      <Navbar />

      {/* Full-width Filter Bar - hellblauer Hintergrund */}
      <div className="sticky top-16 z-40 bg-[#F4F7FA] border-b border-stone-200">
        <div className="container mx-auto px-6 py-4 max-w-7xl">
          <ListingsFilterBar
            initialCategory={filters.category}
            initialMood={filters.mood}
            initialCity={filters.city}
            initialRadius={filters.radius}
            initialTime={filters.time}
            initialDate={filters.date}
            initialSearch={filters.search}
            onCategoryChange={handleCategoryChangeWithReset}
            onMoodChange={handleMoodChange}
            onCityChange={handleCityChange}
            onRadiusChange={handleRadiusChange}
            onTimeChange={handleTimeChange}
            onDateChange={handleDateChange}
            onSearchChange={handleSearchChange}
          />
        </div>
      </div>

      <main className="container mx-auto px-3 py-6 max-w-7xl">
        {/* Split Layout - Event-Karten 10% schmaler für mehr Platz rechts */}
        <div className="flex gap-8 items-start">
          {/* Left: Event List - 63% Breite (vorher 70%), 500px wenn Map groß (vorher 550px) */}
          <div
            className="flex-shrink-0 transition-all duration-300"
            style={{
              width: mapExpanded ? "calc(55% - 2rem)" : "63%",
              maxWidth: mapExpanded ? "none" : "100%",
            }}
          >
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-stone-900 mb-3">Alle Events in der Schweiz</h1>

              {/* SEO-optimierter Einleitungs-Text (300+ Wörter) - Hidden from UI, visible to Google */}
              <div className="sr-only">
                <p>
                  Entdecke über <strong>1400 Events, Konzerte, Festivals und Aktivitäten</strong> in der gesamten Schweiz auf EventBuzzer.
                  Von pulsierenden Konzerten in Zürich über traditionelle Festivals in Luzern bis zu kulturellen Highlights in Genf –
                  unsere Plattform bietet dir eine umfassende Übersicht aller Veranstaltungen in deiner Region.
                </p>
                <p>
                  Nutze unsere intelligenten <strong>Filter-Funktionen</strong>, um gezielt nach Events zu suchen: Wähle aus über 15 Kategorien
                  wie Musik, Sport, Kultur, Familie oder Nachtleben. Filtere nach Stimmung (entspannt, aktiv, romantisch), nach Stadt,
                  Datum oder entdecke Events in deiner unmittelbaren Umgebung mit unserem Umkreis-Filter. Die interaktive Karte
                  zeigt dir alle Veranstaltungen visuell auf einen Blick.
                </p>
                <p>
                  Egal ob spontane Wochenend-Aktivität oder langfristige Event-Planung – EventBuzzer hilft dir dabei,
                  unvergessliche Erlebnisse in der Schweiz zu finden. Speichere deine Favoriten, teile Events mit Freunden
                  und verpasse keine spannende Veranstaltung mehr in Bern, Basel, Lausanne oder den malerischen Bergregionen
                  wie Interlaken und Zermatt.
                </p>
              </div>

              <p className="text-sm text-stone-500">
                {loading ? "Lädt..." : `${displayedEvents.length} von ${filteredEvents.length} Events`}
              </p>
            </div>

            {/* Event List Container */}
            <div className="space-y-3">
              {/* Subcategory Pills - Sticky Bar */}
              {filters.categoryId && subCategories.length > 0 && (
                <div className="sticky top-32 z-10 bg-[#F4F7FA] py-3 -mx-2 px-2 overflow-x-auto">
                  <div className="flex gap-2 min-w-max">
                    <button
                      onClick={() => setSelectedSubcategoryId(null)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                        selectedSubcategoryId === null
                          ? "bg-stone-800 text-white shadow-md"
                          : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50",
                      )}
                    >
                      Alle
                    </button>
                    {subCategories.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => setSelectedSubcategoryId(sub.id === selectedSubcategoryId ? null : sub.id)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                          selectedSubcategoryId === sub.id
                            ? "bg-stone-800 text-white shadow-md"
                            : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50",
                        )}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Filter Badge */}
              {nearbyEventsFilter && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin size={18} className="text-orange-600" />
                    <span className="text-sm font-medium text-orange-900">
                      Events in der Nähe (innerhalb 10 km)
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setNearbyEventsFilter(null);
                    }}
                    className="text-orange-600 hover:text-orange-800 transition-colors"
                    title="Filter entfernen"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="bg-white rounded-2xl h-36 animate-pulse" />
                  ))}
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center">
                  <p className="text-gray-500 text-sm">
                    Keine Events gefunden. Versuche andere Filter oder ändere den Kartenausschnitt.
                  </p>
                </div>
              ) : (
                <>
                  {displayedEvents.map((event, index) => (
                    <div
                      key={event.id}
                      data-event-id={event.id}
                      onMouseEnter={() => setHoveredEventId(event.id)}
                      onMouseLeave={() => setHoveredEventId(null)}
                    >
                      <EventCard
                        event={event}
                        index={index}
                        isFavorited={isFavorited(event.id)}
                        onToggleFavorite={handleToggleFavorite}
                        onEventClick={openEventModal}
                        nearbyEventsFilter={nearbyEventsFilter}
                        setNearbyEventsFilter={setNearbyEventsFilter}
                        setCurrentPage={setCurrentPage}
                        setDisplayedEventsCount={setDisplayedEventsCount}
                      />
                    </div>
                  ))}

                  {/* Scroll Detection Sentinel - für auto-load beim Scrollen */}
                  {canLoadMore && (
                    <div
                      ref={(el) => {
                        if (!el) return;

                        const observer = new IntersectionObserver(
                          (entries) => {
                            if (entries[0].isIntersecting) {
                              setDisplayedEventsCount(prev =>
                                Math.min(prev + SCROLL_LOAD_INCREMENT, EVENTS_PER_PAGE)
                              );
                            }
                          },
                          { threshold: 0.1 }
                        );

                        observer.observe(el);

                        // Cleanup wird automatisch aufgerufen wenn component unmounts
                        // Aber wir können es nicht returnen weil React das nicht erwartet
                        // Stattdessen speichern wir den Observer auf dem Element
                        (el as any)._observer = observer;
                      }}
                      className="h-10 flex items-center justify-center"
                    >
                      <div className="text-sm text-gray-400">Lade mehr Events...</div>
                    </div>
                  )}

                  {/* Pagination Controls */}
                  {displayedEventsCount >= EVENTS_PER_PAGE && (hasNextPage || hasPreviousPage) && (
                    <div className="mt-8 mb-4 flex items-center justify-between bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
                      <button
                        onClick={() => {
                          if (hasPreviousPage) {
                            setCurrentPage(prev => prev - 1);
                            setDisplayedEventsCount(30);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        disabled={!hasPreviousPage}
                        className={cn(
                          "px-6 py-2.5 rounded-lg font-medium transition-all",
                          hasPreviousPage
                            ? "bg-stone-900 text-white hover:bg-stone-800"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        )}
                      >
                        ← Vorherige Seite
                      </button>

                      <div className="text-sm font-medium text-gray-700">
                        Seite {currentPage} von {totalPages}
                        <span className="text-gray-500 ml-2">
                          ({filteredEvents.length} Events total)
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          if (hasNextPage) {
                            setCurrentPage(prev => prev + 1);
                            setDisplayedEventsCount(30);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        disabled={!hasNextPage}
                        className={cn(
                          "px-6 py-2.5 rounded-lg font-medium transition-all",
                          hasNextPage
                            ? "bg-stone-900 text-white hover:bg-stone-800"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        )}
                      >
                        Nächste Seite →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right: Expandable Map + Chatbot - Breiter (34% statt 27%) */}
          <div
            className={cn(
              "flex-shrink-0 space-y-6 transition-all duration-300 sticky top-36",
              mapExpanded ? "w-[45%]" : "w-[34%] mr-4"
            )}
          >
            {/* Map Container - 15% mehr Höhe (340px statt 296px) */}
            <div
              className={cn(
                "relative bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-200 transition-all duration-300",
                mapExpanded
                  ? "h-[calc(100vh-200px)] w-full"
                  : "h-[340px] w-full"
              )}
            >
              {/* EventsMap Komponente - SIMPLE version without search button */}
              <EventsMap
                onEventsChange={handleMapEventsChange}
                onEventClick={(eventId) => handleMapPinClick(eventId)}
                isVisible={true}
                selectedEventIds={favoriteIds}
                hoveredEventId={hoveredEventId}
                showOnlyEliteAndFavorites={false}
                customControls={true}
              />

              {/* Toggle Button */}
              <button
                onClick={() => setMapExpanded(!mapExpanded)}
                className="absolute top-3 right-3 w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
                aria-label={mapExpanded ? "Karte verkleinern" : "Karte vergrößern"}
              >
                {mapExpanded ? (
                  <Minimize2 size={18} className="text-gray-700" />
                ) : (
                  <Maximize2 size={18} className="text-gray-700" />
                )}
              </button>
            </div>

            {/* Miniatur Chatbot - klickbar, öffnet volle Version rechts */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all h-[280px] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-3 pt-3 pb-2">
                <h3 className="font-sans text-sm text-gray-900 font-semibold">
                  Dein Event-Assistent
                </h3>
              </div>

              {/* Messages - Mini mit mehr Abstand nach unten */}
              <div className="px-3 pb-5">
                <div className="flex justify-start">
                  <div className="max-w-[90%] px-2.5 py-1.5 rounded-xl text-sm bg-white text-gray-900 rounded-bl-md shadow-sm border border-gray-100 leading-relaxed">
                    Hi! 👋 Verrate mir deinen Wunsch oder lass uns das Richtige über mein Quiz finden! ✨
                  </div>
                </div>
              </div>

              {/* Mission Buttons - Mini - 4 Pills in 2x2 Grid mit Interaktivität und mehr Abstand nach unten */}
              <div className="px-3 pb-5 grid grid-cols-2 gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setChatbotOpen(true);
                  }}
                  className="py-1.5 px-2 text-center rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 text-xs font-medium flex items-center justify-center gap-1 transition-all"
                >
                  <span>🧘</span>
                  <span>Solo</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setChatbotOpen(true);
                  }}
                  className="py-1.5 px-2 text-center rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 text-xs font-medium flex items-center justify-center gap-1 transition-all"
                >
                  <span>👨‍👩‍👧</span>
                  <span>Familie</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setChatbotOpen(true);
                  }}
                  className="py-1.5 px-2 text-center rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 text-xs font-medium flex items-center justify-center gap-1 transition-all"
                >
                  <span>🎉</span>
                  <span>Freunde</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setChatbotOpen(true);
                  }}
                  className="py-1.5 px-2 text-center rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 text-xs font-medium flex items-center justify-center gap-1 transition-all"
                >
                  <span>💕</span>
                  <span>Zu zweit</span>
                </button>
              </div>

              {/* Input Area - Mini mit Interaktivität */}
              <div className="px-3 pb-3">
                <div className="flex gap-1.5 items-end">
                  <input
                    type="text"
                    placeholder="Ich möchte diesen Samstag..."
                    className="flex-1 bg-white border-gray-200 rounded-lg text-xs px-2 py-1.5 text-gray-900"
                    onFocus={(e) => {
                      e.stopPropagation();
                      setChatbotOpen(true);
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setChatbotOpen(true);
                    }}
                    className="bg-[hsl(var(--wizard-accent))] hover:bg-[hsl(var(--wizard-accent))]/90 text-white rounded-lg px-2.5 py-1.5 text-xs transition-all"
                  >
                    ✨
                  </button>
                </div>
              </div>
            </div>

            {/* Volle ChatbotPopup - öffnet sich RECHTS */}
            <ChatbotPopupRight
              isOpen={chatbotOpen}
              onClose={() => setChatbotOpen(false)}
              onOpen={() => setChatbotOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isOpen={modalOpen}
          onClose={closeEventModal}
        />
      )}
    </div>
  );
};

export default EventList1;
