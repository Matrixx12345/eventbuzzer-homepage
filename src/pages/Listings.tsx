import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { EventRatingButtons } from "@/components/EventRatingButtons";
import { useLikeOnFavorite } from "@/hooks/useLikeOnFavorite";
import {
  Heart,
  SlidersHorizontal,
  X,
  MapPin,
  Calendar as CalendarIcon,
  Loader2,
  Music,
  Palette,
  Sparkles,
  UtensilsCrossed,
  Gift,
  LayoutGrid,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useFavorites } from "@/contexts/FavoritesContext";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { getNearestPlace } from "@/utils/swissPlaces";
import DiscoverHeroFilterBar, { categories, moods } from "@/components/DiscoverHeroFilterBar";

// Hero image
import heroMountains from "@/assets/hero-mountains.jpg";

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

const quickFilters = [
  { id: "geburtstag", label: "Geburtstag", tags: ["besondere-anlaesse", "freunde-gruppen"] },
  { id: "mistwetter", label: "Mistwetter", tags: ["schlechtwetter-indoor"] },
  { id: "top-stars", label: "Top Stars", tags: ["vip-artists"] },
  { id: "foto-spots", label: "Foto-Spots", tags: ["foto-spot"] },
  { id: "romantik", label: "Romantik", tags: ["romantisch-date"] },
  { id: "mit-kind", label: "Mit Kind", tags: ["familie-kinder", "kleinkinder", "schulkinder", "teenager"] },
  { id: "nightlife", label: "Nightlife", tags: ["nightlife-party", "afterwork", "rooftop-aussicht"] },
  { id: "wellness", label: "Wellness", tags: ["wellness-selfcare"] },
  { id: "natur", label: "Natur", tags: ["natur-erlebnisse", "open-air"] },
];

const Listings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { sendLike } = useLikeOnFavorite();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [events, setEvents] = useState<ExternalEvent[]>([]);
  const [taxonomy, setTaxonomy] = useState<TaxonomyItem[]>([]);
  const [taxonomyLoaded, setTaxonomyLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalEvents, setTotalEvents] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [nextOffset, setNextOffset] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // URL parameter auslesen
  const urlQuickFilter = searchParams.get("quickFilter");
  const urlCategory = searchParams.get("category");
  const urlCity = searchParams.get("city");
  const urlRadius = searchParams.get("radius");
  const urlTime = searchParams.get("time");
  const urlDate = searchParams.get("date");

  // Filter states
  const [selectedCity, setSelectedCity] = useState(urlCity || "");
  const [radius, setRadius] = useState(urlRadius ? parseInt(urlRadius) : 0);
  const [selectedQuickFilters, setSelectedQuickFilters] = useState<string[]>(urlQuickFilter ? [urlQuickFilter] : []);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(urlCategory || null);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string | null>(urlTime || null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(urlDate ? new Date(urlDate) : undefined);

  const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = useMemo(
    () => ({
      zürich: { lat: 47.3769, lng: 8.5417 },
      bern: { lat: 46.948, lng: 7.4474 },
      basel: { lat: 47.5596, lng: 7.5886 },
      luzern: { lat: 47.0502, lng: 8.3093 },
      genf: { lat: 46.2044, lng: 6.1432 },
      baden: { lat: 47.4734, lng: 8.3063 },
      winterthur: { lat: 47.4984, lng: 8.7246 },
      "st. gallen": { lat: 47.4245, lng: 9.3767 },
    }),
    [],
  );

  const hasActiveFilters =
    selectedCity !== "" ||
    radius > 0 ||
    selectedQuickFilters.length > 0 ||
    selectedCategoryId !== null ||
    selectedTimeFilter !== null ||
    selectedDate !== undefined;

  const clearFilters = () => {
    setSelectedCity("");
    setRadius(0);
    setSelectedQuickFilters([]);
    setSelectedCategoryId(null);
    setSelectedSubcategoryId(null);
    setSelectedTimeFilter(null);
    setSelectedDate(undefined);
    setSearchParams({});
  };

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
    selectedQuickFilters.forEach(filterId => {
      const qf = quickFilters.find(f => f.id === filterId);
      if (qf) tags.push(...qf.tags);
    });
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
    CITY_COORDINATES,
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

  const getEventLocation = (event: ExternalEvent): string => {
    const countryNames = [
      "schweiz", "switzerland", "suisse", "svizzera", "germany", "deutschland",
      "france", "frankreich", "austria", "österreich", "italy", "italien", "liechtenstein",
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

  const mainCategories = useMemo(
    () => taxonomy.filter((t) => t.type === "main").sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)),
    [taxonomy],
  );
  
  const subCategories = useMemo(() => {
    if (!selectedCategoryId) return [];
    return taxonomy
      .filter((t) => t.type === "sub" && t.parent_id === selectedCategoryId)
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }, [taxonomy, selectedCategoryId]);

  // Hero filter bar callbacks
  const handleCategoryChange = (cat: typeof categories[0]) => {
    if (cat.id === null) {
      setSelectedCategoryId(null);
    } else {
      const matchingTaxonomy = taxonomy.find(t => t.slug === cat.slug);
      setSelectedCategoryId(matchingTaxonomy?.id || null);
    }
    setSelectedSubcategoryId(null);
  };

  const handleMoodChange = (mood: typeof moods[0]) => {
    if (mood.id === null) {
      setSelectedQuickFilters([]);
    } else {
      setSelectedQuickFilters([mood.id as string]);
    }
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
  };

  const handleRadiusChange = (r: number) => {
    setRadius(r);
  };

  const handleTimeChange = (time: string | null) => {
    setSelectedTimeFilter(time);
  };

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleSearch = () => {
    // Filters are already applied via state, just scroll to results
    const resultsSection = document.getElementById('results-section');
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Get icon for category
  const getCategoryIcon = (catName: string) => {
    if (catName.includes("Musik")) return Music;
    if (catName.includes("Kunst")) return Palette;
    if (catName.includes("Kulinarik")) return UtensilsCrossed;
    if (catName.includes("Freizeit") || catName.includes("Natur")) return Sparkles;
    if (catName.includes("Märkte")) return Gift;
    return LayoutGrid;
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      
      {/* Hero Section - Slimmer version */}
      <div className="relative h-[280px] md:h-[320px] overflow-hidden">
        <img
          src={heroMountains}
          alt="Swiss Mountains"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Search Bar centered in hero */}
        <div className="absolute inset-0 flex items-center justify-center pt-16">
          <DiscoverHeroFilterBar
            initialCategory={urlCategory}
            initialMood={urlQuickFilter}
            initialCity={urlCity || ""}
            initialRadius={urlRadius ? parseInt(urlRadius) : 25}
            initialTime={urlTime}
            initialDate={urlDate ? new Date(urlDate) : undefined}
            onCategoryChange={handleCategoryChange}
            onMoodChange={handleMoodChange}
            onCityChange={handleCityChange}
            onRadiusChange={handleRadiusChange}
            onTimeChange={handleTimeChange}
            onDateChange={handleDateChange}
            onSearch={handleSearch}
          />
        </div>
      </div>

      {/* Sticky Sub-Navigation */}
      <div className="sticky top-0 z-20 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            {/* Scrollable Category/Subcategory Pills */}
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 min-w-max pr-4">
                {/* Main categories as pills if no category selected */}
                {!selectedCategoryId && mainCategories.map((cat) => {
                  const Icon = getCategoryIcon(cat.name);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategoryId(cat.id);
                        setSelectedSubcategoryId(null);
                      }}
                      className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all bg-white text-foreground/70 border hover:bg-muted flex items-center gap-2"
                    >
                      <Icon size={14} />
                      {cat.name}
                    </button>
                  );
                })}
                
                {/* Subcategories when category is selected */}
                {selectedCategoryId && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedCategoryId(null);
                        setSelectedSubcategoryId(null);
                      }}
                      className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all bg-foreground text-background"
                    >
                      ← Alle
                    </button>
                    <button
                      onClick={() => setSelectedSubcategoryId(null)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                        selectedSubcategoryId === null
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-white text-foreground/70 border hover:bg-muted"
                      )}
                    >
                      Alle {mainCategories.find(c => c.id === selectedCategoryId)?.name}
                    </button>
                    {subCategories.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => setSelectedSubcategoryId(sub.id === selectedSubcategoryId ? null : sub.id)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                          selectedSubcategoryId === sub.id
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "bg-white text-foreground/70 border hover:bg-muted"
                        )}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Filter Button */}
            <div className="flex items-center gap-3 pl-4 border-l ml-4">
              <button
                onClick={() => setShowAdvancedFilters(true)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border",
                  hasActiveFilters 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-white text-foreground/70 hover:bg-muted"
                )}
              >
                <SlidersHorizontal size={16} />
                <span className="hidden sm:inline">Filter</span>
                {hasActiveFilters && (
                  <span className="w-5 h-5 rounded-full bg-white/20 text-xs flex items-center justify-center">
                    !
                  </span>
                )}
              </button>
              
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X size={16} className="text-foreground/60" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div id="results-section" className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-foreground/60">
            {loading ? "Lädt Events..." : `${totalEvents} Events gefunden`}
          </p>
        </div>

        {/* Events Grid - 4 columns on large screens */}
        {loading && !loadingMore ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-foreground/40" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {events.map((event, index) => (
              <Link key={event.id} to={`/event/${event.id}`} className="block group">
                <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="relative overflow-hidden">
                    <img
                      src={event.image_url || getPlaceholderImage(index)}
                      alt={event.title}
                      className="w-full aspect-[4/5] object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFavorite({
                          id: event.id,
                          slug: event.id,
                          title: event.title,
                          venue: event.venue_name || "",
                          image: event.image_url || getPlaceholderImage(index),
                          location: getEventLocation(event),
                          date: formatEventDate(event.start_date),
                        });
                      }}
                      className="absolute top-3 right-3 p-2.5 rounded-full bg-white/95 shadow-sm hover:scale-110 transition-transform"
                    >
                      <Heart
                        size={16}
                        className={isFavorite(event.id) ? "fill-red-500 text-red-500" : "text-foreground/50"}
                      />
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-foreground/50 font-medium">
                        {formatEventDate(
                          event.start_date,
                          event.external_id,
                          event.date_range_start,
                          event.date_range_end,
                          event.show_count,
                        )}
                      </p>
                      <EventRatingButtons eventId={event.id} eventTitle={event.title} />
                    </div>
                    <h3 className="font-serif text-base text-foreground line-clamp-2 leading-snug">{event.title}</h3>
                    <div className="flex items-center gap-1.5 text-sm text-foreground/60 mt-1.5">
                      <MapPin size={12} className="text-red-500 flex-shrink-0" />
                      {(() => {
                        const locationName = getEventLocation(event);
                        const distanceInfo =
                          event.latitude && event.longitude
                            ? getDistanceInfo(event.latitude, event.longitude).distance
                            : null;

                        if (locationName && distanceInfo) {
                          return (
                            <>
                              <span className="truncate">{locationName}</span>
                              <span className="text-xs text-foreground/40 flex-shrink-0">• {distanceInfo}</span>
                            </>
                          );
                        } else if (locationName) {
                          return <span className="truncate">{locationName}</span>;
                        } else if (distanceInfo) {
                          return <span className="truncate">{distanceInfo}</span>;
                        } else {
                          return <span className="truncate">Schweiz</span>;
                        }
                      })()}
                    </div>
                    {event.price_from && (
                      <p className="text-sm font-medium text-foreground mt-2">ab CHF {event.price_from}</p>
                    )}
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
        
        {/* Load more trigger */}
        <div ref={loadMoreRef} className="h-20 flex justify-center items-center">
          {loadingMore && <Loader2 className="w-6 h-6 animate-spin text-foreground/40" />}
        </div>
      </div>

      {/* Advanced Filters Dialog */}
      <Dialog open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
        <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-3xl p-6">
          <h2 className="text-lg font-semibold mb-4">Erweiterte Filter</h2>
          
          <div className="space-y-4">
            <p className="text-sm text-foreground/60">
              Nutze die Suchleiste oben für Kategorie, Stimmung, Ort und Datum.
            </p>
            
            {hasActiveFilters && (
              <button
                onClick={() => {
                  clearFilters();
                  setShowAdvancedFilters(false);
                }}
                className="w-full py-3 bg-foreground text-background rounded-xl font-medium hover:bg-foreground/90 transition-colors"
              >
                Alle Filter zurücksetzen
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Listings;
