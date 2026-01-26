import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import ListingsFilterBar from "@/components/ListingsFilterBar";
import { externalSupabase } from "@/integrations/supabase/externalClient";
import { useFavorites } from "@/contexts/FavoritesContext";
import { Heart, MapPin, Maximize2, Minimize2, CalendarPlus, Share2, Copy, Mail, X, ShoppingCart } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import EventsMap from "@/components/EventsMap";
import { BuzzSlider } from "@/components/BuzzSlider";
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


// Event Card Component - Expandable Version
const EventCard = ({
  event,
  index,
  isFavorited,
  onToggleFavorite,
  nearbyEventsFilter,
  setNearbyEventsFilter,
  setCurrentPage,
  setDisplayedEventsCount,
}: {
  event: Event;
  index: number;
  isFavorited: boolean;
  onToggleFavorite: (event: Event) => void;
  nearbyEventsFilter: string | null;
  setNearbyEventsFilter: (id: string | null) => void;
  setCurrentPage: (page: number) => void;
  setDisplayedEventsCount: (count: number) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const imageUrl = event.image_url || getPlaceholderImage(index);

  // Location formatieren
  const locationName = getEventLocation(event);
  const locationText = event.latitude && event.longitude
    ? getLocationWithMajorCity(event.latitude, event.longitude, locationName)
    : (locationName || "Schweiz");

  const buzzScore = event.buzz_score || event.relevance_score || 75;
  const rating = buzzScore / 20;

  return (
    <article
      onClick={() => setExpanded(!expanded)}
      className="group bg-white rounded-2xl transition-all duration-300 cursor-pointer"
      style={{ boxShadow: expanded ? '0 10px 40px rgba(0,0,0,0.08)' : '0 4px 16px rgba(0,0,0,0.06)' }}
    >
      <div className={cn(
        "flex gap-8 p-5 transition-all duration-300",
        expanded && "pb-6"
      )}>
        {/* Image Section - Polaroid Frame */}
        <div
          className="relative flex-shrink-0 bg-white p-2 rounded-sm transition-all duration-300 w-[280px]"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        >
          <img
            src={imageUrl}
            alt={event.title}
            loading="lazy"
            className={cn(
              "w-full rounded object-cover transition-all duration-300",
              expanded ? "h-[280px]" : "h-[180px]"
            )}
          />

          {/* Category Badge */}
          {(() => {
            const categoryLabel = getCategoryLabel(event);
            return categoryLabel ? (
              <div className="absolute top-4 left-4 z-10">
                <span className="bg-white/95 backdrop-blur-sm text-stone-700 px-2.5 py-1 rounded-full text-xs font-medium shadow-sm border border-stone-100">
                  {categoryLabel}
                </span>
              </div>
            ) : null;
          })()}

          {/* Gallery Dots Indicator */}
          {event.gallery_urls && event.gallery_urls.length > 0 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
              {[...Array(Math.min(event.gallery_urls.length + 1, 5))].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-colors",
                    i === 0 ? "bg-white" : "bg-white/50"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <div>
            {/* Title - ALWAYS 1 line only */}
            <h3 className="text-lg font-serif font-bold text-gray-900 mb-1.5 truncate leading-tight">
              {event.title}
            </h3>

            {/* Location - NO PIN */}
            <div className="text-sm text-gray-600 mb-2 flex items-center gap-1.5">
              <MapPin size={14} className="flex-shrink-0" />
              <span>{locationText}</span>
            </div>

            {/* Description - short im collapsed, full im expanded */}
            {(() => {
              const description = expanded ? event.description : event.short_description;
              return description ? (
                <p className={cn(
                  "text-[15px] text-gray-600 leading-relaxed",
                  !expanded && "line-clamp-2"
                )}>
                  {convertToUmlauts(description)}
                </p>
              ) : null;
            })()}
          </div>

          {/* Bottom Section */}
          <div className="space-y-3 mt-4">
            {/* Buzz Slider + Quick Actions (collapsed) */}
            {!expanded ? (
              <div className="relative" style={{ maxWidth: '75%' }}>
                {/* Buzz Slider */}
                {buzzScore && <BuzzSlider value={buzzScore} />}

                {/* Quick Action Icons - ABSOLUTE positioned */}
                <div className="absolute bottom-0 flex items-center gap-1.5" style={{ right: '-70px' }}>
                  <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(event); }} className="hover:scale-110 transition-all duration-200">
                    <Heart size={22} className={isFavorited ? "fill-red-600 text-red-600" : "text-gray-600"} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setExpanded(true); }} className="hover:scale-110 transition-all duration-200">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Buzz Slider */}
                {buzzScore && <BuzzSlider value={buzzScore} />}

                {/* Star Rating + All Action Icons (expanded) */}
                <div className="flex items-center gap-5">
                  {/* Star Rating */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-yellow-400 text-lg">⭐</span>
                    <span className="text-sm font-semibold text-gray-600">
                      {rating.toFixed(1)}
                    </span>
                  </div>

                  {/* Action Icons */}
                  <div className="flex items-center gap-5" onClick={(e) => e.stopPropagation()}>
                    <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(event); }} className="p-1.5 hover:scale-110 transition-all duration-200">
                      <Heart size={19} className={isFavorited ? "fill-red-600 text-red-600" : "text-gray-600"} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); exportToCalendar(event); }} className="p-1.5 hover:scale-110 transition-all duration-200">
                      <CalendarPlus size={18} className="text-gray-600" />
                    </button>
                    <Popover open={showSharePopup} onOpenChange={setShowSharePopup}>
                      <PopoverTrigger asChild>
                        <button onClick={(e) => e.stopPropagation()} className="p-1.5 hover:scale-110 transition-all duration-200">
                          <Share2 size={18} className="text-gray-600" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2 bg-white shadow-lg border border-neutral-200" align="end" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col">
                          <button onClick={async (e) => { e.stopPropagation(); await navigator.clipboard.writeText(`${window.location.origin}/event/${event.external_id || event.id}`); toast("Link kopiert!", { duration: 2000 }); setShowSharePopup(false); }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-100 transition-colors text-left">
                            <Copy size={18} className="text-neutral-500" />
                            <span className="text-sm text-neutral-700">Link kopieren</span>
                          </button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    {(event.ticket_url || event.url) && (
                      <button onClick={(e) => { e.stopPropagation(); window.open(event.ticket_url || event.url, '_blank'); }} className="p-1.5 hover:scale-110 transition-all duration-200">
                        <ShoppingCart size={18} className="text-gray-600" />
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); if (nearbyEventsFilter === event.id) { setNearbyEventsFilter(null); } else { setIsLoadingNearby(true); setTimeout(() => { setNearbyEventsFilter(event.id); setCurrentPage(1); setDisplayedEventsCount(30); setIsLoadingNearby(false); }, 1500); } }} disabled={isLoadingNearby} className={cn("p-1.5 hover:scale-110 transition-all duration-200", nearbyEventsFilter === event.id && "text-orange-500", isLoadingNearby && "opacity-50 cursor-wait")}>
                      <MapPin size={18} className={cn(nearbyEventsFilter === event.id ? "text-orange-500" : "text-gray-600", isLoadingNearby && "animate-spin")} />
                    </button>
                  </div>
                </div>

                {/* Link to detail page (for SEO) */}
                <div className="pt-3 mt-3 border-t border-stone-200">
                  <Link
                    to={`/event/${event.external_id || event.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    Zur Eventseite
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

const EventsNew = () => {
  const [searchParams] = useSearchParams();
  const [mapExpanded, setMapExpanded] = useState(true);
  const [chatbotOpen, setChatbotOpen] = useState(false);

  // Use shared hooks
  const { rawEvents, loading, hoveredEventId, setHoveredEventId, handleMapEventsChange, setRawEvents } = useEventData();
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
        <title>Events neu entdecken | EventBuzzer</title>
        <meta name="description" content="Entdecke über 900 Events, Konzerte, Festivals und Aktivitäten in der Schweiz. Finde Events nach Kategorie, Stadt, Datum und mehr auf EventBuzzer." />
        <meta property="og:title" content="Events neu entdecken | EventBuzzer" />
        <meta property="og:description" content="Entdecke über 900 Events, Konzerte, Festivals und Aktivitäten in der Schweiz." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://eventbuzzer.ch/events-neu" />
        <link rel="canonical" href="https://eventbuzzer.ch/events-neu" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Navbar />

      {/* Full-width Filter Bar - hellerer Hintergrund */}
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

    </div>
  );
};

export default EventsNew;
