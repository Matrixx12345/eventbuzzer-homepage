import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { EventRatingButtons } from "@/components/EventRatingButtons";
import { useLikeOnFavorite } from "@/hooks/useLikeOnFavorite";
import ListingsFilterBar from "@/components/ListingsFilterBar";
import ImageAttribution from "@/components/ImageAttribution";
// VibeBadge removed from listings - keeping clean museum look
import {
  Heart,
  MapPin,
  Loader2,
  Flame,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useFavorites } from "@/contexts/FavoritesContext";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { getNearestPlace } from "@/utils/swissPlaces";

// Nutze den zentralen externen Supabase Client
import { externalSupabase as supabase } from "@/integrations/supabase/externalClient";

// Placeholder images
import eventAbbey from "@/assets/event-abbey.jpg";
import eventVenue from "@/assets/event-venue.jpg";
import eventConcert from "@/assets/event-concert.jpg";
import swissZurich from "@/assets/swiss-zurich.jpg";
const placeholderImages = [eventAbbey, eventVenue, eventConcert, swissZurich];
const getPlaceholderImage = (index: number) => placeholderImages[index % placeholderImages.length];

interface ExternalEvent {
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
  price_label?: string;
  latitude?: number;
  longitude?: number;
  tags?: string[];
  date_range_start?: string;
  date_range_end?: string;
  show_count?: number;
  available_months?: number[];
  image_author?: string | null;
  image_license?: string | null;
  category_sub_id?: string;
  created_at?: string;
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

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  zürich: { lat: 47.3769, lng: 8.5417 },
  bern: { lat: 46.948, lng: 7.4474 },
  basel: { lat: 47.5596, lng: 7.5886 },
  luzern: { lat: 47.0502, lng: 8.3093 },
  genf: { lat: 46.2044, lng: 6.1432 },
  baden: { lat: 47.4734, lng: 8.3063 },
  winterthur: { lat: 47.4984, lng: 8.7246 },
  "st. gallen": { lat: 47.4245, lng: 9.3767 },
};

const Listings = () => {
  const [searchParams] = useSearchParams();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { sendLike } = useLikeOnFavorite();
  const [events, setEvents] = useState<ExternalEvent[]>([]);
  const [taxonomy, setTaxonomy] = useState<TaxonomyItem[]>([]);
  const [taxonomyLoaded, setTaxonomyLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalEvents, setTotalEvents] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [nextOffset, setNextOffset] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // URL parameter für Filter auslesen
  const urlQuickFilter = searchParams.get("quickFilter");
  const urlCategory = searchParams.get("category");
  const urlCity = searchParams.get("city");
  const urlRadius = searchParams.get("radius");
  const urlTime = searchParams.get("time");
  const urlDate = searchParams.get("date");

  // Filter states
  const [selectedCity, setSelectedCity] = useState(urlCity || "");
  const [radius, setRadius] = useState(urlRadius ? parseInt(urlRadius) : 25);
  const [selectedQuickFilters, setSelectedQuickFilters] = useState<string[]>(urlQuickFilter ? [urlQuickFilter] : []);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(urlCategory || null);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string | null>(urlTime || null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    urlDate ? new Date(urlDate) : undefined
  );

  const buildFilters = useCallback(() => {
    const filters: Record<string, any> = {};
    if (selectedCategoryId !== null) filters.categoryId = selectedCategoryId;
    if (selectedSubcategoryId !== null) filters.subcategoryId = selectedSubcategoryId;
    if (selectedTimeFilter) filters.timeFilter = selectedTimeFilter;
    if (selectedDate) filters.singleDate = selectedDate.toISOString();

    if (selectedCity) {
      filters.city = selectedCity;
      if (radius > 0) {
        filters.radius = radius;
        const coords = CITY_COORDINATES[selectedCity.toLowerCase().trim()];
        if (coords) {
          filters.cityLat = coords.lat;
          filters.cityLng = coords.lng;
        }
      }
    }
    
    const tags: string[] = [];
    if (selectedQuickFilters.includes("romantik")) tags.push("romantisch-date");
    if (selectedQuickFilters.includes("wellness")) tags.push("wellness-selfcare");
    if (selectedQuickFilters.includes("natur")) tags.push("natur-erlebnisse", "open-air");
    if (selectedQuickFilters.includes("foto-spots")) tags.push("foto-spot");
    if (selectedQuickFilters.includes("nightlife")) tags.push("nightlife-party", "afterwork", "rooftop-aussicht");
    if (selectedQuickFilters.includes("top-stars")) tags.push("vip-artists");
    if (selectedQuickFilters.includes("geburtstag")) tags.push("besondere-anlaesse", "freunde-gruppen");
    if (selectedQuickFilters.includes("mistwetter")) tags.push("schlechtwetter-indoor");
    if (selectedQuickFilters.includes("mit-kind")) tags.push("familie-kinder");
    if (tags.length > 0) filters.tags = tags;
    
    return filters;
  }, [
    selectedCategoryId,
    selectedSubcategoryId,
    selectedTimeFilter,
    selectedCity,
    radius,
    selectedQuickFilters,
    selectedDate,
  ]);

  const fetchEvents = useCallback(
    async (isInitial: boolean = true) => {
      try {
        if (isInitial) {
          setLoading(true);
          setEvents([]);
          setNextOffset(0);
        } else setLoadingMore(true);
        const offset = isInitial ? 0 : nextOffset;
        const { data, error } = await supabase.functions.invoke("get-external-events", {
          body: { offset, limit: 30, filters: buildFilters() },
        });
        if (error) throw error;
        if (data?.events) setEvents((prev) => (isInitial ? data.events : [...prev, ...data.events]));
        if (data?.pagination) {
          setHasMore(data.pagination.hasMore);
          setNextOffset(data.pagination.nextOffset || offset + 30);
          setTotalEvents(data.pagination.total);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [nextOffset, buildFilters],
  );

  // Taxonomy aus Supabase laden - mit sessionStorage Cache
  useEffect(() => {
    const loadTaxonomy = async () => {
      // Check sessionStorage cache first
      const cached = sessionStorage.getItem("taxonomy_cache");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.timestamp && Date.now() - parsed.timestamp < 5 * 60 * 1000) { // 5 min cache
            setTaxonomy(parsed.data);
            setTaxonomyLoaded(true);
            return;
          }
        } catch {}
      }

      try {
        const { data, error } = await supabase
          .from("taxonomy")
          .select("id, slug, name, type, parent_id, display_order, is_active")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (error) {
          console.error("Taxonomy load error:", error);
          setTaxonomyLoaded(true);
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
        setTaxonomyLoaded(true);
      } catch (err) {
        console.error("Taxonomy fetch error:", err);
        setTaxonomyLoaded(true);
      }
    };
    loadTaxonomy();
  }, []);

  // URL-Kategorie-Parameter in Kategorie-ID umwandeln
  useEffect(() => {
    if (taxonomyLoaded && selectedCategorySlug && taxonomy.length > 0) {
      const matchingCategory = taxonomy.find((t) => t.type === "main" && t.slug === selectedCategorySlug);
      if (matchingCategory) {
        setSelectedCategoryId(matchingCategory.id);
      }
      setSelectedCategorySlug(null);
    }
  }, [taxonomyLoaded, selectedCategorySlug, taxonomy]);

  useEffect(() => {
    const t = setTimeout(() => fetchEvents(true), 400);
    return () => clearTimeout(t);
  }, [
    selectedCity,
    radius,
    selectedCategoryId,
    selectedSubcategoryId,
    selectedQuickFilters,
    selectedTimeFilter,
    selectedDate,
  ]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) fetchEvents(false);
      },
      { threshold: 0.1 },
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, fetchEvents]);

  // Filter change handlers for ListingsFilterBar
  const handleCategoryChange = (categoryId: number | null, categorySlug: string | null) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubcategoryId(null);
  };

  const handleMoodChange = (moodSlug: string | null) => {
    if (moodSlug) {
      setSelectedQuickFilters([moodSlug]);
    } else {
      setSelectedQuickFilters([]);
    }
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
  };

  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
  };

  const handleTimeChange = (time: string | null) => {
    setSelectedTimeFilter(time);
  };

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const getEventLocation = (event: ExternalEvent): string => {
    const countryNames = [
      "schweiz", "switzerland", "suisse", "svizzera",
      "germany", "deutschland", "france", "frankreich",
      "austria", "österreich", "italy", "italien", "liechtenstein",
    ];

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

    return "";
  };

  const getDistanceInfo = (lat: number, lng: number): { city: string; distance: string } => {
    const centers = [
      { name: "Zürich", lat: 47.3769, lng: 8.5417 },
      { name: "Genf", lat: 46.2044, lng: 6.1432 },
      { name: "Basel", lat: 47.5596, lng: 7.5886 },
      { name: "Bern", lat: 46.948, lng: 7.4474 },
      { name: "Lausanne", lat: 46.5197, lng: 6.6323 },
      { name: "Luzern", lat: 47.0502, lng: 8.3093 },
      { name: "St. Gallen", lat: 47.4245, lng: 9.3767 },
      { name: "Lugano", lat: 46.0037, lng: 8.9511 },
      { name: "Montreux", lat: 46.4312, lng: 6.9107 },
      { name: "Interlaken", lat: 46.6863, lng: 7.8632 },
      { name: "Chur", lat: 46.8503, lng: 9.5334 },
      { name: "Sion", lat: 46.2293, lng: 7.3586 },
      { name: "Winterthur", lat: 47.4984, lng: 8.7246 },
    ];

    let nearest = centers[0],
      minDist = Infinity;

    centers.forEach((c) => {
      const d = Math.sqrt(Math.pow((lat - c.lat) * 111, 2) + Math.pow((lng - c.lng) * 85, 2));
      if (d < minDist) {
        minDist = d;
        nearest = c;
      }
    });

    if (minDist < 5) {
      return {
        city: nearest.name,
        distance: `In ${nearest.name}`,
      };
    }

    const dLat = lat - nearest.lat;
    const dLng = lng - nearest.lng;
    let direction = "";
    if (Math.round(minDist) > 2) {
      if (dLat > 0.02) direction += "N";
      else if (dLat < -0.02) direction += "S";
      if (dLng > 0.02) direction += "O";
      else if (dLng < -0.02) direction += "W";
    }

    const distanceText = direction
      ? `~${Math.round(minDist)} km ${direction} von ${nearest.name}`
      : `~${Math.round(minDist)} km von ${nearest.name}`;

    return { city: nearest.name, distance: distanceText };
  };

  const formatEventDate = (d?: string, ext?: string, start?: string, end?: string, count?: number) => {
    if (!d) return ext?.startsWith("mys_") ? "Jederzeit" : "Datum TBA";
    try {
      if (start && end && count && count > 1) {
        return `${format(parseISO(start), "d. MMM", { locale: de })} – ${format(parseISO(end), "d. MMM yyyy", { locale: de })} (${count} Shows)`;
      }
      return format(parseISO(d), "d. MMM yyyy", { locale: de });
    } catch {
      return "Datum TBA";
    }
  };

  const subCategories = useMemo(() => {
    if (!selectedCategoryId) return [];
    return taxonomy
      .filter((t) => t.type === "sub" && t.parent_id === selectedCategoryId)
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }, [taxonomy, selectedCategoryId]);

  return (
    <div className="min-h-screen bg-stone-100">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Filter Bar */}
        <ListingsFilterBar
          initialCategory={urlCategory}
          initialMood={urlQuickFilter}
          initialCity={urlCity}
          initialRadius={urlRadius ? parseInt(urlRadius) : 25}
          initialTime={urlTime}
          initialDate={urlDate ? new Date(urlDate) : undefined}
          onCategoryChange={handleCategoryChange}
          onMoodChange={handleMoodChange}
          onCityChange={handleCityChange}
          onRadiusChange={handleRadiusChange}
          onTimeChange={handleTimeChange}
          onDateChange={handleDateChange}
        />

        {/* Results Count */}
        <div className="mb-4 text-sm text-neutral-500">
          {loading ? "Lädt..." : `${events.length} von ${totalEvents} Events`}
        </div>

        {/* Subcategory Sticky Bar */}
        {selectedCategoryId && subCategories.length > 0 && (
          <div className="sticky top-0 z-10 bg-stone-100/95 backdrop-blur-sm py-3 mb-4 -mx-2 px-2 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              <button
                onClick={() => setSelectedSubcategoryId(null)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                  selectedSubcategoryId === null
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-white text-gray-700 border hover:bg-gray-50",
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
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-white text-gray-700 border hover:bg-gray-50",
                  )}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Events Grid - Clean 3-Column Layout */}
        {loading && !loadingMore ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((event, index) => {
              const locationName = getEventLocation(event);
              const distanceInfo =
                event.latitude && event.longitude
                  ? getDistanceInfo(event.latitude, event.longitude).distance
                  : null;
              // Check if museum: either by category_sub_id OR by external_id pattern (manual_ entries are museums)
              const isMuseum = event.category_sub_id === 'museum-kunst' || event.external_id?.startsWith('manual_');

              return (
                <article 
                  key={event.id}
                  className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <Link to={`/event/${event.id}`} className="block">
                    <div className="relative overflow-hidden">
                      <img
                        src={event.image_url || getPlaceholderImage(index)}
                        alt={event.title}
                        className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      {/* Date or Museum Badge - Clean White Pill */}
                      <div className="absolute top-3 left-3 bg-white/70 backdrop-blur-md px-2.5 py-1 rounded-lg shadow-sm">
                        <p className="text-[10px] font-semibold text-neutral-700 tracking-wide">
                          {isMuseum ? 'MUSEUM' : formatEventDate(
                            event.start_date,
                            event.external_id,
                            event.date_range_start,
                            event.date_range_end,
                            event.show_count,
                          )}
                        </p>
                      </div>
                      
                      {/* Favorite Button - Top Right */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorite({
                            id: event.id,
                            slug: event.id,
                            title: event.title,
                            venue: event.venue_name || "",
                            image: event.image_url || getPlaceholderImage(index),
                            location: locationName,
                            date: formatEventDate(event.start_date),
                          });
                        }}
                        className="absolute top-3 right-3 p-2 rounded-full bg-white/70 backdrop-blur-md hover:bg-white transition-all shadow-sm"
                        aria-label="Add to favorites"
                      >
                        <Heart
                          size={14}
                          className={isFavorite(event.id) ? "fill-red-500 text-red-500" : "text-neutral-500"}
                        />
                      </button>
                      
                      {/* Image Attribution - only shows on hover */}
                      <ImageAttribution 
                        author={event.image_author} 
                        license={event.image_license} 
                      />
                    </div>
                  </Link>

                  {/* Content Section - Compact & Elegant */}
                  <div className="p-4">
                    {/* Location Eyebrow with Map Hover */}
                    <div className="group/map relative cursor-pointer mb-2">
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 uppercase tracking-wider font-medium">
                        <MapPin size={11} className="text-primary/60 flex-shrink-0" />
                        <span className="truncate">
                          {locationName || "Schweiz"}
                          {distanceInfo && <span className="text-neutral-300 ml-1">• {distanceInfo}</span>}
                        </span>
                      </div>
                      {event.latitude && event.longitude && (
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/map:block z-50 animate-in fade-in zoom-in duration-200">
                          <div className="bg-white p-2 rounded-lg shadow-xl border w-36 h-28">
                            <div className="relative w-full h-full bg-slate-50 rounded overflow-hidden">
                              <img src="/swiss-outline.svg" className="w-full h-full object-contain opacity-60" alt="Map" />
                              <div
                                className="absolute w-2.5 h-2.5 bg-primary rounded-full border-2 border-white shadow"
                                style={{
                                  left: `${6 + ((event.longitude - 5.85) / 4.7) * 88}%`,
                                  top: `${3 + (1 - (event.latitude - 45.75) / 2.1) * 94}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Title - Serif Bold */}
                    <Link to={`/event/${event.id}`}>
                      <h3 className="font-serif text-lg font-bold text-foreground leading-snug line-clamp-2 hover:text-primary/80 transition-colors">
                        {event.title}
                      </h3>
                    </Link>
                    
                    {/* Short Description - Always 2 lines */}
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                      {event.short_description || "Entdecke dieses einzigartige Event in der Schweiz."}
                    </p>
                    
                    {/* Price & Rating Row */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100">
                      <div className="flex items-center gap-3 text-xs text-neutral-400">
                        <span>
                          {event.price_from && event.price_from >= 15 
                            ? `ab ${event.price_from}`
                            : event.price_label 
                              ? event.price_label
                              : event.price_from !== null && event.price_from !== undefined
                                ? event.price_from === 0 ? 'Gratis' : event.price_from < 50 ? '$' : event.price_from < 120 ? '$$' : '$$$'
                                : ''
                          }
                        </span>
                        {/* Vibe Label - one per event based on data */}
                        {(() => {
                          const createdAt = event.created_at ? new Date(event.created_at) : null;
                          const daysSinceCreation = createdAt 
                            ? Math.floor((new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
                            : null;
                          
                          // Trending: more than 10 clicks/views
                          if (event.show_count && event.show_count > 10) {
                            return (
                              <span className="flex items-center gap-1 text-neutral-400">
                                <svg width="12" height="12" viewBox="0 0 24 24" className="flex-shrink-0">
                                  <path d="M12 2C6.5 9 4 14 4 17a8 8 0 0 0 16 0c0-3-2.5-8-8-15z" fill="#f97316" />
                                  <path d="M12 6C8.5 11 7 14.5 7 16.5a5 5 0 0 0 10 0c0-2-1.5-5.5-5-10.5z" fill="#fb923c" />
                                  <path d="M12 10C10 13 9 15 9 16.5a3 3 0 0 0 6 0c0-1.5-1-3.5-3-6.5z" fill="#fbbf24" />
                                  <path d="M12 14c-1 1.5-1.5 2.5-1.5 3.2a1.5 1.5 0 0 0 3 0c0-.7-.5-1.7-1.5-3.2z" fill="#fef3c7" />
                                </svg>
                                <span className="text-[10px]">Trending</span>
                              </span>
                            );
                          }
                          
                          // Must-See: Blockbuster venues
                          const mustSeeVenues = ['beyeler', 'kunsthaus', 'kunstmuseum', 'landesmuseum', 'museum rietberg'];
                          const venueLower = (event.venue_name || '').toLowerCase();
                          const titleLower = (event.title || '').toLowerCase();
                          if (mustSeeVenues.some(v => venueLower.includes(v) || titleLower.includes(v))) {
                            return (
                              <span className="flex items-center gap-1 text-neutral-400">
                                <svg width="12" height="12" viewBox="0 0 24 24" className="flex-shrink-0">
                                  <path d="M7 21h10v-1H7v1z" fill="#b45309" />
                                  <path d="M9 20h6v-3H9v3z" fill="#d97706" />
                                  <path d="M5 3h14v2c0 3-2 6-5 7v2h-4v-2c-3-1-5-4-5-7V3z" fill="#f59e0b" />
                                  <path d="M7 4h10v1.5c0 2.5-1.5 4.5-4 5.5h-2c-2.5-1-4-3-4-5.5V4z" fill="#fbbf24" />
                                  <path d="M5 4H3v3c0 1.5 1 2.5 2 3V4zM19 4h2v3c0 1.5-1 2.5-2 3V4z" fill="#d97706" />
                                  <path d="M9 5.5c0 1.5.8 2.8 2 3.5V5.5H9z" fill="#fef3c7" opacity="0.6" />
                                </svg>
                                <span className="text-[10px]">Must-See</span>
                              </span>
                            );
                          }
                          
                          // Geheimtipp: Smaller museums, less clicks
                          const isSmallVenue = !event.show_count || event.show_count < 5;
                          const geheimtippCategories = ['museum-kunst', 'museum-history', 'galerie'];
                          const isGeheimtippCategory = event.category_sub_id && geheimtippCategories.includes(event.category_sub_id);
                          if (isSmallVenue || isGeheimtippCategory) {
                            return (
                              <span className="flex items-center gap-1 text-neutral-400">
                                <svg width="12" height="12" viewBox="0 0 24 24" className="flex-shrink-0">
                                  <path d="M12 2L2 9l10 13 10-13L12 2z" fill="#a855f7" />
                                  <path d="M12 2L4 9h16L12 2z" fill="#c084fc" />
                                  <path d="M12 22L4 9h4l4 10 4-10h4L12 22z" fill="#9333ea" />
                                  <path d="M8 9l4 10 4-10H8z" fill="#a855f7" />
                                  <path d="M12 2l-4 7h8l-4-7z" fill="#d8b4fe" />
                                  <path d="M10 4l-2 4h3l-1-4z" fill="#f3e8ff" opacity="0.7" />
                                </svg>
                                <span className="text-[10px]">Geheimtipp</span>
                              </span>
                            );
                          }
                          
                          return null;
                        })()}
                      </div>
                      <EventRatingButtons eventId={event.id} eventTitle={event.title} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        <div ref={loadMoreRef} className="h-20 flex justify-center items-center">
          {loadingMore && <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />}
        </div>
      </div>
    </div>
  );
};

export default Listings;
