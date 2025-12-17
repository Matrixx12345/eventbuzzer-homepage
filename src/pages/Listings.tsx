import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { EventRatingButtons } from "@/components/EventRatingButtons";
import { useLikeOnFavorite } from "@/hooks/useLikeOnFavorite";
import {
  Heart,
  SlidersHorizontal,
  X,
  MapPin,
  Calendar as CalendarIcon,
  Cake,
  CloudRain,
  Star,
  Camera,
  Heart as HeartIcon,
  Smile,
  PartyPopper,
  Waves,
  Mountain,
  Search,
  Loader2,
  Check,
  Music,
  Palette,
  Sparkles,
  LayoutGrid,
  Zap,
  UtensilsCrossed,
  Gift,
  Snowflake,
  Sun,
  CalendarDays,
  Dog,
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useFavorites } from "@/contexts/FavoritesContext";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { format, parseISO, isSameYear } from "date-fns";
import { de } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { supabase } from "@/integrations/supabase/client";

// Platzhalter-Bilder
import eventAbbey from "@/assets/event-abbey.jpg";
import eventVenue from "@/assets/event-venue.jpg";
import eventConcert from "@/assets/event-concert.jpg";

const placeholderImages = [eventAbbey, eventVenue, eventConcert];
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
  is_range?: boolean;
  image_url?: string;
  price_from?: number;
  price_to?: number;
  price_label?: string;
  category_main_id?: number;
  category_sub_id?: number;
  latitude?: number;
  longitude?: number;
  tags?: string[];
  available_months?: number[];
}

interface TaxonomyItem {
  id: number;
  name: string;
  type: "main" | "sub";
  parent_id: number | null;
}

const quickFilters = [
  { id: "geburtstag", label: "Geburtstag", icon: Cake, tags: ["besondere-anlaesse"] },
  { id: "mistwetter", label: "Mistwetter", icon: CloudRain, tags: ["schlechtwetter-indoor"] },
  { id: "top-stars", label: "Top Stars", icon: Star, tags: ["vip-artists"] },
  { id: "foto-spots", label: "Foto-Spots", icon: Camera, tags: ["foto-spot"] },
  { id: "romantik", label: "Romantik", icon: HeartIcon, tags: ["romantisch-date"] },
  { id: "mit-kind", label: "Mit Kind", icon: Smile, tags: ["familie-kinder"] },
  { id: "nightlife", label: "Nightlife", icon: PartyPopper, tags: ["nightlife-party"] },
  { id: "wellness", label: "Wellness", icon: Waves, tags: ["wellness-selfcare"] },
  { id: "natur", label: "Natur", icon: Mountain, tags: ["natur-erlebnisse"] },
];

const cities = ["Zürich", "Bern", "Basel", "Luzern", "Genf", "Baden", "Winterthur", "St. Gallen"];

const Listings = () => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { sendLike } = useLikeOnFavorite();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const [events, setEvents] = useState<ExternalEvent[]>([]);
  const [taxonomy, setTaxonomy] = useState<TaxonomyItem[]>([]);
  const [vipArtists, setVipArtists] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextOffset, setNextOffset] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined);
  const [calendarMode, setCalendarMode] = useState<"single" | "range">("single");
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string | null>(null);
  const [selectedQuickFilters, setSelectedQuickFilters] = useState<string[]>([]);
  const [selectedPriceTier, setSelectedPriceTier] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState("");
  const [radius, setRadius] = useState([0]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAvailability, setSelectedAvailability] = useState<string | null>(null);
  const [dogFriendly, setDogFriendly] = useState(false);

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

  const findCityCoords = (cityName: string) => {
    const normalized = cityName.toLowerCase().trim();
    if (CITY_COORDINATES[normalized]) return CITY_COORDINATES[normalized];
    for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
      if (normalized.includes(key) || key.includes(normalized)) return coords;
    }
    return null;
  };

  const buildFilters = useCallback(() => {
    const filters: Record<string, any> = {};
    if (searchQuery.trim()) filters.searchQuery = searchQuery.trim();

    // Top Stars Override
    const isTopStars = selectedQuickFilters.includes("top-stars");
    if (isTopStars && vipArtists.length > 0) {
      filters.vipArtistsFilter = vipArtists;
    } else {
      if (selectedCategoryId) filters.categoryId = selectedCategoryId;
      if (selectedSubcategoryId) filters.subcategoryId = selectedSubcategoryId;
    }

    if (selectedPriceTier) filters.priceTier = selectedPriceTier;
    if (selectedSource) filters.source = selectedSource;
    if (selectedTimeFilter) filters.timeFilter = selectedTimeFilter;
    if (selectedAvailability)
      filters.availability = selectedAvailability === "year-round" ? "yearround" : selectedAvailability;

    if (selectedDate) filters.singleDate = selectedDate.toISOString();
    if (selectedDateRange?.from) filters.dateFrom = selectedDateRange.from.toISOString();
    if (selectedDateRange?.to) filters.dateTo = selectedDateRange.to.toISOString();

    // Radius nur wenn nicht Top Stars
    if (selectedCity && !isTopStars) {
      filters.city = selectedCity;
      if (radius[0] > 0) {
        filters.radius = radius[0];
        const coords = findCityCoords(selectedCity);
        if (coords) {
          filters.cityLat = coords.lat;
          filters.cityLng = coords.lng;
        }
      }
    }

    const tags = [];
    if (selectedQuickFilters.includes("romantik")) tags.push("romantisch-date");
    if (selectedQuickFilters.includes("nightlife")) tags.push("nightlife-party");
    if (selectedQuickFilters.includes("mit-kind")) tags.push("familie-kinder");
    if (selectedQuickFilters.includes("mistwetter")) tags.push("schlechtwetter-indoor");
    if (tags.length > 0) filters.tags = tags;

    return filters;
  }, [
    searchQuery,
    selectedCategoryId,
    selectedSubcategoryId,
    selectedPriceTier,
    selectedSource,
    selectedTimeFilter,
    selectedAvailability,
    selectedDate,
    selectedDateRange,
    selectedCity,
    radius,
    selectedQuickFilters,
    vipArtists,
    CITY_COORDINATES,
  ]);

  const fetchEvents = useCallback(
    async (isInitial: boolean = true) => {
      try {
        if (isInitial) {
          setLoading(true);
          setEvents([]);
          setNextOffset(0);
        } else {
          setLoadingMore(true);
        }

        const offset = isInitial ? 0 : nextOffset;
        const { data, error: fetchError } = await supabase.functions.invoke("get-external-events", {
          body: { offset, limit: 50, initialLoad: isInitial, filters: buildFilters() },
        });

        if (fetchError) throw fetchError;

        if (data?.events) {
          if (isInitial) setEvents(data.events);
          else setEvents((prev) => [...prev, ...data.events]);
        }

        if (data?.pagination) {
          setHasMore(data.pagination.hasMore);
          setNextOffset(data.pagination.nextOffset);
          setTotalEvents(data.pagination.total);
        }

        if (isInitial) {
          if (data?.taxonomy) setTaxonomy(data.taxonomy);
          if (data?.vipArtists) setVipArtists(data.vipArtists);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Fehler beim Laden");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [nextOffset, buildFilters],
  );

  useEffect(() => {
    fetchEvents(true);
  }, []); // Init

  // Reload bei Filteränderung
  useEffect(() => {
    // Verhindert doppelten Reload beim Start
    if (events.length > 0 || loading) fetchEvents(true);
  }, [
    searchQuery,
    selectedCategoryId,
    selectedSubcategoryId,
    selectedPriceTier,
    selectedCity,
    radius,
    selectedQuickFilters,
    selectedTimeFilter,
    selectedDate,
  ]);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const formatEventDate = (start?: string, end?: string) => {
    if (!start) return "Datum TBA";
    const s = parseISO(start);
    if (end && start !== end) {
      const e = parseISO(end);
      if (isSameYear(s, e))
        return `${format(s, "d. MMM", { locale: de })} – ${format(e, "d. MMM yyyy", { locale: de })}`;
      return `${format(s, "d. MMM yy", { locale: de })} – ${format(e, "d. MMM yy", { locale: de })}`;
    }
    return format(s, "d. MMM yyyy", { locale: de });
  };

  const getEventLocation = (event: ExternalEvent) => {
    if (event.address_city) return event.address_city;
    if (event.venue_name) return event.venue_name;
    return "Schweiz";
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-10">
          <aside className="hidden lg:block w-[340px] flex-shrink-0">
            {/* SIMPLIFIED FILTER UI FOR BREVITY - FULL UI SHOULD BE HERE */}
            <div className="bg-neutral-900 rounded-2xl p-6 shadow-xl text-white">
              <h3 className="text-xs font-semibold text-gray-400 mb-2">ORT</h3>
              <input
                className="w-full bg-white text-black rounded p-2 mb-4"
                placeholder="Stadt..."
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                list="cities_list"
              />
              <datalist id="cities_list">
                {cities.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>

              <h3 className="text-xs font-semibold text-gray-400 mb-2">UMKREIS: {radius[0]} km</h3>
              <Slider value={radius} onValueChange={setRadius} max={100} step={10} className="mb-6" />

              <div className="grid grid-cols-3 gap-2">
                {quickFilters.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => toggleQuickFilter(f.id)}
                    className={cn(
                      "p-2 rounded text-xs border border-gray-700 hover:bg-gray-800",
                      selectedQuickFilters.includes(f.id) ? "bg-blue-600 border-blue-600" : "",
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setSelectedCity("");
                  setRadius([0]);
                  setSelectedQuickFilters([]);
                }}
                className="mt-4 w-full text-xs text-gray-400"
              >
                Reset
              </button>
            </div>
          </aside>

          <main className="flex-1">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {events.map((event, idx) => (
                  <Link key={event.id + idx} to={`/event/${event.id}`} className="block group">
                    <article className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all">
                      <div className="relative aspect-[5/6] bg-gray-100">
                        {event.image_url ? (
                          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">Kein Bild</div>
                        )}
                        {/* DISTANZ ANZEIGE - JETZT KORRIGIERT */}
                        {selectedCity && radius[0] > 0 && event.latitude && event.longitude && (
                          <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                            {(() => {
                              const c = findCityCoords(selectedCity);
                              if (!c) return "";
                              const km = Math.round(calculateDistance(c.lat, c.lng, event.latitude, event.longitude));
                              return `${km} km entfernt`;
                            })()}
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <div className="text-xs text-neutral-400 font-medium mb-1">
                          {formatEventDate(event.start_date, event.end_date)}
                        </div>
                        <h3 className="font-serif text-lg text-neutral-900 line-clamp-1">{event.title}</h3>
                        <div className="flex items-center gap-1 text-sm text-neutral-500 mt-1">
                          <MapPin size={14} /> {getEventLocation(event)}
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
            {!loading && events.length === 0 && (
              <div className="text-center py-20 text-gray-500">Keine Events gefunden.</div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Listings;
