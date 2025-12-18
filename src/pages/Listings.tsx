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
  Flame,
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
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import {
  format,
  addDays,
  addWeeks,
  isToday,
  isTomorrow,
  parseISO,
  isSameDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  isAfter,
  isBefore,
} from "date-fns";
import { de } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

// DIREKT-VERBINDUNG: Wir bauen den Client hier ein, damit kein Import-Fehler mehr kommt
import { createClient } from "@supabase/supabase-js";
const EXTERNAL_URL = "https://tfkiyvhfhvkejpljsnrk.supabase.co";
const EXTERNAL_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRma2l5dmhmaHZrZWpwbGpzbnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDA4MDQsImV4cCI6MjA4MDY3NjgwNH0.bth3dTvG3fXSu4qILB514x1TRy0scRLo_KM9lDMMKDs";
const supabase = createClient(EXTERNAL_URL, EXTERNAL_KEY);

// Placeholder images for fallback
import eventAbbey from "@/assets/event-abbey.jpg";
import eventVenue from "@/assets/event-venue.jpg";
import eventConcert from "@/assets/event-concert.jpg";
import eventSymphony from "@/assets/event-symphony.jpg";
import swissZurich from "@/assets/swiss-zurich.jpg";
import swissBern from "@/assets/swiss-bern.jpg";
import swissLucerne from "@/assets/swiss-lucerne.jpg";
import swissGeneva from "@/assets/swiss-geneva.jpg";
import weekendJazz from "@/assets/weekend-jazz.jpg";
import weekendOpera from "@/assets/weekend-opera.jpg";
import festivalCrowd from "@/assets/festival-crowd.jpg";
import festivalSinger from "@/assets/festival-singer.jpg";
import festivalStage from "@/assets/festival-stage.jpg";
import festivalFriends from "@/assets/festival-friends.jpg";
import festivalChoir from "@/assets/festival-choir.jpg";

const placeholderImages = [
  eventAbbey,
  eventVenue,
  eventConcert,
  eventSymphony,
  swissZurich,
  swissBern,
  swissLucerne,
  swissGeneva,
  weekendJazz,
  weekendOpera,
  festivalCrowd,
  festivalSinger,
  festivalStage,
  festivalFriends,
  festivalChoir,
];

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
  ticket_link?: string;
  category_main_id?: number;
  category_sub_id?: number;
  latitude?: number;
  longitude?: number;
  tags?: string[];
  available_months?: number[];
  date_range_start?: string;
  date_range_end?: string;
  show_count?: number;
}

interface TaxonomyItem {
  id: number;
  name: string;
  type: "main" | "sub";
  parent_id: number | null;
}

const quickFilters = [
  { id: "geburtstag", label: "Geburtstag", icon: Cake, tags: ["besondere-anlaesse", "freunde-gruppen"] },
  { id: "mistwetter", label: "Mistwetter", icon: CloudRain, tags: ["schlechtwetter-indoor"] },
  { id: "top-stars", label: "Top Stars", icon: Star, tags: ["vip-artists"] },
  { id: "foto-spots", label: "Foto-Spots", icon: Camera, tags: ["foto-spot"] },
  { id: "romantik", label: "Romantik", icon: HeartIcon, tags: ["romantisch-date"] },
  {
    id: "mit-kind",
    label: "Mit Kind",
    icon: Smile,
    tags: ["familie-kinder", "kleinkinder", "schulkinder", "teenager"],
  },
  {
    id: "nightlife",
    label: "Nightlife",
    icon: PartyPopper,
    tags: ["nightlife-party", "afterwork", "rooftop-aussicht"],
  },
  { id: "wellness", label: "Wellness", icon: Waves, tags: ["wellness-selfcare"] },
  { id: "natur", label: "Natur", icon: Mountain, tags: ["natur-erlebnisse", "open-air"] },
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
  const [searchQuery, setSearchQuery] = useState("");
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

  // FIX: Die fehlende clearFilters Funktion
  const clearFilters = () => {
    setSelectedDate(undefined);
    setSelectedDateRange(undefined);
    setSelectedTimeFilter(null);
    setSelectedQuickFilters([]);
    setSelectedPriceTier(null);
    setSelectedCity("");
    setRadius([0]);
    setSelectedCategoryId(null);
    setSelectedSubcategoryId(null);
    setSearchQuery("");
    setDogFriendly(false);
  };

  const buildFilters = useCallback(() => {
    const filters: Record<string, any> = {};
    if (searchQuery.trim()) filters.searchQuery = searchQuery.trim();
    if (selectedCategoryId !== null) filters.categoryId = selectedCategoryId;
    if (selectedSubcategoryId !== null) filters.subcategoryId = selectedSubcategoryId;
    if (selectedPriceTier) filters.priceTier = selectedPriceTier;
    if (selectedTimeFilter) filters.timeFilter = selectedTimeFilter;
    if (selectedCity) {
      filters.city = selectedCity;
      if (radius[0] > 0) {
        filters.radius = radius[0];
        const coords = CITY_COORDINATES[selectedCity.toLowerCase()];
        if (coords) {
          filters.cityLat = coords.lat;
          filters.cityLng = coords.lng;
        }
      }
    }
    if (selectedQuickFilters.length > 0) {
      const tags: string[] = [];
      if (selectedQuickFilters.includes("romantik")) tags.push("romantisch-date");
      if (selectedQuickFilters.includes("wellness")) tags.push("wellness-selfcare");
      if (selectedQuickFilters.includes("mistwetter")) tags.push("schlechtwetter-indoor");
      if (selectedQuickFilters.includes("mit-kind")) tags.push("familie-kinder");
      if (selectedQuickFilters.includes("natur")) tags.push("natur-erlebnisse");
      if (tags.length > 0) filters.tags = tags;
    }
    return filters;
  }, [
    searchQuery,
    selectedCategoryId,
    selectedSubcategoryId,
    selectedPriceTier,
    selectedTimeFilter,
    selectedCity,
    radius,
    selectedQuickFilters,
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
        const filters = buildFilters();

        const { data, error: fetchError } = await supabase.functions.invoke("get-external-events", {
          body: { offset, limit: 30, initialLoad: isInitial, filters },
        });

        if (fetchError) throw new Error(fetchError.message);

        if (data?.events) {
          if (isInitial) setEvents(data.events);
          else setEvents((prev) => [...prev, ...data.events]);
        }

        if (data?.pagination) {
          setHasMore(data.pagination.hasMore);
          setNextOffset(data.pagination.nextOffset || offset + 30);
          setTotalEvents(data.pagination.total);
        }
        if (isInitial && data?.taxonomy) setTaxonomy(data.taxonomy);
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
    const timeoutId = setTimeout(() => fetchEvents(true), 400);
    return () => clearTimeout(timeoutId);
  }, [
    searchQuery,
    selectedCity,
    radius,
    selectedCategoryId,
    selectedSubcategoryId,
    selectedQuickFilters,
    selectedPriceTier,
    selectedTimeFilter,
    selectedDate,
    selectedDateRange,
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

  const toggleQuickFilter = (filterId: string) => {
    setSelectedQuickFilters((prev) => (prev.includes(filterId) ? [] : [filterId]));
  };

  const getEventLocation = (event: ExternalEvent) => {
    return event.address_city || event.venue_name || event.location || "Schweiz";
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

  const filterContent = (
    <div className="space-y-5">
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase">WO / ORT</h3>
        <input
          type="text"
          placeholder="Stadt eingeben..."
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          list="cities"
          className="w-full px-4 py-2.5 rounded-xl text-sm border bg-white text-gray-800"
        />
        <datalist id="cities">
          {cities.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase">Stimmung</h3>
        <div className="grid grid-cols-3 gap-1.5">
          {quickFilters.map((f) => {
            const Icon = f.icon;
            const active = selectedQuickFilters.includes(f.id);
            return (
              <button
                key={f.id}
                onClick={() => toggleQuickFilter(f.id)}
                className={cn(
                  "aspect-[4/3] flex flex-col items-center justify-center rounded-xl transition-all p-1.5 border",
                  active ? "bg-blue-600 text-white" : "bg-white text-gray-800",
                )}
              >
                <Icon size={18} />
                <span className="text-[11px] mt-1">{f.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <button onClick={clearFilters} className="w-full py-2 text-xs text-gray-400 hover:text-gray-600">
        ✕ Filter zurücksetzen
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-10">
          <aside className="hidden lg:block w-[320px] flex-shrink-0">
            <div className="bg-neutral-900 rounded-2xl p-6 shadow-xl">{filterContent}</div>
            <p className="mt-4 px-2 text-xs text-neutral-500">
              {loading ? "Lädt..." : `${events.length} von ${totalEvents} Events`}
            </p>
          </aside>
          <main className="flex-1">
            {loading && (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-neutral-400" />
              </div>
            )}
            {!loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {events.map((event, i) => (
                  <Link key={event.id} to={`/event/${event.id}`} className="block group">
                    <article className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all">
                      <img
                        src={event.image_url || getPlaceholderImage(i)}
                        alt={event.title}
                        className="w-full aspect-[5/6] object-cover"
                      />
                      <div className="p-5">
                        <p className="text-xs text-neutral-400 mb-1">
                          {formatEventDate(
                            event.start_date,
                            event.external_id,
                            event.date_range_start,
                            event.date_range_end,
                            event.show_count,
                          )}
                        </p>
                        <h3 className="font-serif text-lg text-neutral-900 line-clamp-1">{event.title}</h3>
                        <div className="mt-1.5 flex items-center gap-1.5 text-sm text-neutral-500">
                          <MapPin size={14} className="text-red-500" />
                          <span>{getEventLocation(event)}</span>
                        </div>
                        {event.price_from && <p className="text-sm font-medium mt-2">ab CHF {event.price_from}</p>}
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
            <div ref={loadMoreRef} className="h-10" />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Listings;
