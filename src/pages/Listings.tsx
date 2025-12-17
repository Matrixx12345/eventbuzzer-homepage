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
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { format, parseISO, isSameYear } from "date-fns";
import { de } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { supabase } from "@/integrations/supabase/client";

// Assets
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
  is_range?: boolean;
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
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFamilyAgeFilter, setSelectedFamilyAgeFilter] = useState<string | null>(null);
  const [selectedAvailability, setSelectedAvailability] = useState<string | null>(null);
  const [dogFriendly, setDogFriendly] = useState(false);

  const [selectedIndoorFilter, setSelectedIndoorFilter] = useState<string | null>(null);
  const indoorFilters = [
    { id: "alles-indoor", label: "Alles bei Mistwetter", tags: ["schlechtwetter-indoor"] },
    { id: "mit-kindern", label: "Mit Kindern", tags: ["schlechtwetter-indoor", "familie-kinder"] },
  ];

  const familyAgeFilters = [
    { id: "alle", label: "Alle Altersgruppen", tag: "familie-kinder" },
    { id: "kleinkinder", label: "Kleinkinder (0-4 J.)", tag: "kleinkinder" },
    { id: "schulkinder", label: "Schulkinder (5-10 J.)", tag: "schulkinder" },
    { id: "teenager", label: "Teenager (ab 11 J.)", tag: "teenager" },
  ];

  const isFamilyFilterActive = selectedQuickFilters.includes("mit-kind");
  const isMistwetterFilterActive = selectedQuickFilters.includes("mistwetter");
  const isTopStarsActive = selectedQuickFilters.includes("top-stars");

  // Toggle Function
  const toggleQuickFilter = (filterId: string) => {
    const isCurrentlyActive = selectedQuickFilters.includes(filterId);
    if (isCurrentlyActive) {
      if (filterId === "mit-kind") setSelectedFamilyAgeFilter(null);
      if (filterId === "mistwetter") setSelectedIndoorFilter(null);
      setSelectedQuickFilters([]);
      return;
    }
    if (selectedQuickFilters.includes("mit-kind") && filterId !== "mit-kind") setSelectedFamilyAgeFilter(null);
    if (selectedQuickFilters.includes("mistwetter") && filterId !== "mistwetter") setSelectedIndoorFilter(null);
    if (filterId === "mit-kind") setSelectedFamilyAgeFilter("alle");
    if (filterId === "mistwetter") setSelectedIndoorFilter("alles-indoor");
    if (filterId === "top-stars") {
      setSelectedCategoryId(null);
      setSelectedSubcategoryId(null);
    }
    setSelectedQuickFilters([filterId]);
  };

  const mainCategories = useMemo(
    () => taxonomy.filter((t) => t.type === "main").sort((a, b) => a.name.localeCompare(b.name)),
    [taxonomy],
  );

  const subCategories = useMemo(() => {
    if (!selectedCategoryId) return [];
    return taxonomy
      .filter((t) => t.type === "sub" && t.parent_id === selectedCategoryId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [taxonomy, selectedCategoryId]);

  const timeFilters = [
    { id: "today", label: "Heute" },
    { id: "tomorrow", label: "Morgen" },
    { id: "thisWeek", label: "Wochenende" },
  ];

  const selectTimeFilter = (filterId: string) => {
    setSelectedTimeFilter((prev) => (prev === filterId ? null : filterId));
    setSelectedDateRange(undefined);
    setSelectedDate(undefined);
  };

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

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const buildFilters = useCallback(() => {
    const filters: Record<string, any> = {};
    if (searchQuery.trim()) filters.searchQuery = searchQuery.trim();

    if (isTopStarsActive) {
      if (vipArtists.length > 0) filters.vipArtistsFilter = vipArtists;
    } else {
      if (selectedCategoryId !== null) filters.categoryId = selectedCategoryId;
      if (selectedSubcategoryId !== null) filters.subcategoryId = selectedSubcategoryId;
    }

    if (selectedPriceTier) filters.priceTier = selectedPriceTier;
    if (selectedSource) filters.source = selectedSource;
    if (selectedTimeFilter) filters.timeFilter = selectedTimeFilter;
    if (selectedAvailability)
      filters.availability = selectedAvailability === "year-round" ? "yearround" : selectedAvailability;

    if (selectedDate) filters.singleDate = selectedDate.toISOString();
    if (selectedDateRange?.from) filters.dateFrom = selectedDateRange.from.toISOString();
    if (selectedDateRange?.to) filters.dateTo = selectedDateRange.to.toISOString();

    if (selectedCity && !isTopStarsActive) {
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

    const tags: string[] = [];
    if (selectedQuickFilters.includes("romantik")) tags.push("romantisch-date");
    if (selectedQuickFilters.includes("nightlife")) tags.push("nightlife-party");
    if (selectedQuickFilters.includes("mit-kind"))
      tags.push(
        selectedFamilyAgeFilter === "alle" || !selectedFamilyAgeFilter
          ? "familie-kinder"
          : selectedFamilyAgeFilter || "familie-kinder",
      );
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
    selectedFamilyAgeFilter,
    selectedIndoorFilter,
    isTopStarsActive,
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
        const filters = buildFilters();

        const { data, error: fetchError } = await supabase.functions.invoke("get-external-events", {
          body: { offset, limit: 50, initialLoad: isInitial, filters },
        });

        if (fetchError) throw new Error(fetchError.message);

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
        setError(err instanceof Error ? err.message : "Failed to load events");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [nextOffset, buildFilters],
  );

  // Initial Load
  useEffect(() => {
    fetchEvents(true);
  }, []);

  // Filter Change Load (Debounced to prevent loops)
  useEffect(() => {
    if (loading && events.length === 0) return;

    const timeoutId = setTimeout(() => {
      fetchEvents(true);
    }, 500);
    return () => clearTimeout(timeoutId);
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
    selectedFamilyAgeFilter,
    selectedIndoorFilter,
    dogFriendly,
    isTopStarsActive,
  ]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchEvents(false);
        }
      },
      { threshold: 0.1 },
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => {
      if (loadMoreRef.current) observer.unobserve(loadMoreRef.current);
    };
  }, [hasMore, loadingMore, loading, fetchEvents]);

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
    setSelectedSource(null);
    setSearchQuery("");
    setSelectedFamilyAgeFilter(null);
    setSelectedIndoorFilter(null);
    setSelectedAvailability(null);
    setDogFriendly(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setShowCalendar(false);
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setSelectedDateRange(range);
    if (!range || (range.from && range.to)) setShowCalendar(false);
  };

  const formatEventDate = (startString?: string, endString?: string, externalId?: string) => {
    if (!startString) {
      const isMySwitzerland = externalId?.startsWith("mys_");
      return isMySwitzerland ? "Jederzeit" : "Datum TBA";
    }
    try {
      const start = parseISO(startString);
      if (endString && startString !== endString) {
        const end = parseISO(endString);
        if (isSameYear(start, end)) {
          if (start.getMonth() === end.getMonth()) {
            return `${format(start, "d.", { locale: de })} – ${format(end, "d. MMM yyyy", { locale: de })}`;
          }
          return `${format(start, "d. MMM", { locale: de })} – ${format(end, "d. MMM yyyy", { locale: de })}`;
        }
        return `${format(start, "d. MMM yyyy", { locale: de })} – ${format(end, "d. MMM yyyy", { locale: de })}`;
      }
      return format(start, "d. MMM yyyy", { locale: de });
    } catch {
      return "Datum TBA";
    }
  };

  const getEventLocation = (event: ExternalEvent) => {
    if (event.address_city && event.address_city.trim() && event.address_city !== "Schweiz") return event.address_city;
    if (event.venue_name) return event.venue_name;
    return "Schweiz";
  };

  // Variable für Anzeige
  const filteredEvents = events;

  // HIER IST DIE FEHLENDE VARIABLE:
  const hasActiveFilters =
    selectedDate !== undefined ||
    selectedDateRange !== undefined ||
    selectedTimeFilter !== null ||
    selectedQuickFilters.length > 0 ||
    selectedPriceTier !== null ||
    selectedCity !== "" ||
    radius[0] > 0 ||
    selectedCategoryId !== null ||
    selectedSubcategoryId !== null ||
    selectedSource !== null ||
    searchQuery.trim() !== "" ||
    selectedAvailability !== null ||
    dogFriendly;

  const filterContent = (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">WO / ORT</h3>
          {isTopStarsActive && (
            <span className="text-xs font-medium text-amber-400 flex items-center gap-1">
              <Star size={12} className="fill-amber-400" /> National
            </span>
          )}
        </div>
        <div className="relative">
          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Stadt eingeben..."
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            list="cities"
            disabled={isTopStarsActive}
            className={cn(
              "w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all border",
              isTopStarsActive
                ? "bg-neutral-800 text-gray-500 border-neutral-700"
                : "bg-white text-gray-800 border-gray-200",
            )}
          />
          <datalist id="cities">
            {cities.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn("pt-1 px-1", isTopStarsActive && "opacity-50 cursor-not-allowed")}>
                <Slider
                  value={radius}
                  onValueChange={isTopStarsActive ? undefined : setRadius}
                  max={50}
                  step={5}
                  className="w-full"
                  disabled={isTopStarsActive}
                />
                <div className="flex justify-between items-center mt-1.5">
                  <span className="text-xs text-gray-400 font-medium">Umkreis</span>
                  <span className="text-sm font-semibold">{isTopStarsActive ? "∞" : `${radius[0]} km`}</span>
                </div>
              </div>
            </TooltipTrigger>
            {isTopStarsActive && <TooltipContent side="top">Schweizweit</TooltipContent>}
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Stimmung</h3>
        <div className="grid grid-cols-3 gap-1.5">
          {quickFilters.map((filter) => {
            const Icon = filter.icon;
            const isActive = selectedQuickFilters.includes(filter.id);
            return (
              <button
                key={filter.id}
                onClick={() => toggleQuickFilter(filter.id)}
                className={cn(
                  "aspect-[4/3] flex flex-col items-center justify-center rounded-xl p-1.5 transition-all",
                  isActive ? "bg-blue-600 text-white" : "bg-white border border-gray-200",
                )}
              >
                <Icon size={18} />
                <span className="text-[13px] font-medium mt-0.5">{filter.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 pt-3 border-t border-neutral-700">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Suche</h3>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Künstler, Event, Stichwort..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl text-sm text-gray-800 font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all border border-gray-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {hasActiveFilters && (
        <button onClick={clearFilters} className="w-full py-2 text-xs font-medium text-gray-400">
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
          <aside className="hidden lg:block w-[340px] flex-shrink-0 -mt-2">
            <div className="bg-neutral-900 rounded-2xl p-6 shadow-xl">{filterContent}</div>
            <div className="mt-4 px-2 text-xs text-neutral-500">
              {loading ? "Lädt..." : `${filteredEvents.length} von ${totalEvents} Events`}
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="lg:hidden mb-6">
              <button
                onClick={() => setShowMobileFilters(true)}
                className="flex items-center gap-2.5 px-5 py-3 bg-white shadow-sm rounded-full text-sm font-medium"
              >
                Filter anpassen
              </button>
            </div>

            {loading && (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
              </div>
            )}
            {error && !loading && <div className="text-center py-20 text-red-500">{error}</div>}

            {!loading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredEvents.map((event, index) => {
                  const eventImage = event.image_url || getPlaceholderImage(index);
                  return (
                    <Link key={event.id} to={`/event/${event.id}`} className="block group">
                      <article className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500">
                        <div className="relative overflow-hidden aspect-[5/6]">
                          <img
                            src={eventImage}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <button className="absolute top-3 right-3 p-2.5 rounded-full bg-white/95 shadow-sm">
                            <Heart
                              size={16}
                              className={isFavorite(event.id) ? "fill-red-500 text-red-500" : "text-neutral-500"}
                            />
                          </button>
                          {event.external_id && (
                            <div className="absolute bottom-2 left-2 bg-black/70 text-white px-1.5 py-0.5 rounded text-[10px] font-medium">
                              {event.external_id.startsWith("tm") ? "TM" : "MySW"}
                            </div>
                          )}
                        </div>
                        <div className="p-5">
                          <div className="flex justify-between mb-1.5">
                            <p className="text-xs text-neutral-400 font-medium">
                              {formatEventDate(event.start_date, event.end_date, event.external_id)}
                            </p>
                            <EventRatingButtons eventId={event.id} eventTitle={event.title} />
                          </div>
                          <h3 className="font-serif text-lg text-neutral-900 line-clamp-1">{event.title}</h3>
                          <div className="flex items-center gap-1.5 text-sm text-neutral-500 mt-1">
                            <MapPin size={14} className="text-red-500" />
                            <span className="truncate">{getEventLocation(event)}</span>
                            {selectedCity &&
                              radius[0] > 0 &&
                              event.latitude &&
                              event.longitude &&
                              (() => {
                                const c = findCityCoords(selectedCity);
                                if (c) {
                                  const d = calculateDistance(c.lat, c.lng, event.latitude, event.longitude);
                                  if (!isNaN(d) && d > 0)
                                    return (
                                      <span className="text-xs text-neutral-400 ml-1">• ca. {Math.round(d)} km</span>
                                    );
                                }
                                return null;
                              })()}
                          </div>
                        </div>
                      </article>
                    </Link>
                  );
                })}
              </div>
            )}
            {!loading && !error && filteredEvents.length === 0 && (
              <div className="text-center py-20 text-neutral-500">Keine Events gefunden.</div>
            )}
          </main>
        </div>
      </div>
      {/* Mobile & Calendar Dialogs */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2rem] p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
            {filterContent}
            <div className="sticky bottom-0 bg-white pt-6 mt-6 border-t border-neutral-100 flex gap-3">
              <button onClick={clearFilters} className="flex-1 py-4 bg-neutral-100 rounded-2xl text-sm font-medium">
                Zurücksetzen
              </button>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="flex-1 py-4 bg-neutral-900 text-white rounded-2xl text-sm font-medium"
              >
                {filteredEvents.length} Ergebnisse
              </button>
            </div>
          </div>
        </div>
      )}
      <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
          <div className="flex justify-center py-4">
            {calendarMode === "single" ? (
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="rounded-2xl"
                locale={de}
              />
            ) : (
              <Calendar
                mode="range"
                selected={selectedDateRange}
                onSelect={handleDateRangeSelect}
                className="rounded-2xl"
                locale={de}
                numberOfMonths={1}
              />
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCalendar(false)} className="flex-1 py-3 bg-neutral-900 text-white rounded-xl">
              Bestätigen
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Listings;
