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
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

// DIREKT-VERBINDUNG zu deinem externen Projekt
import { createClient } from "@supabase/supabase-js";
const EXTERNAL_URL = "https://tfkiyvhfhvkejpljsnrk.supabase.co";
const EXTERNAL_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRma2l5dmhmaHZrZWpwbGpzbnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDA4MDQsImV4cCI6MjA4MDY3NjgwNH0.bth3dTvG3fXSu4qILB514x1TRy0scRLo_KM9lDMMKDs";
const supabase = createClient(EXTERNAL_URL, EXTERNAL_KEY);

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
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalEvents, setTotalEvents] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [nextOffset, setNextOffset] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Filter States
  const [selectedCity, setSelectedCity] = useState("");
  const [radius, setRadius] = useState([0]);
  const [selectedQuickFilters, setSelectedQuickFilters] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string | null>(null);
  const [selectedPriceTier, setSelectedPriceTier] = useState<string | null>(null);
  const [dogFriendly, setDogFriendly] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined);
  const [calendarMode, setCalendarMode] = useState<"single" | "range">("single");

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

  // FIX: hasActiveFilters wieder eingebaut
  const hasActiveFilters =
    selectedCity !== "" || radius[0] > 0 || selectedQuickFilters.length > 0 || searchQuery.trim() !== "";

  const clearFilters = () => {
    setSelectedCity("");
    setRadius([0]);
    setSelectedQuickFilters([]);
    setSearchQuery("");
    setSelectedCategoryId(null);
    setSelectedSubcategoryId(null);
    setSelectedTimeFilter(null);
    setSelectedPriceTier(null);
    setDogFriendly(false);
  };

  const buildFilters = useCallback(() => {
    const filters: Record<string, any> = {};
    if (searchQuery.trim()) filters.searchQuery = searchQuery.trim();
    if (selectedCategoryId !== null) filters.categoryId = selectedCategoryId;
    if (selectedPriceTier) filters.priceTier = selectedPriceTier;
    if (selectedTimeFilter) filters.timeFilter = selectedTimeFilter;
    if (selectedCity) {
      filters.city = selectedCity;
      if (radius[0] > 0) {
        filters.radius = radius[0];
        const coords = CITY_COORDINATES[selectedCity.toLowerCase().trim()];
        if (coords) {
          filters.cityLat = coords.lat;
          filters.cityLng = coords.lng;
        }
      }
    }
    const tags: string[] = [];
    selectedQuickFilters.forEach((id) => {
      const found = quickFilters.find((f) => f.id === id);
      if (found) tags.push(...found.tags);
    });
    if (tags.length > 0) filters.tags = tags;
    return filters;
  }, [
    searchQuery,
    selectedCategoryId,
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
        } else setLoadingMore(true);
        const offset = isInitial ? 0 : nextOffset;
        const filters = buildFilters();
        const { data, error } = await supabase.functions.invoke("get-external-events", {
          body: { offset, limit: 30, initialLoad: isInitial, filters },
        });
        if (error) throw error;
        if (data?.events) {
          setEvents((prev) => (isInitial ? data.events : [...prev, ...data.events]));
        }
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

  useEffect(() => {
    const t = setTimeout(() => fetchEvents(true), 400);
    return () => clearTimeout(t);
  }, [
    searchQuery,
    selectedCity,
    radius,
    selectedCategoryId,
    selectedQuickFilters,
    selectedPriceTier,
    selectedTimeFilter,
  ]);

  const getEventLocation = (event: ExternalEvent) =>
    event.address_city || event.venue_name || event.location || "Schweiz";

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
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">WO / ORT</h3>
        <div className="relative">
          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Stadt eingeben..."
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            list="cities"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border bg-white"
          />
          <datalist id="cities">
            {cities.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div className="pt-1 px-1">
          <Slider value={radius} onValueChange={setRadius} max={50} step={5} className="w-full" />
          <div className="flex justify-between items-center mt-1.5">
            <span className="text-xs text-gray-400 font-medium">Umkreis</span>
            <span className="text-sm font-semibold tabular-nums border px-2 py-0.5 rounded-lg bg-white">
              {radius[0]} km
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Stimmung</h3>
        <div className="grid grid-cols-3 gap-1.5">
          {quickFilters.map((f) => {
            const Icon = f.icon;
            const active = selectedQuickFilters.includes(f.id);
            return (
              <button
                key={f.id}
                onClick={() => setSelectedQuickFilters((prev) => (prev.includes(f.id) ? [] : [f.id]))}
                className={cn(
                  "aspect-[4/3] flex flex-col items-center justify-center rounded-xl transition-all p-1.5 border",
                  active ? "bg-blue-600 text-white" : "bg-white text-gray-800",
                )}
              >
                <Icon size={18} />
                <span className="text-[13px] font-medium leading-tight mt-0.5">{f.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {hasActiveFilters && (
        <button onClick={clearFilters} className="w-full py-2 text-xs font-medium text-gray-400 hover:text-gray-600">
          ✕ Filter zurücksetzen
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-10">
          <aside className="hidden lg:block w-[340px] flex-shrink-0">
            <div className="bg-neutral-900 rounded-2xl p-6 shadow-xl">{filterContent}</div>
            <div className="mt-4 px-2 text-xs text-neutral-500">
              {loading ? (
                "Lädt..."
              ) : (
                <>
                  <p>
                    {events.length} von {totalEvents} Events
                  </p>
                </>
              )}
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="lg:hidden mb-6">
              <button
                onClick={() => setShowMobileFilters(true)}
                className="flex items-center gap-2.5 px-5 py-3 bg-white shadow-sm rounded-full text-sm font-medium"
              >
                <SlidersHorizontal size={16} /> Filter
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {events.map((event, index) => (
                  <Link key={event.id} to={`/event/${event.id}`} className="block group">
                    <article className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                      <div className="relative overflow-hidden">
                        <img
                          src={event.image_url || getPlaceholderImage(index)}
                          alt={event.title}
                          className="w-full aspect-[5/6] object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            toggleFavorite({
                              id: event.id,
                              slug: event.id, // FIX: slug hinzugefügt
                              title: event.title,
                              venue: event.venue_name || "", // FIX: venue hinzugefügt
                              image: event.image_url || getPlaceholderImage(index),
                              location: getEventLocation(event),
                              date: formatEventDate(event.start_date),
                            });
                          }}
                          className="absolute top-3 right-3 p-2.5 rounded-full bg-white/95 shadow-sm"
                        >
                          <Heart
                            size={16}
                            className={isFavorite(event.id) ? "fill-red-500 text-red-500" : "text-neutral-500"}
                          />
                        </button>
                      </div>
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-xs text-neutral-400 font-medium">
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
                        <h3 className="font-serif text-lg text-neutral-900 line-clamp-1">{event.title}</h3>

                        <div className="group/map relative mt-1.5 cursor-help">
                          <div className="flex items-center gap-1.5 text-sm text-neutral-500">
                            <MapPin size={14} className="text-red-500" />
                            <span className="truncate">{getEventLocation(event)}</span>
                            {event.latitude && (
                              <span className="text-neutral-400 text-xs whitespace-nowrap">• Karte ansehen</span>
                            )}
                          </div>
                          {event.latitude && event.longitude && (
                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover/map:block z-50 animate-in fade-in zoom-in duration-200">
                              <div className="bg-white p-3 rounded-xl shadow-2xl border w-48 h-40">
                                <div className="relative w-full h-full bg-slate-50 rounded-lg overflow-hidden">
                                  <img src="/swiss-outline.svg" className="w-full h-full object-contain" />
                                  <div
                                    className="absolute w-3 h-3 bg-red-600 rounded-full border-2 border-white"
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

                        {event.price_from && (
                          <p className="text-sm font-medium text-neutral-900 mt-2">ab CHF {event.price_from}</p>
                        )}
                        {event.short_description && (
                          <p className="text-xs text-neutral-500 mt-2 line-clamp-2">{event.short_description}</p>
                        )}
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
            <div ref={loadMoreRef} className="h-20 flex justify-center items-center">
              {loadingMore && <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Listings;
