import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { EventRatingButtons } from "@/components/EventRatingButtons";
import { useLikeOnFavorite } from "@/hooks/useLikeOnFavorite";
import ListingsFilterBar from "@/components/ListingsFilterBar";
import {
  Heart,
  MapPin,
  Loader2,
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
          body: { offset, limit: 30, initialLoad: isInitial, filters: buildFilters() },
        });
        if (error) throw error;
        if (data?.events) setEvents((prev) => (isInitial ? data.events : [...prev, ...data.events]));
        if (data?.pagination) {
          setHasMore(data.pagination.hasMore);
          setNextOffset(data.pagination.nextOffset || offset + 30);
          setTotalEvents(data.pagination.total);
        }
        if (isInitial && data?.taxonomy) setTaxonomy(data.taxonomy);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [nextOffset, buildFilters],
  );

  // Taxonomy aus Supabase laden
  useEffect(() => {
    const loadTaxonomy = async () => {
      try {
        const { data, error } = await supabase
          .from("taxonomy")
          .select("id, slug, name, type, parent_id, display_order, is_active")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (error) {
          console.error("Taxonomy load error:", error);
          return;
        }

        if (data && data.length > 0) {
          setTaxonomy(
            data.map((t: any) => ({
              id: t.id,
              slug: t.slug,
              name: t.name,
              type: t.type as "main" | "sub",
              parent_id: t.parent_id,
              display_order: t.display_order,
              is_active: t.is_active,
            })),
          );
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

        {/* Events Grid - 4 columns on desktop */}
        {loading && !loadingMore ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
            {events.map((event, index) => {
              const locationName = getEventLocation(event);
              const distanceInfo =
                event.latitude && event.longitude
                  ? getDistanceInfo(event.latitude, event.longitude).distance
                  : null;

              return (
                <article 
                  key={event.id}
                  className="break-inside-avoid bg-white rounded-xl overflow-hidden shadow-sm border border-neutral-100 hover:shadow-lg transition-shadow duration-300"
                >
                  <Link to={`/event/${event.id}`}>
                    <div className="relative overflow-hidden">
                      <img
                        src={event.image_url || getPlaceholderImage(index)}
                        alt={event.title}
                        className={`w-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                          index % 5 === 0 ? 'aspect-[4/5]' : index % 3 === 0 ? 'aspect-[3/4]' : 'aspect-[5/4]'
                        }`}
                      />
                      
                      {/* Date Badge - Top Left */}
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-sm">
                        <p className="text-[11px] font-semibold text-neutral-700">
                          {formatEventDate(
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
                        className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
                        aria-label="Add to favorites"
                      >
                        <Heart
                          size={18}
                          className={isFavorite(event.id) ? "fill-red-500 text-red-500" : "text-neutral-500"}
                        />
                      </button>
                      
                      {/* Title Overlay - Bottom Left */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4 pt-12">
                        <h3 className="font-serif text-lg text-white font-semibold line-clamp-2 drop-shadow-md">
                          {event.title}
                        </h3>
                      </div>
                    </div>
                  </Link>

                  {/* Content Section */}
                  <div className="p-4">
                    {/* Location with Map Hover */}
                    <div className="group/map relative cursor-pointer">
                      <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                        <MapPin size={14} className="text-red-500 flex-shrink-0" />
                        {locationName && distanceInfo ? (
                          <>
                            <span className="truncate">{locationName}</span>
                            <span className="text-xs text-neutral-400 flex-shrink-0">• {distanceInfo}</span>
                          </>
                        ) : locationName ? (
                          <span className="truncate">{locationName}</span>
                        ) : distanceInfo ? (
                          <span className="truncate">{distanceInfo}</span>
                        ) : (
                          <span className="truncate">Schweiz</span>
                        )}
                      </div>
                      {event.latitude && event.longitude && (
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/map:block z-50 animate-in fade-in zoom-in duration-200">
                          <div className="bg-white p-3 rounded-xl shadow-2xl border w-48 h-40">
                            <div className="relative w-full h-full bg-slate-50 rounded-lg overflow-hidden">
                              <img src="/swiss-outline.svg" className="w-full h-full object-contain" alt="Map" />
                              <div
                                className="absolute w-3 h-3 bg-red-600 rounded-full border-2 border-white shadow-lg"
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
                    
                    {/* Short Description */}
                    {event.short_description && (
                      <p className="text-xs text-neutral-500 mt-2 line-clamp-2">{event.short_description}</p>
                    )}
                    
                    {/* Price & Rating Row */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-100">
                      <div className="flex items-center gap-2">
                        {event.price_from && (
                          <span className="text-sm font-medium text-neutral-800">ab CHF {event.price_from}</span>
                        )}
                      </div>
                      <div className="opacity-40 hover:opacity-100 transition-opacity">
                        <EventRatingButtons eventId={event.id} eventTitle={event.title} />
                      </div>
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
