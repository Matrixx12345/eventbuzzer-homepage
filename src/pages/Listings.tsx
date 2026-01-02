import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { EventRatingButtons } from "@/components/EventRatingButtons";
import { useLikeOnFavorite } from "@/hooks/useLikeOnFavorite";
import ListingsFilterBar from "@/components/ListingsFilterBar";
import ImageAttribution from "@/components/ImageAttribution";
import { BuzzTracker } from "@/components/BuzzTracker";

import { trackEventClick } from "@/services/buzzTracking";
import EventCardSkeleton from "@/components/EventCardSkeleton";
import OptimizedEventImage from "@/components/OptimizedEventImage";
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
import { toggleFavoriteApi } from "@/services/favorites";
import { toast } from "sonner";

// Cloud Supabase für Edge Functions (incl. buzz_boost)
import { supabase } from "@/integrations/supabase/client";
// Externe Supabase nur für direkten Tabellenzugriff (nicht für Edge Functions)
import { externalSupabase } from "@/integrations/supabase/externalClient";

// Placeholder images
import eventAbbey from "@/assets/event-abbey.jpg";
import eventVenue from "@/assets/event-venue.jpg";
import eventConcert from "@/assets/event-concert.jpg";
import swissZurich from "@/assets/swiss-zurich.jpg";
const placeholderImages = [eventAbbey, eventVenue, eventConcert, swissZurich];
const getPlaceholderImage = (index: number) => placeholderImages[index % placeholderImages.length];

// Helper: Konvertiert tags sicher zu einem Array (verhindert .includes() Crashes)
const ensureTagsArray = (tags: unknown): string[] => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.filter(t => typeof t === 'string');
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags);
      return Array.isArray(parsed) ? parsed.filter((t: unknown) => typeof t === 'string') : [];
    } catch {
      return [];
    }
  }
  return [];
};

// Helper: Konvertiert beliebige Werte sicher zu String (verhindert .includes() Crashes)
const ensureString = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return '';
};

// Konvertiert ASCII-Umlaute zu echten deutschen Umlauten
const convertToUmlauts = (text: string | null | undefined): string => {
  if (!text) return "";
  const replacements: [string, string][] = [
    ["fuer", "für"], ["Fuer", "Für"],
    ["ueber", "über"], ["Ueber", "Über"],
    ["Aelteste", "Älteste"], ["aelteste", "älteste"],
    ["Aeltestes", "Ältestes"], ["aeltestes", "ältestes"],
    ["Aeltere", "Ältere"], ["aeltere", "ältere"],
    ["aelter", "älter"], ["Aelter", "Älter"],
    ["oeffentliche", "öffentliche"], ["Oeffentliche", "Öffentliche"],
    ["oeffentlichen", "öffentlichen"], ["Oeffentlichen", "Öffentlichen"],
    ["oeffentlicher", "öffentlicher"], ["Oeffentlicher", "Öffentlicher"],
    ["beruehmte", "berühmte"], ["Beruehmte", "Berühmte"],
    ["beruehmten", "berühmten"], ["Beruehmten", "Berühmten"],
    ["Weltberuehmte", "Weltberühmte"], ["weltberuehmte", "weltberühmte"],
    ["Weltberuehmten", "Weltberühmten"], ["weltberuehmten", "weltberühmten"],
    ["schoene", "schöne"], ["Schoene", "Schöne"],
    ["schoenen", "schönen"], ["Schoenen", "Schönen"],
    ["schoenste", "schönste"], ["Schoenste", "Schönste"],
    ["grossartige", "großartige"], ["Grossartige", "Großartige"],
    ["groesste", "größte"], ["Groesste", "Größte"],
    ["groessere", "größere"], ["Groessere", "Größere"],
    ["hoechste", "höchste"], ["Hoechste", "Höchste"],
    ["fruehere", "frühere"], ["Fruehere", "Frühere"],
    ["taeglich", "täglich"], ["Taeglich", "Täglich"],
    ["jaehrlich", "jährlich"], ["Jaehrlich", "Jährlich"],
    ["natuerlich", "natürlich"], ["Natuerlich", "Natürlich"],
    ["kuenstlerische", "künstlerische"], ["Kuenstlerische", "Künstlerische"],
    ["Kuenstler", "Künstler"], ["kuenstler", "künstler"],
    ["Kuenstlern", "Künstlern"], ["kuenstlern", "künstlern"],
    ["Gemaelde", "Gemälde"], ["gemaelde", "gemälde"],
    ["Stueck", "Stück"], ["stueck", "stück"],
    ["Stuecke", "Stücke"], ["stuecke", "stücke"],
    ["Fuehrung", "Führung"], ["fuehrung", "führung"],
    ["Fuehrungen", "Führungen"], ["fuehrungen", "führungen"],
    ["Eroeffnung", "Eröffnung"], ["eroeffnung", "eröffnung"],
    ["Ausfluege", "Ausflüge"], ["ausfluege", "ausflüge"],
    ["Laerm", "Lärm"], ["laerm", "lärm"],
    ["Geraeusch", "Geräusch"], ["geraeusch", "geräusch"],
    ["Geraeusche", "Geräusche"], ["geraeusche", "geräusche"],
    ["Gebaeude", "Gebäude"], ["gebaeude", "gebäude"],
    ["Naehe", "Nähe"], ["naehe", "nähe"],
    ["Gaeste", "Gäste"], ["gaeste", "gäste"],
    ["Staedte", "Städte"], ["staedte", "städte"],
    ["Plaetze", "Plätze"], ["plaetze", "plätze"],
    ["Spaziergaenge", "Spaziergänge"], ["spaziergaenge", "spaziergänge"],
    ["Anfaenger", "Anfänger"], ["anfaenger", "anfänger"],
    ["Sehenswuerdigkeiten", "Sehenswürdigkeiten"], ["sehenswuerdigkeiten", "sehenswürdigkeiten"],
    ["Zuerich", "Zürich"], ["zuerich", "zürich"],
    ["Muenchen", "München"], ["muenchen", "münchen"],
    ["koennen", "können"], ["Koennen", "Können"],
    ["moechten", "möchten"], ["Moechten", "Möchten"],
    ["wuerden", "würden"], ["Wuerden", "Würden"],
    ["muessen", "müssen"], ["Muessen", "Müssen"],
    ["hoeren", "hören"], ["Hoeren", "Hören"],
    ["gehoert", "gehört"], ["Gehoert", "Gehört"],
    ["fuehrt", "führt"], ["Fuehrt", "Führt"],
    ["praesentiert", "präsentiert"], ["Praesentiert", "Präsentiert"],
    ["beruehrt", "berührt"], ["Beruehrt", "Berührt"],
    ["eroeffnet", "eröffnet"], ["Eroeffnet", "Eröffnet"],
    ["waehrend", "während"], ["Waehrend", "Während"],
  ];
  let result = text;
  for (const [from, to] of replacements) {
    result = result.split(from).join(to);
  }
  return result;
};

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
  sub_category?: string;
  category_main_id?: number;
  created_at?: string;
  favorite_count?: number;
  buzz_score?: number | null;
  click_count?: number;
  source?: string;
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
  const urlSearch = searchParams.get("search");

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
  const [searchQuery, setSearchQuery] = useState(urlSearch || "");

  const buildFilters = useCallback(() => {
    const filters: Record<string, any> = {};
    if (selectedCategoryId !== null) filters.categoryId = selectedCategoryId;
    if (selectedSubcategoryId !== null) filters.subcategoryId = selectedSubcategoryId;
    if (selectedTimeFilter) filters.timeFilter = selectedTimeFilter;
    if (selectedDate) filters.singleDate = selectedDate.toISOString();
    if (searchQuery.trim().length >= 3) filters.search = searchQuery.trim();

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
    searchQuery,
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
        const { data, error } = await externalSupabase
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
    <div className="min-h-screen bg-listings">
      <Navbar />
      
      {/* Hero Section with Filter Bar */}
      <div 
        className="relative w-full py-16 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80')`,
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <ListingsFilterBar
            initialCategory={urlCategory}
            initialMood={urlQuickFilter}
            initialCity={urlCity}
            initialRadius={urlRadius ? parseInt(urlRadius) : 25}
            initialTime={urlTime}
            initialDate={urlDate ? new Date(urlDate) : undefined}
            initialSearch={urlSearch || ""}
            onCategoryChange={handleCategoryChange}
            onMoodChange={handleMoodChange}
            onCityChange={handleCityChange}
            onRadiusChange={handleRadiusChange}
            onTimeChange={handleTimeChange}
            onDateChange={handleDateChange}
            onSearchChange={(search) => setSearchQuery(search)}
          />
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Results Count */}
        <div className="mb-4 text-sm text-foreground/60">
          {loading ? "Lädt..." : `${events.length} von ${totalEvents} Events`}
        </div>

        {/* Subcategory Sticky Bar */}
        {selectedCategoryId && subCategories.length > 0 && (
          <div className="sticky top-0 z-10 bg-listings/95 backdrop-blur-sm py-3 mb-4 -mx-2 px-2 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              <button
                onClick={() => setSelectedSubcategoryId(null)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                  selectedSubcategoryId === null
                    ? "bg-listings-card-content text-listings-text shadow-md"
                    : "bg-white/80 text-foreground border border-foreground/10 hover:bg-white",
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
                      ? "bg-listings-card-content text-listings-text shadow-md"
                      : "bg-white/80 text-foreground border border-foreground/10 hover:bg-white",
                  )}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Events Grid - Alternating Layout with Featured Cards */}
        {loading && !loadingMore ? (
          <div className="space-y-5">
            {/* Skeleton Grid - 5 cards like real layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-[330px_330px] gap-4">
              <EventCardSkeleton />
              <EventCardSkeleton />
              <EventCardSkeleton />
              <EventCardSkeleton />
              <EventCardSkeleton isFeatured />
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Group events into blocks of 5 with alternating featured position */}
            {(() => {
              const blocks: Array<{ events: typeof events; featuredRight: boolean }> = [];
              let currentIndex = 0;
              let blockIndex = 0;
              
              while (currentIndex < events.length) {
                const blockEvents = events.slice(currentIndex, currentIndex + 5);
                blocks.push({
                  events: blockEvents,
                  featuredRight: blockIndex % 2 === 0, // First block: right, second: left, etc.
                });
                currentIndex += 5;
                blockIndex++;
              }
              
              return blocks.map((block, bIdx) => {
                const regularEvents = block.events.slice(0, 4);
                const featuredEvent = block.events[4]; // 5th event becomes featured
                
                // Calculate the actual index offset for this block
                const indexOffset = bIdx * 5;
                
                const renderEventCard = (event: typeof events[0], idx: number, isFeatured: boolean = false) => {
                  const actualIndex = indexOffset + idx;
                  const locationName = getEventLocation(event);
                  const distanceInfo =
                    event.latitude && event.longitude
                      ? getDistanceInfo(event.latitude, event.longitude).distance
                      : null;
                  const isMuseum = event.category_sub_id === 'museum-kunst' || event.sub_category === 'museum-kunst' || event.external_id?.startsWith('manual_');
                  
                  // Permanent-Events: source=manual/myswitzerland ODER start_date vor 2021 (= Placeholder-Datum)
                  const isPermanentEvent = 
                    event.source === 'myswitzerland' || 
                    event.source === 'manual' ||
                    (event.start_date && new Date(event.start_date).getFullYear() <= 2020);
                  
                  // Bestimme Badge-Text: Permanente Events bekommen Kategorie-Tags statt Datum
                  const getBadgeText = () => {
                    if (isMuseum) return 'MUSEUM';
                    if (isPermanentEvent) {
                      // Kategorie-basierter Tag für permanente Attraktionen (mit sicherer String-Konvertierung)
                      const subCat = ensureString(event.category_sub_id) || ensureString(event.sub_category) || '';
                      if (subCat.includes('museum') || subCat.includes('kunst') || subCat.includes('galer')) return 'MUSEUM';
                      if (subCat.includes('wanderung') || subCat.includes('outdoor') || subCat.includes('trail')) return 'WANDERUNG';
                      if (subCat.includes('natur') || subCat.includes('park') || subCat.includes('garten')) return 'NATUR';
                      if (subCat.includes('sehenswuerdigkeit') || subCat.includes('attraction')) return 'SEHENSWÜRDIGKEIT';
                      if (subCat.includes('wellness') || subCat.includes('spa') || subCat.includes('therm')) return 'WELLNESS';
                      if (subCat.includes('schloss') || subCat.includes('burg') || subCat.includes('castle')) return 'SCHLOSS';
                      if (subCat.includes('kirche') || subCat.includes('kloster') || subCat.includes('dom')) return 'KULTUR';
                      if (subCat.includes('zoo') || subCat.includes('tier') || subCat.includes('aquar')) return 'TIERPARK';
                      if (subCat.includes('familie') || subCat.includes('kinder')) return 'FAMILIENAUSFLUG';
                      if (subCat.includes('wissenschaft') || subCat.includes('technik') || subCat.includes('science')) return 'SCIENCE';
                      // Fallback: versuche aus Tags zu lesen
                      const tags = ensureTagsArray(event.tags);
                      if (tags.includes('natur') || tags.includes('natur-erlebnisse')) return 'NATUR';
                      if (tags.includes('wellness') || tags.includes('wellness-selfcare')) return 'WELLNESS';
                      if (tags.includes('familie-kinder')) return 'FAMILIENAUSFLUG';
                      if (tags.includes('wissenschaft') || tags.includes('technik')) return 'SCIENCE';
                      if (tags.includes('kunst') || tags.includes('kultur')) return 'KULTUR';
                      return 'ERLEBNIS';
                    }
                    return formatEventDate(
                      event.start_date,
                      event.external_id,
                      event.date_range_start,
                      event.date_range_end,
                      event.show_count,
                    );
                  };

                  return (
                    <article 
                      key={event.id}
                      className="group relative rounded-xl overflow-hidden bg-listings-card shadow-md hover:shadow-lg border border-stone-200/50 hover:-translate-y-0.5 transition-all duration-300 h-full flex flex-col"
                    >
                      <Link to={`/event/${event.id}`} className="flex-grow flex flex-col min-h-0">
                        <div className="relative overflow-hidden flex-grow">
                          <OptimizedEventImage
                            src={event.image_url || getPlaceholderImage(actualIndex)}
                            alt={event.title}
                            isFeatured={isFeatured}
                            className="group-hover:scale-105"
                          />
                          
                          {/* Date or Category Badge */}
                          <div className="absolute top-3 left-3 bg-white/70 backdrop-blur-md px-2.5 py-1 rounded-lg shadow-sm">
                            <p className="text-[10px] font-semibold text-neutral-700 tracking-wide">
                              {getBadgeText()}
                            </p>
                          </div>
                          
                          {/* Favorite Button */}
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              
                              toggleFavorite({
                                id: event.id,
                                slug: event.id,
                                title: event.title,
                                venue: event.venue_name || "",
                                image: event.image_url || getPlaceholderImage(actualIndex),
                                location: locationName,
                                date: formatEventDate(event.start_date),
                              });
                              
                              try {
                                const numericId = parseInt(event.id, 10);
                                if (!isNaN(numericId)) {
                                  const result = await toggleFavoriteApi(numericId);
                                  setEvents(prev => prev.map(e => 
                                    e.id === event.id 
                                      ? { ...e, favorite_count: result.favoriteCount }
                                      : e
                                  ));
                                }
                              } catch (error) {
                                console.error('Failed to toggle favorite:', error);
                              }
                            }}
                            className="absolute top-3 right-3 p-2 rounded-full bg-white/70 backdrop-blur-md hover:bg-white transition-all shadow-sm"
                            aria-label="Add to favorites"
                          >
                            <Heart
                              size={14}
                              className={isFavorite(event.id) ? "fill-red-500 text-red-500" : "text-neutral-500"}
                            />
                          </button>
                          
                          <ImageAttribution 
                            author={event.image_author} 
                            license={event.image_license} 
                          />
                        </div>
                      </Link>

                      {/* Content Section - Dark elegant background */}
                      <div className="p-4 flex-shrink-0 bg-listings-card-content rounded-b-xl">
                        <div className="group/map relative inline-flex items-center gap-1.5 text-[11px] text-listings-text-muted uppercase tracking-wider font-medium mb-1.5 cursor-pointer w-fit">
                          <MapPin size={11} className="text-listings-text-muted flex-shrink-0" />
                          <span className="truncate border-b border-dotted border-listings-text/20 group-hover/map:text-listings-text transition-colors">
                            {locationName || "Schweiz"}
                            {distanceInfo && <span className="text-listings-text-muted/70 ml-1">• {distanceInfo}</span>}
                          </span>
                          
                          {/* Mini-Map Tooltip */}
                          {event.latitude && event.longitude && (
                            <div className="absolute bottom-full left-0 mb-3 hidden group-hover/map:block z-50 animate-in fade-in zoom-in duration-200">
                              <div className="bg-white p-2 rounded-xl shadow-2xl border border-gray-200 w-44 h-32 overflow-hidden">
                                <div className="relative w-full h-full bg-slate-50 rounded-lg overflow-hidden">
                                  <img 
                                    src="/swiss-outline.svg" 
                                    className="w-full h-full object-contain opacity-30 p-2" 
                                    alt="Switzerland Map" 
                                  />
                                  <div
                                    className="absolute w-3 h-3 bg-red-600 rounded-full border-2 border-white shadow-md animate-bounce"
                                    style={{
                                      left: `${((event.longitude - 5.9) / (10.5 - 5.9)) * 100}%`,
                                      top: `${(1 - (event.latitude - 45.8) / (47.8 - 45.8)) * 100}%`,
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45 -mt-1.5 ml-4 shadow-sm" />
                            </div>
                          )}
                        </div>
                        
                        <Link 
                          to={`/event/${event.id}`}
                          onClick={() => trackEventClick(event.id)}
                        >
                          <h3 className="font-serif font-bold text-listings-text leading-tight hover:text-white transition-colors text-base line-clamp-1">
                            {convertToUmlauts(event.title)}
                          </h3>
                        </Link>
                        
                        <p className="text-xs text-listings-text/90 leading-normal mt-1 line-clamp-1">
                          {convertToUmlauts(event.short_description) || "Entdecke dieses einzigartige Event."}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-3 pt-2 border-t border-listings-text/10 text-[10px] text-listings-text/70">
                          <span>
                            {event.price_from && event.price_from >= 15 
                              ? `ab CHF ${event.price_from}`
                              : event.price_label 
                                ? event.price_label
                                : event.price_from !== null && event.price_from !== undefined
                                  ? event.price_from === 0 ? 'Gratis' : event.price_from < 50 ? '$' : event.price_from < 120 ? '$$' : '$$$'
                                  : ''
                            }
                          </span>
                          <BuzzTracker 
                            buzzScore={event.buzz_score} 
                            editable={true}
                            eventId={event.id}
                            externalId={event.external_id}
                            onBuzzChange={(newScore) => {
                              setEvents(prev => prev.map(e => 
                                e.id === event.id 
                                  ? { ...e, buzz_score: newScore }
                                  : e
                              ));
                            }}
                          />
                          <div className="ml-auto">
                            <EventRatingButtons eventId={event.id} eventTitle={event.title} />
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                };
                
                // If less than 5 events, render simple 3-column grid
                if (!featuredEvent) {
                  return (
                    <div key={bIdx} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:auto-rows-[330px] gap-4">
                      {block.events.map((event, idx) => renderEventCard(event, idx, false))}
                    </div>
                  );
                }
                
                // 5 events: 4 regular in 2x2 + 1 featured spanning 2 rows
                // Grid: 3 columns, 2 rows with FIXED heights
                return (
                  <div key={bIdx} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-[330px_330px] gap-4">
                    {block.featuredRight ? (
                      <>
                        {/* Row 1: Card 1, Card 2 */}
                        <div className="lg:col-start-1 lg:row-start-1">{renderEventCard(regularEvents[0], 0, false)}</div>
                        <div className="lg:col-start-2 lg:row-start-1">{renderEventCard(regularEvents[1], 1, false)}</div>
                        {/* Featured: Column 3, spans both rows */}
                        <div className="lg:col-start-3 lg:row-start-1 lg:row-span-2">{renderEventCard(featuredEvent, 4, true)}</div>
                        {/* Row 2: Card 3, Card 4 */}
                        <div className="lg:col-start-1 lg:row-start-2">{renderEventCard(regularEvents[2], 2, false)}</div>
                        <div className="lg:col-start-2 lg:row-start-2">{renderEventCard(regularEvents[3], 3, false)}</div>
                      </>
                    ) : (
                      <>
                        {/* Featured: Column 1, spans both rows */}
                        <div className="lg:col-start-1 lg:row-start-1 lg:row-span-2">{renderEventCard(featuredEvent, 4, true)}</div>
                        {/* Row 1: Card 1, Card 2 */}
                        <div className="lg:col-start-2 lg:row-start-1">{renderEventCard(regularEvents[0], 0, false)}</div>
                        <div className="lg:col-start-3 lg:row-start-1">{renderEventCard(regularEvents[1], 1, false)}</div>
                        {/* Row 2: Card 3, Card 4 */}
                        <div className="lg:col-start-2 lg:row-start-2">{renderEventCard(regularEvents[2], 2, false)}</div>
                        <div className="lg:col-start-3 lg:row-start-2">{renderEventCard(regularEvents[3], 3, false)}</div>
                      </>
                    )}
                  </div>
                );
              });
            })()}
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
